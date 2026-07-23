import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const OG_ALT = 'בונה הצעות מחיר';
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const readLogo = async (): Promise<string> => {
  const logoData = await readFile(join(process.cwd(), 'public/icon.png'));
  return `data:image/png;base64,${logoData.toString('base64')}`;
};

/** תמונת שיתוף – אייקון בלבד; כותרת ותיאור מגיעים מ-metadata (og:title / description). */
export async function createOgImage(): Promise<ImageResponse> {
  const logoSrc = await readLogo();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #eff6ff 0%, #ffffff 50%, #f1f5f9 100%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og ImageResponse supports only <img> */}
        <img src={logoSrc} width={420} height={420} alt="" />
      </div>
    ),
    OG_SIZE,
  );
}

/**
 * תמונת שיתוף לעמוד ספציפי.
 * כרגע זהה ללוגו (בלי פונט מותאם) – Assistant.ttf הוא variable font
 * שגורם לקריסת Satori ב-build. הכותרת מגיעה מ-Open Graph metadata.
 * הפרמטרים נשמרים לתאימות API ולהרחבה עתידית עם פונט סטטי.
 */
export async function createTitledOgImage(
  _title: string,
  _eyebrow = 'הצעות מחיר · hatzaot.co.il',
): Promise<ImageResponse> {
  return createOgImage();
}
