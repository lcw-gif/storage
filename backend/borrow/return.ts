import { api } from "encore.dev/api";
import db from "../db";
import { BorrowRecord } from "./checkout";

export interface ReturnRequest {
  id: number;
  returnedQuantity: number;
}

// Returns borrowed items and updates stock availability.
export const returnItem = api<ReturnRequest, BorrowRecord>(
  { expose: true, method: "PATCH", path: "/borrow/:id/return" },
  async (req) => {
    const now = new Date();
    
    // Get borrow record
    const borrowRecord = await db.queryRow<{stockItemId: number, borrowedQuantity: number, status: string}>`
      SELECT stock_item_id as "stockItemId", borrowed_quantity as "borrowedQuantity", status
      FROM borrow_records 
      WHERE id = ${req.id}
    `;

    if (!borrowRecord) {
      throw new Error("Borrow record not found");
    }

    if (borrowRecord.status !== "active") {
      throw new Error("Borrow record is not active");
    }

    // Update available quantity in stock
    await db.exec`
      UPDATE stock_items 
      SET available_quantity = available_quantity + ${req.returnedQuantity}
      WHERE id = ${borrowRecord.stockItemId}
    `;

    // Update borrow record
    const status = req.returnedQuantity >= borrowRecord.borrowedQuantity ? "returned" : "partially_returned";
    
    const updatedRecord = await db.queryRow<BorrowRecord>`
      UPDATE borrow_records 
      SET actual_return_date = ${now}, status = ${status}, updated_at = ${now}
      WHERE id = ${req.id}
      RETURNING id, stock_item_id as "stockItemId", item_name as "itemName", borrowed_by as "borrowedBy", borrowed_quantity as "borrowedQuantity", borrow_date as "borrowDate", expected_return_date as "expectedReturnDate", actual_return_date as "actualReturnDate", status, created_at as "createdAt", updated_at as "updatedAt"
    `;

    return updatedRecord!;
  }
);
