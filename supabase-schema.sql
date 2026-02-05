-- בונה הצעות מחיר – סכמת Supabase לסנכרון נתונים
-- הרץ את הקובץ הזה ב־Supabase: SQL Editor → New Query → הדבק והרץ

-- טבלת סל הצעות (כל משתמש שורה אחת)
CREATE TABLE IF NOT EXISTS quote_basket (
  user_id TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת היסטוריית הצעות
CREATE TABLE IF NOT EXISTS quote_history (
  user_id TEXT PRIMARY KEY,
  quotes JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- אינדקסים (לא חובה אבל מאיצים חיפוש)
CREATE INDEX IF NOT EXISTS idx_quote_basket_user_id ON quote_basket(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_history_user_id ON quote_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_price_overrides_user_id ON price_overrides(user_id);

-- RLS – הגבלת גישה (כרגע לא משתמשים ב־Supabase Auth, ה־API משתמש ב־service_role)
ALTER TABLE quote_basket ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_overrides ENABLE ROW LEVEL SECURITY;

-- מדיניות: שירות (service_role) יכול הכל. לקוח (anon) לא יכול גישה ישירה
-- אנחנו משתמשים רק ב־API routes עם service_role, אז זה תקין
