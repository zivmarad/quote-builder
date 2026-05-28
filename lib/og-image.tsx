import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const OG_ALT = 'בונה הצעות מחיר';
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const HEEBO_BOLD =
  'https://fonts.gstatic.com/s/heebo/v28/NGSpv5_NC0k9P_v6ZUCbLRAHxK1Ebiuccg.ttf';

export async function createOgImage(): Promise<ImageResponse> {
  const [logoData, fontData] = await Promise.all([
    readFile(join(process.cwd(), 'public/icon.png')),
    fetch(HEEBO_BOLD).then((res) => res.arrayBuffer()),
  ]);

  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #eff6ff 0%, #ffffff 45%, #f1f5f9 100%)',
          padding: 48,
        }}
      >
        <img src={logoSrc} width={240} height={240} alt="" />
        <div
          style={{
            marginTop: 36,
            fontSize: 64,
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            fontFamily: 'Heebo',
            lineHeight: 1.2,
          }}
        >
          בונה הצעות מחיר
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            fontWeight: 700,
            color: '#2563eb',
            textAlign: 'center',
            fontFamily: 'Heebo',
          }}
        >
          PDF ממותג · שליחה בוואטסאפ
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 28,
            color: '#64748b',
            textAlign: 'center',
            fontFamily: 'Heebo',
          }}
        >
          hatzaot.co.il
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: 'Heebo', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}
