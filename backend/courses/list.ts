import { api } from "encore.dev/api";
import db from "../db";
import { Course } from "./create";

export interface ListCoursesResponse {
  courses: Course[];
}

// Retrieves all courses, ordered by creation date (latest first).
export const list = api<void, ListCoursesResponse>(
  { expose: true, method: "GET", path: "/courses" },
  async () => {
    const courses = await db.queryAll<Course>`
      SELECT id, name, description, instructor, student_count as "studentCount", start_date as "startDate", end_date as "endDate", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM courses
      ORDER BY created_at DESC
    `;
    return { courses };
  }
);