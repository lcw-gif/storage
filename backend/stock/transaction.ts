import { api } from "encore.dev/api";
import db from "../db";

export interface StockTransactionRequest {
  stockItemId: number;
  type: "in" | "out";
  quantity: number;
  reason?: string;
  performedBy: string;
}

export interface StockTransaction {
  id: number;
  stockItemId: number;
  type: string;
  quantity: number;
  reason?: string;
  performedBy: string;
  date: Date;
}

// Records a stock transaction and updates stock levels.
export const transaction = api<StockTransactionRequest, StockTransaction>(
  { expose: true, method: "POST", path: "/stock/transaction" },
  async (req) => {
    const now = new Date();
    
    // Get current stock item
    const stockItem = await db.queryRow<{quantity: number, availableQuantity: number}>`
      SELECT quantity, available_quantity as "availableQuantity"
      FROM stock_items 
      WHERE id = ${req.stockItemId}
    `;

    if (!stockItem) {
      throw new Error("Stock item not found");
    }

    // Calculate new quantities
    let newQuantity = stockItem.quantity;
    let newAvailableQuantity = stockItem.availableQuantity;

    if (req.type === "in") {
      newQuantity += req.quantity;
      newAvailableQuantity += req.quantity;
    } else {
      newQuantity -= req.quantity;
      newAvailableQuantity -= req.quantity;
    }

    // Determine new status
    let status = "in_stock";
    if (newQuantity <= 0) {
      status = "out_of_stock";
    } else if (newQuantity < 10) {
      status = "low_stock";
    }

    // Update stock item
    await db.exec`
      UPDATE stock_items 
      SET quantity = ${newQuantity}, available_quantity = ${newAvailableQuantity}, status = ${status}, updated_at = ${now}
      WHERE id = ${req.stockItemId}
    `;

    // Record transaction
    const transaction = await db.queryRow<StockTransaction>`
      INSERT INTO stock_transactions (stock_item_id, type, quantity, reason, performed_by, date)
      VALUES (${req.stockItemId}, ${req.type}, ${req.quantity}, ${req.reason || null}, ${req.performedBy}, ${now})
      RETURNING id, stock_item_id as "stockItemId", type, quantity, reason, performed_by as "performedBy", date
    `;

    return transaction!;
  }
);
