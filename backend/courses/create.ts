import { api } from "encore.dev/api";
import db from "../db";

export interface CreateCourseRequest {
  name: string;
  description?: string;
  instructor?: string;
  studentCount?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  instructor?: string;
  studentCount?: number;
  startDate?: Date;
  endDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new course.
export const create = api<CreateCourseRequest, Course>(
  { expose: true, method: "POST", path: "/courses" },
  async (req) => {
    const now = new Date();
    
    const course = await db.queryRow<Course>`
      INSERT INTO courses (name, description, instructor, student_count, start_date, end_date, created_at, updated_at)
      VALUES (${req.name}, ${req.description}, ${req.instructor}, ${req.studentCount}, ${req.startDate}, ${req.endDate}, ${now}, ${now})
      RETURNING id, name, description, instructor, student_count as "studentCount", start_date as "startDate", end_date as "endDate", status, created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!course) {
      throw new Error("Failed to create course");
    }

    return course;
  }
);