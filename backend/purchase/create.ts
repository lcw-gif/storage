import { api } from "encore.dev/api";
import db from "../db";

export interface CreatePurchaseRequest {
  name: string;
  whereToBuy?: string;
  price?: number;
  quantity: number;
  courseTag?: string;
  link?: string;
}

export interface PurchaseItem {
  id: number;
  name: string;
  whereToBuy?: string;
  price?: number;
  quantity: number;
  courseTag?: string;
  link?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new purchase item.
export const create = api<CreatePurchaseRequest, PurchaseItem>(
  { expose: true, method: "POST", path: "/purchase" },
  async (req) => {
    const now = new Date();
    const item = await db.queryRow<PurchaseItem>`
      INSERT INTO purchase_items (name, where_to_buy, price, quantity, course_tag, link, created_at, updated_at)
      VALUES (${req.name}, ${req.whereToBuy || null}, ${req.price || null}, ${req.quantity}, ${req.courseTag || null}, ${req.link || null}, ${now}, ${now})
      RETURNING id, name, where_to_buy as "whereToBuy", price, quantity, course_tag as "courseTag", link, status, created_at as "createdAt", updated_at as "updatedAt"
    `;
    return item!;
  }
);
