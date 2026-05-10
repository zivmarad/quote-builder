-- לקוחות ל-CRM (סנכרון דרך API עם service_role)
-- הרץ אחרי supabase-schema.sql (נדרשת טבלת app_users)

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_updated ON customers (user_id, updated_at DESC);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- גישה ישירה עם anon/authenticated חסומה כשאין מדיניות; ה-API משתמש ב-service_role שעוקף RLS.
