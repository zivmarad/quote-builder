-- העתקת היסטוריה ישנה (מערך JSONB בשורה אחת) לטבלת quotes
-- הרץ פעם אחת אחרי supabase-quotes.sql, כשקיימים עדיין נתונים ב-quote_history

INSERT INTO quotes (id, user_id, quote_data, created_at, updated_at)
SELECT
  elem->>'id' AS id,
  qh.user_id,
  elem AS quote_data,
  COALESCE((elem->>'createdAt')::timestamptz, NOW()),
  NOW()
FROM quote_history qh
CROSS JOIN LATERAL jsonb_array_elements(qh.quotes) AS elem
WHERE elem ? 'id'
  AND (elem->>'id') IS NOT NULL
  AND (elem->>'id') <> ''
ON CONFLICT (user_id, id) DO UPDATE SET
  quote_data = EXCLUDED.quote_data,
  updated_at = EXCLUDED.updated_at;
