-- Quote export jobs table
-- Run once in Supabase SQL Editor for existing projects

CREATE TABLE IF NOT EXISTS quote_export_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  export_type TEXT NOT NULL,
  status TEXT NOT NULL,
  quote_number INTEGER,
  payload JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quote_export_jobs_user_id ON quote_export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_export_jobs_status ON quote_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_quote_export_jobs_created_at ON quote_export_jobs(created_at);
ALTER TABLE quote_export_jobs ENABLE ROW LEVEL SECURITY;
