import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../db";

export interface GlobalSearchRequest {
  query: Query<string>;
  type?: Query<string>;
}

export interface SearchResult {
  id: number;
  type: string;
  name: string;
  status: string;
  details: Record<string, any>;
}

export interface GlobalSearchResponse {
  results: SearchResult[];
}

// Searches across all data types in the system.
export const global = api<GlobalSearchRequest, GlobalSearchResponse>(
  { expose: true, method: "GET", path: "/search" },
  async (req) => {
    const results: SearchResult[] = [];
    const searchTerm = `%${req.query}%`;

    // Search purchases
    if (!req.type || req.type === "purchase") {
      const purchases = await db.queryAll<any>`
        SELECT id, name, status, where_to_buy as "whereToBuy", price, quantity, course_tag as "courseTag"
        FROM purchase_items 
        WHERE name ILIKE ${searchTerm} OR course_tag ILIKE ${searchTerm}
      `;
      
      for (const purchase of purchases) {
        results.push({
          id: purchase.id,
          type: "purchase",
          name: purchase.name,
          status: purchase.status,
          details: purchase,
        });
      }
    }

    // Search stock
    if (!req.type || req.type === "stock") {
      const stock = await db.queryAll<any>`
        SELECT id, name, status, quantity, available_quantity as "availableQuantity", location, course_tag as "courseTag"
        FROM stock_items 
        WHERE name ILIKE ${searchTerm} OR course_tag ILIKE ${searchTerm} OR location ILIKE ${searchTerm}
      `;
      
      for (const item of stock) {
        results.push({
          id: item.id,
          type: "stock",
          name: item.name,
          status: item.status,
          details: item,
        });
      }
    }

    // Search borrows
    if (!req.type || req.type === "borrow") {
      const borrows = await db.queryAll<any>`
        SELECT id, item_name as "itemName", status, borrowed_by as "borrowedBy", borrowed_quantity as "borrowedQuantity"
        FROM borrow_records 
        WHERE item_name ILIKE ${searchTerm} OR borrowed_by ILIKE ${searchTerm}
      `;
      
      for (const borrow of borrows) {
        results.push({
          id: borrow.id,
          type: "borrow",
          name: borrow.itemName,
          status: borrow.status,
          details: borrow,
        });
      }
    }

    return { results };
  }
);
