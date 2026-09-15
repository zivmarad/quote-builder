-- ספירת קליקים במוצר לדשבורד מנהלים (כניסות, הורדות, שיתוף)
-- הרץ ב-Supabase SQL Editor אחרי supabase-schema.sql

CREATE TABLE IF NOT EXISTS product_events (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_events_name_chk CHECK (
    name IN (
      'app_entered',
      'quote_pdf',
      'quote_whatsapp',
      'template_word',
      'template_excel',
      'template_pdf'
    )
  )
);

CREATE INDEX IF NOT EXISTS product_events_name_created_at_idx
  ON product_events (name, created_at DESC);

ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;
-- אין מדיניות ל-anon/authenticated: הכתיבה והקריאה רק דרך service role בשרת
