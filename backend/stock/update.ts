import { api } from "encore.dev/api";
import db from "../db";
import { StockItem } from "./create";

export interface UpdateStockRequest {
  id: number;
  name?: string;
  purchasePrice?: number;
  location?: string;
  courseTag?: string;
}

// Updates stock item details (not quantity - use transactions for that).
export const update = api<UpdateStockRequest, StockItem>(
  { expose: true, method: "PATCH", path: "/stock/:id" },
  async (req) => {
    const now = new Date();
    
    // Get current item first
    const currentItem = await db.queryRow<StockItem>`
      SELECT id, name, quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice", location, course_tag as "courseTag", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM stock_items 
      WHERE id = ${req.id}
    `;

    if (!currentItem) {
      throw new Error("Stock item not found");
    }

    // Use provided values or keep current ones
    const updatedName = req.name !== undefined ? req.name : currentItem.name;
    const updatedPrice = req.purchasePrice !== undefined ? req.purchasePrice : currentItem.purchasePrice;
    const updatedLocation = req.location !== undefined ? req.location : currentItem.location;
    const updatedCourseTag = req.courseTag !== undefined ? req.courseTag : currentItem.courseTag;
    
    const item = await db.queryRow<StockItem>`
      UPDATE stock_items 
      SET name = ${updatedName}, purchase_price = ${updatedPrice}, location = ${updatedLocation}, course_tag = ${updatedCourseTag}, updated_at = ${now}
      WHERE id = ${req.id}
      RETURNING id, name, quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice", location, course_tag as "courseTag", status, created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!item) {
      throw new Error("Failed to update stock item");
    }

    return item;
  }
);