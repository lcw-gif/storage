-- Courses table
CREATE TABLE courses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  student_count INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'planning', -- planning, active, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course items (items needed for the course)
CREATE TABLE course_items (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  stock_item_id BIGINT REFERENCES stock_items(id),
  item_name TEXT NOT NULL,
  required_quantity INTEGER NOT NULL,
  available_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'checking', -- checking, sufficient, insufficient, reserved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course files (PPT, documents, etc.)
CREATE TABLE course_files (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_course_items_course_id ON course_items(course_id);
CREATE INDEX idx_course_items_stock_item_id ON course_items(stock_item_id);
CREATE INDEX idx_course_files_course_id ON course_files(course_id);