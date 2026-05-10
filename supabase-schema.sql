-- בונה הצעות מחיר – סכמת Supabase לסנכרון נתונים
-- הרץ את הקובץ הזה ב־Supabase: SQL Editor → New Query → הדבק והרץ

-- טבלת סל הצעות (כל משתמש שורה אחת)
CREATE TABLE IF NOT EXISTS quote_basket (
  user_id TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טיוטות (עד 20 למשתמש; מערך JSONB בשורה אחת)
CREATE TABLE IF NOT EXISTS quote_drafts (
  user_id TEXT PRIMARY KEY,
  drafts JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת היסטוריית הצעות (legacy — מערך JSONB בשורה אחת; מומלץ quotes + מיגרציה)
CREATE TABLE IF NOT EXISTS quote_history (
  user_id TEXT PRIMARY KEY,
  quotes JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- הצעות מחיר: שורה אחת לכל הצעה (מקור האמת לסנכרון בין מכשירים)
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  quote_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- טבלת פרופיל משתמש
CREATE TABLE IF NOT EXISTS user_profile (
  user_id TEXT PRIMARY KEY,
  profile JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת הגדרות
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת מחירי בסיס מותאמים
CREATE TABLE IF NOT EXISTS price_overrides (
  user_id TEXT PRIMARY KEY,
  overrides JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- מונה מספרי הצעות לכל משתמש (אטומי בצד שרת)
CREATE TABLE IF NOT EXISTS quote_counters (
  user_id TEXT PRIMARY KEY,
  next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number >= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- אינדקסים (לא חובה אבל מאיצים חיפוש)
CREATE INDEX IF NOT EXISTS idx_quote_basket_user_id ON quote_basket(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_drafts_user_id ON quote_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_history_user_id ON quote_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id_created_at ON quotes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_price_overrides_user_id ON price_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_counters_user_id ON quote_counters(user_id);

-- RLS – הגבלת גישה (כרגע לא משתמשים ב־Supabase Auth, ה־API משתמש ב־service_role)
ALTER TABLE quote_basket ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_counters ENABLE ROW LEVEL SECURITY;

-- =======================
-- Auth tables (custom)
-- =======================

-- טבלת משתמשים (ל-auth)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- טבלת קודי אימות/שחזור
CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (email, code)
);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- לוג פעולות אדמין רגישות (כניסה, התחזות וכו')
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  actor_user_id TEXT,
  actor_username TEXT,
  target_user_id TEXT,
  ip TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_user_id ON admin_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON admin_audit_logs(target_user_id);
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- תור ייצוא הצעות (מעקב סטטוס ייצוא/יצירת PDF)
CREATE TABLE IF NOT EXISTS quote_export_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  export_type TEXT NOT NULL,
  status TEXT NOT NULL,
  quote_number INTEGER,
  quote_data JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}',
  file_url TEXT,
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

-- מדיניות: שירות (service_role) יכול הכל. לקוח (anon) לא יכול גישה ישירה
-- אנחנו משתמשים רק ב־API routes עם service_role, אז זה תקין
