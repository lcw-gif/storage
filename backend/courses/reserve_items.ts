import { api } from "encore.dev/api";
import db from "../db";

export interface ReserveItemsRequest {
  courseId: number;
}

export interface ReserveItemsResponse {
  success: boolean;
  reservedItems: number;
  failedItems: string[];
}

// Reserves items for a course (marks them as unavailable for borrowing).
export const reserveItems = api<ReserveItemsRequest, ReserveItemsResponse>(
  { expose: true, method: "POST", path: "/courses/:courseId/reserve" },
  async (req) => {
    const now = new Date();
    let reservedCount = 0;
    const failedItems: string[] = [];

    // Get all sufficient course items
    const courseItems = await db.queryAll<{
      id: number;
      stockItemId: number;
      itemName: string;
      requiredQuantity: number;
    }>`
      SELECT id, stock_item_id as "stockItemId", item_name as "itemName", required_quantity as "requiredQuantity"
      FROM course_items
      WHERE course_id = ${req.courseId} AND status = 'sufficient' AND stock_item_id IS NOT NULL
    `;

    for (const item of courseItems) {
      try {
        // Check current available quantity
        const stockItem = await db.queryRow<{availableQuantity: number}>`
          SELECT available_quantity as "availableQuantity"
          FROM stock_items
          WHERE id = ${item.stockItemId}
        `;

        if (!stockItem || stockItem.availableQuantity < item.requiredQuantity) {
          failedItems.push(`${item.itemName} (insufficient stock)`);
          continue;
        }

        // Reserve the items (reduce available quantity)
        const newAvailableQuantity = stockItem.availableQuantity - item.requiredQuantity;
        await db.exec`
          UPDATE stock_items 
          SET available_quantity = ${newAvailableQuantity}, updated_at = ${now}
          WHERE id = ${item.stockItemId}
        `;

        // Update course item status
        await db.exec`
          UPDATE course_items 
          SET reserved_quantity = ${item.requiredQuantity}, status = 'reserved', updated_at = ${now}
          WHERE id = ${item.id}
        `;

        // Record stock transaction
        await db.exec`
          INSERT INTO stock_transactions (stock_item_id, type, quantity, reason, performed_by, date)
          VALUES (${item.stockItemId}, 'out', ${item.requiredQuantity}, 'Reserved for course', 'System', ${now})
        `;

        reservedCount++;
      } catch (error) {
        failedItems.push(`${item.itemName} (reservation failed)`);
      }
    }

    // Update course status if all items are reserved
    if (failedItems.length === 0 && courseItems.length > 0) {
      await db.exec`
        UPDATE courses 
        SET status = 'active', updated_at = ${now}
        WHERE id = ${req.courseId}
      `;
    }

    return {
      success: failedItems.length === 0,
      reservedItems: reservedCount,
      failedItems,
    };
  }
);