import { api } from "encore.dev/api";
import db from "../db";
import { PurchaseItem } from "./create";

export interface ListPurchaseResponse {
  items: PurchaseItem[];
}

// Retrieves all purchase items, ordered by creation date (latest first).
export const list = api<void, ListPurchaseResponse>(
  { expose: true, method: "GET", path: "/purchase" },
  async () => {
    const items = await db.queryAll<PurchaseItem>`
      SELECT id, name, where_to_buy as "whereToBuy", price, quantity, course_tag as "courseTag", link, status, created_at as "createdAt", updated_at as "updatedAt"
      FROM purchase_items
      ORDER BY created_at DESC
    `;
    return { items };
  }
);
