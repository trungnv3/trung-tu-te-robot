-- Model catalogue and detailed diagnostic guidance for the public error lookup.

CREATE TABLE IF NOT EXISTS lookup_models (
  model_id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  UNIQUE (manufacturer, model_name)
);

CREATE INDEX IF NOT EXISTS idx_lookup_models_manufacturer
  ON lookup_models (manufacturer, is_active, model_name);

ALTER TABLE error_codes ADD COLUMN diagnostic_steps_vi TEXT NOT NULL DEFAULT '';
ALTER TABLE error_codes ADD COLUMN service_handoff_vi TEXT NOT NULL DEFAULT '';

ALTER TABLE symptom_references ADD COLUMN diagnostic_steps_vi TEXT NOT NULL DEFAULT '';
ALTER TABLE symptom_references ADD COLUMN service_handoff_vi TEXT NOT NULL DEFAULT '';
