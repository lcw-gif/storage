import { api } from "encore.dev/api";
import db from "../db";

export interface DeletePurchaseRequest {
  id: number;
}

// Deletes a purchase item.
export const deletePurchase = api<DeletePurchaseRequest, void>(
  { expose: true, method: "DELETE", path: "/purchase/:id" },
  async (req) => {
    await db.exec`DELETE FROM purchase_items WHERE id = ${req.id}`;
  }
);
