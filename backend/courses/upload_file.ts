import { api } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";
import db from "../db";
import { CourseFile } from "./get_course";

const courseFiles = new Bucket("course-files");

export interface UploadFileRequest {
  courseId: number;
  fileName: string;
  fileType: string;
  fileData: string; // Base64 encoded
}

// Uploads a file for a course (PPT, documents, etc.).
export const uploadFile = api<UploadFileRequest, CourseFile>(
  { expose: true, method: "POST", path: "/courses/:courseId/upload" },
  async (req) => {
    const now = new Date();
    
    // Check if course exists
    const course = await db.queryRow<{id: number}>`
      SELECT id FROM courses WHERE id = ${req.courseId}
    `;

    if (!course) {
      throw new Error("Course not found");
    }

    // Generate unique file path
    const timestamp = Date.now();
    const filePath = `course-${req.courseId}/${timestamp}-${req.fileName}`;

    // Convert base64 to buffer and upload file to object storage
    const buffer = Buffer.from(req.fileData, 'base64');
    const attrs = await courseFiles.upload(filePath, buffer, {
      contentType: req.fileType,
    });

    // Save file record to database
    const courseFile = await db.queryRow<CourseFile>`
      INSERT INTO course_files (course_id, file_name, file_type, file_size, file_path, uploaded_at)
      VALUES (${req.courseId}, ${req.fileName}, ${req.fileType}, ${attrs.size}, ${filePath}, ${now})
      RETURNING id, course_id as "courseId", file_name as "fileName", file_type as "fileType", file_size as "fileSize", file_path as "filePath", uploaded_at as "uploadedAt"
    `;

    if (!courseFile) {
      // Clean up uploaded file if database insert fails
      await courseFiles.remove(filePath);
      throw new Error("Failed to save file record");
    }

    return courseFile;
  }
);

export interface GetDownloadUrlRequest {
  courseId: number;
  fileId: number;
}

export interface GetDownloadUrlResponse {
  url: string;
  fileName: string;
}

// Generates a signed download URL for a course file.
export const getDownloadUrl = api<GetDownloadUrlRequest, GetDownloadUrlResponse>(
  { expose: true, method: "GET", path: "/courses/:courseId/files/:fileId/download" },
  async (req) => {
    // Get file details
    const file = await db.queryRow<{fileName: string, filePath: string}>`
      SELECT file_name as "fileName", file_path as "filePath"
      FROM course_files
      WHERE id = ${req.fileId} AND course_id = ${req.courseId}
    `;

    if (!file) {
      throw new Error("File not found");
    }

    // Generate signed download URL (valid for 1 hour)
    const { url } = await courseFiles.signedDownloadUrl(file.filePath, { ttl: 3600 });

    return {
      url,
      fileName: file.fileName,
    };
  }
);