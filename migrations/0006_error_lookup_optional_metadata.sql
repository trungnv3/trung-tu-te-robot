-- Metadata is useful but optional for admin-created lookup records.
-- Rebuild the two small lookup tables so existing data remains intact.

ALTER TABLE error_codes RENAME TO error_codes_previous;
DROP INDEX IF EXISTS idx_error_codes_lookup;

CREATE TABLE error_codes (
  record_id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  model_scope TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_title_vi TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  first_action_vi TEXT NOT NULL,
  confidence_score REAL
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  confidence_label TEXT NOT NULL DEFAULT ''
    CHECK (confidence_label IN ('', 'cao', 'trung bình', 'thấp')),
  model_scope_note_vi TEXT NOT NULL,
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_accessed_at TEXT NOT NULL DEFAULT '',
  publication_status TEXT NOT NULL,
  UNIQUE (manufacturer, model_scope, error_code)
);

INSERT INTO error_codes (
  record_id, manufacturer, device_type, model_scope, error_code,
  error_title_vi, description_vi, first_action_vi,
  confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  record_id, manufacturer, device_type, model_scope, error_code,
  error_title_vi, description_vi, first_action_vi,
  confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
FROM error_codes_previous;

DROP TABLE error_codes_previous;

ALTER TABLE symptom_references RENAME TO symptom_references_previous;
DROP INDEX IF EXISTS idx_symptom_references_lookup;

CREATE TABLE symptom_references (
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
  confidence_score REAL
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  confidence_label TEXT NOT NULL DEFAULT ''
    CHECK (confidence_label IN ('', 'cao', 'trung bình', 'thấp')),
  model_scope_note_vi TEXT NOT NULL,
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_accessed_at TEXT NOT NULL DEFAULT '',
  publication_status TEXT NOT NULL,
  UNIQUE (manufacturer, model_scope, reported_code, symptom_key, source_url)
);

INSERT INTO symptom_references (
  record_id, manufacturer, device_type, model_scope, reported_code,
  symptom_key, title_vi, summary_vi, first_action_vi, safety_stop_vi,
  confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
)
SELECT
  record_id, manufacturer, device_type, model_scope, reported_code,
  symptom_key, title_vi, summary_vi, first_action_vi, safety_stop_vi,
  confidence_score, confidence_label, model_scope_note_vi,
  source_name, source_url, source_accessed_at, publication_status
FROM symptom_references_previous;

DROP TABLE symptom_references_previous;

CREATE INDEX IF NOT EXISTS idx_error_codes_lookup
  ON error_codes (manufacturer, model_scope, error_code);

CREATE INDEX IF NOT EXISTS idx_symptom_references_lookup
  ON symptom_references (manufacturer, model_scope, symptom_key);
