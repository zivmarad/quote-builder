-- טיוטות הצעות לסנכרון בין מכשירים (שורה אחת למשתמש, מערך JSONB)
CREATE TABLE IF NOT EXISTS quote_drafts (
  user_id TEXT PRIMARY KEY,
  drafts JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_drafts_user_id ON quote_drafts(user_id);
ALTER TABLE quote_drafts ENABLE ROW LEVEL SECURITY;
