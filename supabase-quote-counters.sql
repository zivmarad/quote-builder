-- Quote serial counter per user
-- Run once in Supabase SQL Editor (for existing projects)

CREATE TABLE IF NOT EXISTS quote_counters (
  user_id TEXT PRIMARY KEY,
  next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number >= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_counters_user_id ON quote_counters(user_id);
ALTER TABLE quote_counters ENABLE ROW LEVEL SECURITY;
