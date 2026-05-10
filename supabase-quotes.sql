-- הצעות מחיר: שורה אחת לכל הצעה (יחסי) — הרץ ב-Supabase SQL Editor
-- אחרי יצירת הטבלה, הרץ גם את supabase-quotes-migrate-from-history.sql אם יש נתונים ב-quote_history

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  quote_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id_created_at ON quotes (user_id, created_at DESC);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
