import { api } from "encore.dev/api";
import db from "../db";

export interface CompleteCourseRequest {
  courseId: number;
  returnItems: boolean; // Whether to return items to stock or deduct them
}

export interface CompleteCourseResponse {
  success: boolean;
  returnedItems: number;
  deductedItems: number;
}

// Completes a course and either returns items to stock or deducts them permanently.
export const completeCourse = api<CompleteCourseRequest, CompleteCourseResponse>(
  { expose: true, method: "POST", path: "/courses/:courseId/complete" },
  async (req) => {
    const now = new Date();
    let returnedCount = 0;
    let deductedCount = 0;

    // Get all reserved course items
    const courseItems = await db.queryAll<{
      id: number;
      stockItemId: number;
      itemName: string;
      reservedQuantity: number;
    }>`
      SELECT id, stock_item_id as "stockItemId", item_name as "itemName", reserved_quantity as "reservedQuantity"
      FROM course_items
      WHERE course_id = ${req.courseId} AND status = 'reserved' AND stock_item_id IS NOT NULL
    `;

    for (const item of courseItems) {
      if (req.returnItems) {
        // Return items to available stock
        await db.exec`
          UPDATE stock_items 
          SET available_quantity = available_quantity + ${item.reservedQuantity}, updated_at = ${now}
          WHERE id = ${item.stockItemId}
        `;

        // Record stock transaction for return
        await db.exec`
          INSERT INTO stock_transactions (stock_item_id, type, quantity, reason, performed_by, date)
          VALUES (${item.stockItemId}, 'in', ${item.reservedQuantity}, 'Returned from course', 'System', ${now})
        `;

        returnedCount++;
      } else {
        // Deduct items permanently (reduce total quantity)
        await db.exec`
          UPDATE stock_items 
          SET quantity = quantity - ${item.reservedQuantity}, updated_at = ${now}
          WHERE id = ${item.stockItemId}
        `;

        // Record stock transaction for deduction
        await db.exec`
          INSERT INTO stock_transactions (stock_item_id, type, quantity, reason, performed_by, date)
          VALUES (${item.stockItemId}, 'out', ${item.reservedQuantity}, 'Used in course (permanent)', 'System', ${now})
        `;

        deductedCount++;
      }

      // Update course item status
      await db.exec`
        UPDATE course_items 
        SET status = ${req.returnItems ? 'returned' : 'used'}, updated_at = ${now}
        WHERE id = ${item.id}
      `;
    }

    // Update course status to completed
    await db.exec`
      UPDATE courses 
      SET status = 'completed', updated_at = ${now}
      WHERE id = ${req.courseId}
    `;

    return {
      success: true,
      returnedItems: returnedCount,
      deductedItems: deductedCount,
    };
  }
);