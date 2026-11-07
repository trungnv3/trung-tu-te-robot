-- Public error-code and symptom lookup for robot vacuums and mops.
-- Seed data lives in seed-error-code-lookup.sql so schema migrations stay small.

CREATE TABLE IF NOT EXISTS error_codes (
  record_id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  model_scope TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_title_vi TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  first_action_vi TEXT NOT NULL,
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
