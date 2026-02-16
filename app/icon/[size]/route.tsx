import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const s = parseInt(size, 10) || 192;
  const validSize = s === 512 ? 512 : 192;
  const scale = validSize / 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
          borderRadius: validSize >= 512 ? 96 : 36,
          boxShadow: `0 ${20 * scale}px ${40 * scale}px -12px rgba(30, 64, 175, 0.35)`,
        }}
      >
        <div
          style={{
            width: 76 * scale,
            height: 92 * scale,
            background: 'white',
            borderRadius: 10 * scale,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 16 * scale,
            paddingLeft: 14 * scale,
            paddingRight: 14 * scale,
            boxShadow: `0 ${6 * scale}px ${20 * scale}px rgba(0,0,0,0.12)`,
          }}
        >
          <div style={{ width: '100%', height: 7 * scale, background: '#2563eb', borderRadius: 4 * scale, marginBottom: 10 * scale }} />
          <div style={{ width: '88%', height: 7 * scale, background: '#93c5fd', borderRadius: 4 * scale, marginBottom: 10 * scale }} />
          <div style={{ width: '76%', height: 7 * scale, background: '#bfdbfe', borderRadius: 4 * scale, marginBottom: 14 * scale }} />
          <div
            style={{
              width: '100%',
              height: 10 * scale,
              background: 'linear-gradient(90deg, #1e40af, #2563eb)',
              borderRadius: 5 * scale,
              marginTop: 4 * scale,
            }}
          />
        </div>
      </div>
    ),
    {
      width: validSize,
      height: validSize,
    }
  );
}
