import { api } from "encore.dev/api";
import db from "../db";
import { StockItem } from "./create";

export interface AddFromPurchaseRequest {
  name: string;
  quantity: number;
  purchasePrice?: number;
  courseTag?: string;
}

// Adds stock from a purchase item, updating existing item if present.
export const addFromPurchase = api<AddFromPurchaseRequest, StockItem>(
  { expose: true, method: "POST", path: "/stock/from-purchase" },
  async (req) => {
    const now = new Date();
    
    // Check if item already exists
    const existingItem = await db.queryRow<StockItem>`
      SELECT id, name, quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice", location, course_tag as "courseTag", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM stock_items 
      WHERE name = ${req.name} AND course_tag = ${req.courseTag || null}
    `;

    let item: StockItem;
    
    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + req.quantity;
      const newAvailableQuantity = existingItem.availableQuantity + req.quantity;
      const status = newQuantity > 0 ? "in_stock" : "out_of_stock";
      
      const updatedItem = await db.queryRow<StockItem>`
        UPDATE stock_items 
        SET quantity = ${newQuantity}, available_quantity = ${newAvailableQuantity}, status = ${status}, updated_at = ${now}
        WHERE id = ${existingItem.id}
        RETURNING id, name, quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice", location, course_tag as "courseTag", status, created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      if (!updatedItem) {
        throw new Error("Failed to update stock item");
      }
      item = updatedItem;
    } else {
      // Create new item
      const status = req.quantity > 0 ? "in_stock" : "out_of_stock";
      
      const newItem = await db.queryRow<StockItem>`
        INSERT INTO stock_items (name, quantity, available_quantity, purchase_price, course_tag, status, created_at, updated_at)
        VALUES (${req.name}, ${req.quantity}, ${req.quantity}, ${req.purchasePrice || null}, ${req.courseTag || null}, ${status}, ${now}, ${now})
        RETURNING id, name, quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice", location, course_tag as "courseTag", status, created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      if (!newItem) {
        throw new Error("Failed to create stock item");
      }
      item = newItem;
    }

    // Record stock transaction
    await db.exec`
      INSERT INTO stock_transactions (stock_item_id, type, quantity, reason, performed_by, date)
      VALUES (${item.id}, 'in', ${req.quantity}, 'From purchase', 'System', ${now})
    `;

    return item;
  }
);
