import { api } from "encore.dev/api";
import db from "../db";

export interface DashboardStats {
  totalPurchases: number;
  pendingDeliveries: number;
  stockItems: number;
  lowStockAlert: number;
  activeBorrows: number;
  borrowedQuantity: number;
}

export interface RecentPurchase {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
}

export interface LowStockItem {
  id: number;
  name: string;
  quantity: number;
  location?: string;
}

export interface ActiveBorrow {
  id: number;
  itemName: string;
  borrowedBy: string;
  borrowedQuantity: number;
  expectedReturnDate: Date;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentPurchases: RecentPurchase[];
  lowStockItems: LowStockItem[];
  activeBorrows: ActiveBorrow[];
}

// Retrieves dashboard analytics and overview data.
export const dashboard = api<void, DashboardResponse>(
  { expose: true, method: "GET", path: "/analytics/dashboard" },
  async () => {
    // Get statistics
    const [
      totalPurchases,
      pendingDeliveries,
      stockItems,
      lowStockAlert,
      activeBorrows,
      borrowedQuantity,
    ] = await Promise.all([
      db.queryRow<{count: number}>`SELECT COUNT(*) as count FROM purchase_items`,
      db.queryRow<{count: number}>`SELECT COUNT(*) as count FROM purchase_items WHERE status IN ('considering', 'waiting_delivery')`,
      db.queryRow<{count: number}>`SELECT COUNT(*) as count FROM stock_items`,
      db.queryRow<{count: number}>`SELECT COUNT(*) as count FROM stock_items WHERE status = 'low_stock' OR quantity < 10`,
      db.queryRow<{count: number}>`SELECT COUNT(*) as count FROM borrow_records WHERE status = 'active'`,
      db.queryRow<{total: number}>`SELECT COALESCE(SUM(borrowed_quantity), 0) as total FROM borrow_records WHERE status = 'active'`,
    ]);

    const stats: DashboardStats = {
      totalPurchases: totalPurchases?.count || 0,
      pendingDeliveries: pendingDeliveries?.count || 0,
      stockItems: stockItems?.count || 0,
      lowStockAlert: lowStockAlert?.count || 0,
      activeBorrows: activeBorrows?.count || 0,
      borrowedQuantity: borrowedQuantity?.total || 0,
    };

    // Get recent purchases
    const recentPurchases = await db.queryAll<RecentPurchase>`
      SELECT id, name, status, created_at as "createdAt"
      FROM purchase_items 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    // Get low stock items
    const lowStockItems = await db.queryAll<LowStockItem>`
      SELECT id, name, quantity, location
      FROM stock_items 
      WHERE status = 'low_stock' OR quantity < 10
      ORDER BY quantity ASC
      LIMIT 5
    `;

    // Get active borrows
    const activeBorrowRecords = await db.queryAll<ActiveBorrow>`
      SELECT id, item_name as "itemName", borrowed_by as "borrowedBy", borrowed_quantity as "borrowedQuantity", expected_return_date as "expectedReturnDate"
      FROM borrow_records 
      WHERE status = 'active'
      ORDER BY expected_return_date ASC
      LIMIT 5
    `;

    return {
      stats,
      recentPurchases,
      lowStockItems,
      activeBorrows: activeBorrowRecords,
    };
  }
);
