import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const clamp = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title = clamp(searchParams.get('title')?.trim() || 'The Snap', 120);
  const subtitle = clamp(searchParams.get('subtitle')?.trim() || 'NFL news, rankings, and analysis', 160);
  const category = clamp(searchParams.get('category')?.trim() || '', 40);
  const author = clamp(searchParams.get('author')?.trim() || '', 40);
  const date = clamp(searchParams.get('date')?.trim() || '', 40);

  const metaBits = [author, date].filter(Boolean).join(' • ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          color: '#F8FAFC',
          backgroundColor: '#0B1220',
          backgroundImage:
            'radial-gradient(1200px 630px at 0% 0%, rgba(59,130,246,0.35), transparent), radial-gradient(900px 500px at 100% 0%, rgba(14,165,233,0.25), transparent), linear-gradient(160deg, #0B1220 0%, #0F172A 60%, #111827 100%)',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>
            THE SNAP
          </div>
          {category ? (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '8px 16px',
                borderRadius: '999px',
                backgroundColor: 'rgba(59,130,246,0.15)',
                color: '#BFDBFE',
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              {category}
            </div>
          ) : null}
          <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: '28px', color: '#CBD5F5', lineHeight: 1.4, maxWidth: '980px' }}>
            {subtitle}
          </div>
        </div>

        <div style={{ fontSize: '22px', color: '#94A3B8' }}>{metaBits}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
