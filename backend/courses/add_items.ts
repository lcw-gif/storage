import { api } from "encore.dev/api";
import db from "../db";

export interface CourseItemRequest {
  itemName: string;
  requiredQuantity: number;
}

export interface AddItemsRequest {
  courseId: number;
  items: CourseItemRequest[];
}

export interface CourseItem {
  id: number;
  courseId: number;
  stockItemId?: number;
  itemName: string;
  requiredQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddItemsResponse {
  items: CourseItem[];
  summary: {
    totalItems: number;
    sufficientItems: number;
    insufficientItems: number;
  };
}

// Adds items to a course and checks stock availability.
export const addItems = api<AddItemsRequest, AddItemsResponse>(
  { expose: true, method: "POST", path: "/courses/:courseId/items" },
  async (req) => {
    const now = new Date();
    const items: CourseItem[] = [];
    let sufficientCount = 0;
    let insufficientCount = 0;

    for (const itemReq of req.items) {
      // Check if stock item exists
      const stockItem = await db.queryRow<{id: number, availableQuantity: number}>`
        SELECT id, available_quantity as "availableQuantity"
        FROM stock_items 
        WHERE name ILIKE ${itemReq.itemName}
        ORDER BY available_quantity DESC
        LIMIT 1
      `;

      const availableQuantity = stockItem?.availableQuantity || 0;
      const status = availableQuantity >= itemReq.requiredQuantity ? 'sufficient' : 'insufficient';
      
      if (status === 'sufficient') {
        sufficientCount++;
      } else {
        insufficientCount++;
      }

      const courseItem = await db.queryRow<CourseItem>`
        INSERT INTO course_items (course_id, stock_item_id, item_name, required_quantity, available_quantity, status, created_at, updated_at)
        VALUES (${req.courseId}, ${stockItem?.id}, ${itemReq.itemName}, ${itemReq.requiredQuantity}, ${availableQuantity}, ${status}, ${now}, ${now})
        RETURNING id, course_id as "courseId", stock_item_id as "stockItemId", item_name as "itemName", required_quantity as "requiredQuantity", available_quantity as "availableQuantity", reserved_quantity as "reservedQuantity", status, created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (courseItem) {
        items.push(courseItem);
      }
    }

    return {
      items,
      summary: {
        totalItems: req.items.length,
        sufficientItems: sufficientCount,
        insufficientItems: insufficientCount,
      }
    };
  }
);