import { api } from "encore.dev/api";
import db from "../db";
import { BorrowRecord } from "./checkout";

export interface ListBorrowResponse {
  records: BorrowRecord[];
}

// Retrieves all borrow records, ordered by borrow date (latest first).
export const list = api<void, ListBorrowResponse>(
  { expose: true, method: "GET", path: "/borrow" },
  async () => {
    const records = await db.queryAll<BorrowRecord>`
      SELECT id, stock_item_id as "stockItemId", item_name as "itemName", borrowed_by as "borrowedBy", borrowed_quantity as "borrowedQuantity", borrow_date as "borrowDate", expected_return_date as "expectedReturnDate", actual_return_date as "actualReturnDate", status, remarks, created_at as "createdAt", updated_at as "updatedAt"
      FROM borrow_records
      ORDER BY borrow_date DESC
    `;
    return { records };
  }
);
