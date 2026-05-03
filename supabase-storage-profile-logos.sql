-- לוגואים בפרופיל – Supabase Storage (הרץ ב־SQL Editor אחרי supabase-schema.sql)
-- יוצר bucket ציבורי לקריאה; כתיבה דרך ה־API (service_role).

INSERT INTO storage.buckets (id, name, public)
SELECT 'profile-logos', 'profile-logos', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-logos');

DROP POLICY IF EXISTS "profile_logos_public_read" ON storage.objects;
CREATE POLICY "profile_logos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-logos');
