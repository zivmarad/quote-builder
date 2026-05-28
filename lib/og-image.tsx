import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const OG_ALT = 'בונה הצעות מחיר';
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/** תמונת שיתוף – אייקון בלבד; כותרת ותיאור מגיעים מ-metadata (לא טקסט בתמונה). */
export async function createOgImage(): Promise<ImageResponse> {
  const logoData = await readFile(join(process.cwd(), 'public/icon.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

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
