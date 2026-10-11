CREATE TABLE IF NOT EXISTS robots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  year INTEGER,
  category TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (brand, model)
);

CREATE TABLE IF NOT EXISTS robot_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  robot_id INTEGER NOT NULL UNIQUE REFERENCES robots(id) ON DELETE CASCADE,
  suction_power TEXT,
  obstacle_recognition TEXT,
  mopping_technology TEXT,
  mop_extension TEXT,
  side_brush_extension TEXT,
  automatic_mop_washing TEXT,
  mop_drying TEXT,
  wash_tray_self_cleaning TEXT,
  automatic_dust_emptying TEXT,
  automatic_detergent_dispensing TEXT,
  carpet_mop_lift TEXT,
  dust_bag_capacity TEXT,
  clean_dirty_water_capacity TEXT,
  battery_capacity TEXT,
  cleaning_area TEXT,
  robot_dimensions TEXT,
  dock_dimensions TEXT,
  reference_price REAL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS robot_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  robot_id INTEGER NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS robot_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  robot_id INTEGER NOT NULL UNIQUE REFERENCES robots(id) ON DELETE CASCADE,
  intro TEXT,
  highlights TEXT,
  pros TEXT,
  notes TEXT,
  suitable_for TEXT,
  ai_content TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS robot_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  robot_id INTEGER NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
  drive_id TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (robot_id, drive_id)
);

CREATE TABLE IF NOT EXISTS ai_model_status (
  model TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'available',
  last_success_at TEXT,
  quota_reset_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_error_status INTEGER,
  last_error_at TEXT,
  error_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT '',
  icon TEXT,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_date TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_robots_brand_status
  ON robots(brand, status);

CREATE INDEX IF NOT EXISTS idx_robot_features_robot_order
  ON robot_features(robot_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_robot_images_robot_order
  ON robot_images(robot_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_articles_status_order
  ON articles(status, sort_order, updated_at);

CREATE INDEX IF NOT EXISTS idx_site_visits_date
  ON site_visits(visit_date);
CREATE TABLE IF NOT EXISTS article_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  view_date TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);  
