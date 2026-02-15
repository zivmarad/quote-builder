# איפה נשמרים נתוני הפרופיל (שם, לוגו, טלפון וכו')

## שני מקומות

### 1. בדפדפן (localStorage)
- **מפתח:** `quoteBuilderProfile_<userId>` (משתמש מחובר) או `quoteBuilderProfile_guest` (אורח)
- **קוד:** `app/contexts/ProfileContext.tsx` – פונקציית `setProfile()` כותבת עם `localStorage.setItem(key, JSON.stringify(next))`
- **מגבלה:** גודל מוגבל (בדרך כלל כ־5MB לכל האתר). אם הלוגו (base64) גדול מדי, השמירה עלולה להיכשל ואז נשמר פרופיל **בלי לוגו** מקומית – אבל עדיין נשלח לשרת הפרופיל המלא (כולל לוגו).

### 2. בשרת (Supabase)
- **טבלה:** `user_profile`
- **עמודות:** `user_id` (מזהה משתמש), `profile` (JSON – כל השדות: businessName, contactName, phone, logo וכו'), `updated_at`
- **API:**  
  - **טעינה:** `GET /api/sync/profile?userId=...` → `app/api/sync/profile/route.ts` (שורות 7–32)  
  - **שמירה:** `POST /api/sync/profile` עם body `{ userId, profile }` → אותו קובץ (שורות 35–65)

## זרימה כשמשתמש משנה פרופיל (כולל לוגו)

1. **בדף הפרופיל:** כל שינוי (שם, טלפון, לוגו) קורא ל־`setProfile({ ... })` – `app/profile/page.tsx`.
2. **ב־ProfileContext:**  
   - מעדכן state.  
   - כותב ל־localStorage: `localStorage.setItem(quoteBuilderProfile_<userId>, JSON.stringify(profile))`.  
   - שולח לשרת: `postSync('/profile', userId, { profile })` → `POST /api/sync/profile`.
3. **בשרת:** ה־API כותב ל־Supabase: `user_profile` עם `user_id` ו־`profile` (JSON).

## זרימה בריענון / כניסה מחדש

1. **ProfileContext** רץ עם `userId` (אחרי שההתחברות נטענה).
2. **טעינה מיידית:** קורא מ־localStorage עם המפתח `quoteBuilderProfile_<userId>` ומציג.
3. **ברקע:** קורא `GET /api/sync/profile` וממזג:  
   - בסיס = מה שהשרת החזיר.  
   - מעליו מעדכן רק שדות ש־**localStorage** לא ריקים בהם (כדי לא למחוק עריכות מקומיות).  
   - אם **בשרת** יש לוגו אבל **ב־localStorage** אין (כי שמירה מקומית נכשלה) – הלוגו מהשרת נשאר אחרי המיזוג.

## למה הלוגו עלול לא להישמר

1. **Supabase לא מוגדר ב־Vercel**  
   אם חסרים `NEXT_PUBLIC_SUPABASE_URL` או `SUPABASE_SERVICE_ROLE_KEY`, ה־API מחזיר 503, ואז:  
   - השמירה לשרת לא מתבצעת.  
   - הטעינה מהשרת מחזירה null.  
   → הפרופיל נשען רק על localStorage. אם גם שם השמירה נכשלה (מגבלת גודל), הלוגו לא יישמר.

2. **מגבלת גודל ב־localStorage**  
   לוגו כ־base64 יכול להיות גדול. אם `localStorage.setItem` נכשל:  
   - הקוד שומר גרסה **בלי לוגו** ב־localStorage (כדי שלא ייכשל לגמרי).  
   - גם ככה נשלח לשרת הפרופיל **המלא** (כולל לוגו).  
   → אם Supabase מוגדר והבקשה עוברת – הלוגו אמור להישמר בשרת ולהיטען בכניסה הבאה.

3. **מגבלת גודל בבקשה לשרת**  
   הוגדרה מגבלה של 3MB ל־POST של פרופיל (`lib/api-helpers.ts` – `checkProfileBodySize`). לוגו שדוחסים ל־220px ו־JPEG 0.78 אמור להיות מתחת לזה; אם הבקשה גדולה מדי השרת יחזיר 413 והשמירה תיכשל.

## מה לבדוק

- ב־**Vercel** → Environment Variables: שיש `NEXT_PUBLIC_SUPABASE_URL` ו־`SUPABASE_SERVICE_ROLE_KEY`.
- ב־**Supabase**: שהטבלה `user_profile` קיימת (הרצת `supabase-schema.sql`).
- ב־**קונסולה בדפדפן** (F12): אחרי העלאת לוגו – אם יש שגיאות (למשל 413, 503 או כישלון רשת).
