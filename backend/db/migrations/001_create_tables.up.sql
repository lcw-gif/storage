-- Purchase items table
CREATE TABLE purchase_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  where_to_buy TEXT,
  price DOUBLE PRECISION,
  quantity INTEGER NOT NULL,
  course_tag TEXT,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'considering',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock items table
CREATE TABLE stock_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  purchase_price DOUBLE PRECISION,
  location TEXT,
  course_tag TEXT,
  status TEXT NOT NULL DEFAULT 'in_stock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock transactions table
CREATE TABLE stock_transactions (
  id BIGSERIAL PRIMARY KEY,
  stock_item_id BIGINT NOT NULL REFERENCES stock_items(id),
  type TEXT NOT NULL, -- 'in' or 'out'
  quantity INTEGER NOT NULL,
  reason TEXT,
  performed_by TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Borrow records table
CREATE TABLE borrow_records (
  id BIGSERIAL PRIMARY KEY,
  stock_item_id BIGINT NOT NULL REFERENCES stock_items(id),
  item_name TEXT NOT NULL,
  borrowed_by TEXT NOT NULL,
  borrowed_quantity INTEGER NOT NULL,
  borrow_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expected_return_date TIMESTAMP WITH TIME ZONE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_purchase_items_status ON purchase_items(status);
CREATE INDEX idx_stock_items_status ON stock_items(status);
CREATE INDEX idx_stock_transactions_stock_item_id ON stock_transactions(stock_item_id);
CREATE INDEX idx_borrow_records_stock_item_id ON borrow_records(stock_item_id);
CREATE INDEX idx_borrow_records_status ON borrow_records(status);
