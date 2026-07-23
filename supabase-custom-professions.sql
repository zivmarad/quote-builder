-- מקצועות מותאמים שמשתמשים יצרו – לוג למעקב אדמין (מייל + מסך אדמין)
-- הרץ אחרי supabase-custom-catalog.sql

CREATE TABLE IF NOT EXISTS custom_profession_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🧰',
  services_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS custom_profession_events_created_at_idx
  ON custom_profession_events (created_at DESC);

CREATE INDEX IF NOT EXISTS custom_profession_events_user_id_idx
  ON custom_profession_events (user_id);

ALTER TABLE custom_profession_events ENABLE ROW LEVEL SECURITY;
