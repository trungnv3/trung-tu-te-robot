-- Support one model name in more than one device category (for example M10).
-- Keep all existing catalogue rows while rebuilding the older unique constraint.

DROP INDEX IF EXISTS idx_lookup_models_manufacturer;

CREATE TABLE lookup_models_rebuilt (
  model_id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  model_name TEXT NOT NULL,
  guide_group TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  UNIQUE (manufacturer, device_type, model_name)
);

INSERT INTO lookup_models_rebuilt (
  model_id, manufacturer, device_type, model_name, guide_group, is_active
)
SELECT model_id, manufacturer, device_type, model_name, '', is_active
FROM lookup_models;

DROP TABLE lookup_models;
ALTER TABLE lookup_models_rebuilt RENAME TO lookup_models;

CREATE INDEX idx_lookup_models_manufacturer
  ON lookup_models (manufacturer, device_type, is_active, model_name);

-- Use a single display spelling for the brand in public filters.
UPDATE error_codes SET manufacturer = 'Ecovacs' WHERE manufacturer = 'ECOVACS';
UPDATE symptom_references SET manufacturer = 'Ecovacs' WHERE manufacturer = 'ECOVACS';
UPDATE lookup_models SET manufacturer = 'Ecovacs' WHERE manufacturer = 'ECOVACS';
