import { api } from "encore.dev/api";
import db from "../db";

export interface CreateStockRequest {
  name: string;
  quantity: number;
  purchasePrice?: number;
  location?: string;
  courseTag?: string;
}

export interface StockItem {
  id: number;
  name: string;
  quantity: number;
  availableQuantity: number;
  purchasePrice?: number;
  location?: string;
  courseTag?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new stock item.
export const create = api<CreateStockRequest, StockItem>(
  { expose: true, method: "POST", path: "/stock" },
  async (req) => {
    const now = new Date();
    const status = req.quantity > 0 ? "in_stock" : "out_of_stock";
    
    const item = await db.queryRow<StockItem>`
      INSERT INTO stock_items (name, quantity, available_quantity, purchase_price, location, course_tag, status, created_at, updated_at)
      VALUES (${req.name}, ${req.quantity}, ${req.quantity}, ${req.purchasePrice || null}, ${req.location || null}, ${req.courseTag || null}, ${status}, ${now}, ${now})
      RETURNING id, name, quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice", location, course_tag as "courseTag", status, created_at as "createdAt", updated_at as "updatedAt"
    `;

    // Record stock transaction
    if (req.quantity > 0) {
      await db.exec`
        INSERT INTO stock_transactions (stock_item_id, type, quantity, reason, performed_by, date)
        VALUES (${item!.id}, 'in', ${req.quantity}, 'Initial stock', 'System', ${now})
      `;
    }

    return item!;
  }
);
