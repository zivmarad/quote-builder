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

const readFont = async (): Promise<ArrayBuffer> => {
  const data = await readFile(join(process.cwd(), 'lib/fonts/Assistant.ttf'));
  return Uint8Array.from(data).buffer;
};

/** תמונת שיתוף – אייקון בלבד; כותרת ותיאור מגיעים מ-metadata (לא טקסט בתמונה). */
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
        <img src={logoSrc} width={420} height={420} alt="" />
      </div>
    ),
    OG_SIZE,
  );
}

/**
 * תמונת שיתוף ייחודית לעמוד – כותרת (H1) + תווית על + לוגו.
 * משפרת CTR בשיתופים (בעיקר וואטסאפ) ונותנת לכל עמוד זהות ויזואלית.
 */
export async function createTitledOgImage(
  title: string,
  eyebrow = 'הצעות מחיר · hatzaot.co.il',
): Promise<ImageResponse> {
  const [logoSrc, fontData] = await Promise.all([readLogo(), readFont()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(145deg, #eff6ff 0%, #ffffff 55%, #f1f5f9 100%)',
          direction: 'rtl',
          fontFamily: 'Assistant',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img src={logoSrc} width={84} height={84} alt="" />
          <span style={{ fontSize: 30, color: '#2563eb', fontWeight: 700 }}>{eyebrow}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ height: 6, width: 64, background: '#2563eb', borderRadius: 999 }} />
          <span style={{ fontSize: 28, color: '#475569', fontWeight: 600 }}>
            בונה הצעות מחיר חכם · חינם
          </span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: 'Assistant', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}
