import { api } from "encore.dev/api";
import db from "../db";
import { Course } from "./create";
import { CourseItem } from "./add_items";

export interface CourseFile {
  id: number;
  courseId: number;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  filePath: string;
  uploadedAt: Date;
}

export interface GetCourseResponse {
  course: Course;
  items: CourseItem[];
  files: CourseFile[];
}

// Retrieves a course with all its items and files.
export const getCourse = api<{id: number}, GetCourseResponse>(
  { expose: true, method: "GET", path: "/courses/:id" },
  async (req) => {
    const course = await db.queryRow<Course>`
      SELECT id, name, description, instructor, student_count as "studentCount", start_date as "startDate", end_date as "endDate", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM courses
      WHERE id = ${req.id}
    `;

    if (!course) {
      throw new Error("Course not found");
    }

    const items = await db.queryAll<CourseItem>`
      SELECT id, course_id as "courseId", stock_item_id as "stockItemId", item_name as "itemName", required_quantity as "requiredQuantity", available_quantity as "availableQuantity", reserved_quantity as "reservedQuantity", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM course_items
      WHERE course_id = ${req.id}
      ORDER BY item_name
    `;

    const files = await db.queryAll<CourseFile>`
      SELECT id, course_id as "courseId", file_name as "fileName", file_type as "fileType", file_size as "fileSize", file_path as "filePath", uploaded_at as "uploadedAt"
      FROM course_files
      WHERE course_id = ${req.id}
      ORDER BY uploaded_at DESC
    `;

    return { course, items, files };
  }
);