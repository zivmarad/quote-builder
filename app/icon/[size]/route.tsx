import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const s = parseInt(size, 10) || 192;
  const validSize = s === 512 ? 512 : 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          borderRadius: validSize >= 512 ? 96 : 36,
        }}
      >
        <span
          style={{
            fontSize: validSize >= 512 ? 200 : 80,
            fontWeight: 900,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          הצ
        </span>
      </div>
    ),
    {
      width: validSize,
      height: validSize,
    }
  );
}
