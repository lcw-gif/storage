import { api } from "encore.dev/api";
import db from "../db";
import { StockItem } from "./create";

export interface ListStockResponse {
  items: StockItem[];
}

// Retrieves all stock items, ordered by creation date (latest first).
export const list = api<void, ListStockResponse>(
  { expose: true, method: "GET", path: "/stock" },
  async () => {
    const items = await db.queryAll<StockItem>`
      SELECT id, name, quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice", location, course_tag as "courseTag", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM stock_items
      ORDER BY created_at DESC
    `;
    return { items };
  }
);
