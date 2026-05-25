-- קטלוג מותאם אישית (שירותים ושאלות) – סנכרון דרך API עם service_role
-- הרץ אחרי supabase-schema.sql

CREATE TABLE IF NOT EXISTS user_custom_catalog (
  user_id TEXT NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  catalog JSONB NOT NULL DEFAULT '{"servicesByCategory":{},"extraQuestions":{}}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

ALTER TABLE user_custom_catalog ENABLE ROW LEVEL SECURITY;
