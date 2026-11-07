-- ============================================================
-- TRUNG TỬ TẾ - ROBOT
-- Cloudflare D1 Database Schema
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. ROBOTS
-- Thông tin cơ bản của từng Model
-- ============================================================

CREATE TABLE IF NOT EXISTS robots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  slug TEXT NOT NULL,

  year INTEGER,

  category TEXT DEFAULT 'Robot lau nhà & hút bụi',

  status TEXT NOT NULL DEFAULT 'active',

  description TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (brand, model),
  UNIQUE (slug)
);

-- ============================================================
-- 2. ROBOT SPECS
-- Thông số kỹ thuật của Robot
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  robot_id INTEGER NOT NULL,

  suction TEXT,
  battery TEXT,
  dustbin TEXT,
  water_tank TEXT,

  navigation TEXT,
  noise TEXT,

  hot_water TEXT,
  mop_wash TEXT,
  mop_dry TEXT,
  mop_lift TEXT,

  self_empty TEXT,
  detergent TEXT,

  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (robot_id),

  FOREIGN KEY (robot_id)
    REFERENCES robots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ============================================================
-- 3. ROBOT FEATURES
-- Các tính năng nổi bật
-- Một Robot có thể có nhiều tính năng
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  robot_id INTEGER NOT NULL,

  title TEXT NOT NULL,
  description TEXT,

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (robot_id)
    REFERENCES robots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ============================================================
-- 4. ROBOT CONTENT
-- Nội dung biên tập cho trang Robot
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  robot_id INTEGER NOT NULL,

  intro TEXT,
  highlights TEXT,
  pros TEXT,
  notes TEXT,
  suitable_for TEXT,

  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (robot_id),

  FOREIGN KEY (robot_id)
    REFERENCES robots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ============================================================
-- INDEX
-- Tăng tốc tìm kiếm Robot
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_robots_brand
  ON robots(brand);

CREATE INDEX IF NOT EXISTS idx_robots_status
  ON robots(status);

CREATE INDEX IF NOT EXISTS idx_robot_features_robot_id
  ON robot_features(robot_id);

-- ============================================================
-- HOÀN TẤT
-- ============================================================
-- ============================================================
-- 5. ROBOT IMAGES
-- Hình ảnh Robot lấy từ Google Drive
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  robot_id INTEGER NOT NULL,

  drive_id TEXT NOT NULL,

  file_name TEXT NOT NULL,

  mime_type TEXT,

  sort_order INTEGER NOT NULL DEFAULT 0,

  is_primary INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (robot_id)
    REFERENCES robots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE (robot_id, drive_id)
);

-- ============================================================
-- INDEX ROBOT IMAGES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_robot_images_robot_id
  ON robot_images(robot_id);

CREATE INDEX IF NOT EXISTS idx_robot_images_sort
  ON robot_images(robot_id, sort_order);

-- ============================================================
-- 6. ERROR-CODE LOOKUP
-- ============================================================

CREATE TABLE IF NOT EXISTS error_codes (
  record_id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  model_scope TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_title_vi TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  first_action_vi TEXT NOT NULL,
  diagnostic_steps_vi TEXT NOT NULL DEFAULT '',
  service_handoff_vi TEXT NOT NULL DEFAULT '',
  confidence_score REAL NOT NULL
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_label TEXT NOT NULL
    CHECK (confidence_label IN ('cao', 'trung bình', 'thấp')),
  model_scope_note_vi TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_accessed_at TEXT NOT NULL,
  publication_status TEXT NOT NULL,
  UNIQUE (manufacturer, model_scope, error_code)
);

CREATE TABLE IF NOT EXISTS symptom_references (
  record_id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  model_scope TEXT NOT NULL,
  reported_code TEXT NOT NULL DEFAULT '',
  symptom_key TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  summary_vi TEXT NOT NULL,
  first_action_vi TEXT NOT NULL,
  safety_stop_vi TEXT NOT NULL,
  diagnostic_steps_vi TEXT NOT NULL DEFAULT '',
  service_handoff_vi TEXT NOT NULL DEFAULT '',
  confidence_score REAL NOT NULL
    CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_label TEXT NOT NULL
    CHECK (confidence_label IN ('cao', 'trung bình', 'thấp')),
  model_scope_note_vi TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_accessed_at TEXT NOT NULL,
  publication_status TEXT NOT NULL,
  UNIQUE (manufacturer, model_scope, reported_code, symptom_key, source_url)
);

CREATE INDEX IF NOT EXISTS idx_error_codes_lookup
  ON error_codes (manufacturer, model_scope, error_code);

CREATE INDEX IF NOT EXISTS idx_symptom_references_lookup
  ON symptom_references (manufacturer, model_scope, symptom_key);

CREATE TABLE IF NOT EXISTS lookup_models (
  model_id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  model_name TEXT NOT NULL,
  guide_group TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  UNIQUE (manufacturer, device_type, model_name)
);

CREATE INDEX IF NOT EXISTS idx_lookup_models_manufacturer
  ON lookup_models (manufacturer, is_active, model_name);

-- ============================================================
-- HOÀN TẤT
-- ============================================================
