# הגדרת Supabase לסנכרון נתונים

## שלב 1: הרצת סכמת ה-SQL

1. היכנס ל־[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לחץ על **SQL Editor** בסרגל הצד
4. לחץ **New Query**
5. פתח את הקובץ `supabase-schema.sql` והעתק את כל התוכן
6. הדבק ב־SQL Editor ולחץ **Run**

אם הכל עבר בהצלחה – יוצרו 7 טבלאות: `quote_basket`, `quote_history`, `user_profile`, `user_settings`, `price_overrides`, `app_users`, `verification_codes`.

**חשוב:** הרשמה באימייל ושחזור סיסמה תלויים ב־`verification_codes` ו־`app_users`. בלי Supabase מוגדר – שליחת קוד אימות לא תעבוד.

---

## שלב 2: העתקת מפתחות

1. ב־Supabase לחץ **Project Settings** (אייקון גלגל השיניים)
2. לחץ **API** בתפריט הצד
3. העתק:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** (מתחת ל־Project API keys) → `SUPABASE_SERVICE_ROLE_KEY`  
     (שים לב: `service_role` סודי – אל תפרסם!)

---

## שלב 3: עדכון .env.local

פתח את הקובץ `.env.local` והוסף/עדכן:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

החלף בערכים האמיתיים מהשלב 2.

---

## שלב 4: התקנת חבילות והפעלה

```bash
npm install
npm run dev
```

אחרי שמירה והפעלה מחדש – הסנכרון יעבוד.

---

## פריסה ל־Vercel

אם מפריסים ל־Vercel – הוסף את המפתחות ב־**Project Settings → Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_APP_PASSWORD` (לשליחת קודי אימות)
- `EMAIL_USER` (אופציונלי)

בלי המפתחות האלה – הרשמה באימייל ושחזור סיסמה לא יעבדו בפרודקשן.

---

## איך זה עובד

- **משתמש מחובר**: הנתונים נטענים מ־Supabase ונשמרים גם שם. סל, היסטוריה, פרופיל, הגדרות ומחירים מותאמים מסתנכרנים בין מכשירים.
- **אורח**: הנתונים נשמרים רק ב־localStorage (כמו קודם).
- **הרשמה באימייל ושחזור סיסמה**: דורשים Supabase (טבלאות `app_users`, `verification_codes`). בלי המפתחות – שליחת קוד אימות לא תעבוד.
- **בלי Supabase**: התחברות רגילה (שם משתמש+סיסמה) והנתונים המקומיים עובדים. הרשמה באימייל ושחזור סיסמה לא יעבדו.
