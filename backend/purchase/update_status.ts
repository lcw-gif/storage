import { api } from "encore.dev/api";
import db from "../db";
import { stock } from "~encore/clients";
import { PurchaseItem } from "./create";

export interface UpdateStatusRequest {
  id: number;
  status: string;
}

// Updates the status of a purchase item and creates stock item if arriving.
export const updateStatus = api<UpdateStatusRequest, PurchaseItem>(
  { expose: true, method: "PATCH", path: "/purchase/:id/status" },
  async (req) => {
    const now = new Date();
    
    // Get current item to check status restrictions
    const currentItem = await db.queryRow<PurchaseItem>`
      SELECT id, name, where_to_buy as "whereToBuy", price, quantity, course_tag as "courseTag", link, status, created_at as "createdAt", updated_at as "updatedAt"
      FROM purchase_items 
      WHERE id = ${req.id}
    `;

    if (!currentItem) {
      throw new Error("Purchase item not found");
    }

    // Prevent status change if already arrived or stored
    if (currentItem.status === "arrived" || currentItem.status === "stored") {
      throw new Error("Cannot change status of items that have already arrived or been stored");
    }
    
    // Update purchase item status
    const item = await db.queryRow<PurchaseItem>`
      UPDATE purchase_items 
      SET status = ${req.status}, updated_at = ${now}
      WHERE id = ${req.id}
      RETURNING id, name, where_to_buy as "whereToBuy", price, quantity, course_tag as "courseTag", link, status, created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!item) {
      throw new Error("Failed to update purchase item");
    }

    // If status is arrived or stored, create/update stock item
    if (req.status === "arrived" || req.status === "stored") {
      await stock.addFromPurchase({
        name: item.name,
        quantity: item.quantity,
        purchasePrice: item.price,
        courseTag: item.courseTag,
      });
    }

    return item;
  }
);
