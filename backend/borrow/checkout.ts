import { api } from "encore.dev/api";
import db from "../db";

export interface CheckoutRequest {
  stockItemId: number;
  borrowedBy: string;
  borrowedQuantity: number;
  expectedReturnDate: Date;
  remarks?: string;
}

export interface BorrowRecord {
  id: number;
  stockItemId: number;
  itemName: string;
  borrowedBy: string;
  borrowedQuantity: number;
  borrowDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  status: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new borrow record and updates stock availability.
export const checkout = api<CheckoutRequest, BorrowRecord>(
  { expose: true, method: "POST", path: "/borrow/checkout" },
  async (req) => {
    const now = new Date();
    
    // Get stock item details and check availability
    const stockItem = await db.queryRow<{name: string, availableQuantity: number}>`
      SELECT name, available_quantity as "availableQuantity"
      FROM stock_items 
      WHERE id = ${req.stockItemId}
    `;

    if (!stockItem) {
      throw new Error("Stock item not found");
    }

    if (stockItem.availableQuantity < req.borrowedQuantity) {
      throw new Error("Insufficient available quantity");
    }

    // Update available quantity
    const newAvailableQuantity = stockItem.availableQuantity - req.borrowedQuantity;
    await db.exec`
      UPDATE stock_items 
      SET available_quantity = ${newAvailableQuantity}, updated_at = ${now}
      WHERE id = ${req.stockItemId}
    `;

    // Create borrow record
    const borrowRecord = await db.queryRow<BorrowRecord>`
      INSERT INTO borrow_records (stock_item_id, item_name, borrowed_by, borrowed_quantity, borrow_date, expected_return_date, status, remarks, created_at, updated_at)
      VALUES (${req.stockItemId}, ${stockItem.name}, ${req.borrowedBy}, ${req.borrowedQuantity}, ${now}, ${req.expectedReturnDate}, 'active', ${req.remarks}, ${now}, ${now})
      RETURNING id, stock_item_id as "stockItemId", item_name as "itemName", borrowed_by as "borrowedBy", borrowed_quantity as "borrowedQuantity", borrow_date as "borrowDate", expected_return_date as "expectedReturnDate", actual_return_date as "actualReturnDate", status, remarks, created_at as "createdAt", updated_at as "updatedAt"
    `;

    return borrowRecord!;
  }
);
