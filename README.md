This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### דף אדמין

- **כתובת:** `/admin`
- **כניסה:** שם משתמש וסיסמה מהמשתנים `ADMIN_USERNAME` ו־`ADMIN_SECRET`. המפתח נשלח ב-header `X-Admin-Key` (לא ב-URL).

### משתני סביבה ל-production (Vercel / וכו')

ב־Project → Settings → Environment Variables הגדר:

| משתנה | חובה | תיאור |
|--------|------|--------|
| `JWT_SECRET` | כן | מפתח לחתימת סשן (לפחות 32 תווים). ייחודי וסודי. |
| `NEXT_PUBLIC_SITE_URL` | מומלץ | כתובת האתר ב-production (למשל `https://hatzaot.co.il`) – SEO, Open Graph ו-sitemap. ב-production ב-Vercel ברירת המחדל היא `https://hatzaot.co.il`. |
| `NEXT_PUBLIC_SUPABASE_URL` | לסנכרון | כתובת פרויקט Supabase (Project Settings → API). |
| `SUPABASE_SERVICE_ROLE_KEY` | לסנכרון | מפתח service_role מאותו מקום. **לא לחשוף בצד לקוח.** |
| `EMAIL_USER` | לשליחת מייל | כתובת Gmail שממנה נשלחים קודי אימות וכו'. |
| `EMAIL_APP_PASSWORD` | לשליחת מייל | סיסמת אפליקציה של Gmail (לא סיסמת הכניסה). |
| `ADMIN_USERNAME` | לאדמין | שם משתמש לכניסת אדמין. |
| `ADMIN_SECRET` | לאדמין | סיסמה/מפתח לכניסת אדמין (נשלח כ־X-Admin-Key). |
| `UPSTASH_REDIS_REST_URL` | מומלץ בפרודקשן | כתובת REST של Upstash – **rate limiting מבוזר** בין אינסטנסים. בלי זה נעשה שימוש במפה בזיכרון (מתאים ללוקאל). |
| `UPSTASH_REDIS_REST_TOKEN` | מומלץ בפרודקשן | טוקן Upstash (אותו פרויקט Redis). |
| `NEXT_PUBLIC_SENTRY_DSN` | אופציונלי | DSN של Sentry לדיווח שגיאות בצד לקוח (ומספיק גם לשרת אם לא מגדירים `SENTRY_DSN`). |
| `SENTRY_DSN` | אופציונלי | אותו DSN רק לשרת (לא חובה אם כבר יש `NEXT_PUBLIC_SENTRY_DSN`). |
| `SENTRY_AUTH_TOKEN` | אופציונלי | ב־build (למשל Vercel): העלאת source maps ל־Sentry. בלי טוקן – ה־build מדלג על ההעלאה. |

**אופציונלי:** `NOTIFY_ADMIN_EMAIL`, `NOTIFY_SMS_EMAIL` – לקבלת מייל/SMS על הרשמה חדשה.

**חשוב:** אל תעלה קבצי `.env` או `.env.local` ל-Git; הסודות רק במשתני הסביבה של הפלטפורמה.

### CI (GitHub Actions)

ב־`push` / `pull_request` ל־`main` או `master` רץ workflow שמבצע `npm ci`, `lint`, `typecheck` ו־`build` (עם משתני סביבה דמה ל־JWT ו־Supabase). אין צורך ב־Sentry ב־CI כדי שהבילד יעבור.

### התחברות וסנכרון

משתמשים ונתונים (פרופיל, סל, היסטוריה, לקוחות CRM) נשמרים ב-Supabase. **כדי שפרטי הפרופיל (שם, טלפון, לוגו) יישמרו בין כניסות ומכשירים** – הגדר ב-Vercel את `NEXT_PUBLIC_SUPABASE_URL` ו־`SUPABASE_SERVICE_ROLE_KEY`, והרץ את `supabase-schema.sql` ב-Supabase (SQL Editor). ל**לקוחות (CRM)** אחרי מערכת משתמשים קיימת, הרץ גם `supabase-customers.sql` (או עדכן סכמה מלאה מ־`supabase-schema.sql`). התחברות מכל מכשיר עם אותו חשבון מסנכרנת את הנתונים אוטומטית.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
