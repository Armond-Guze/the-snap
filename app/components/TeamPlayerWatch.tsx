import Link from 'next/link';
import type { TeamPlayerWatchItem } from '@/lib/sportsdata-news-images';

interface TeamPlayerWatchProps {
  teamName: string;
  items: TeamPlayerWatchItem[];
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return 'Latest';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export default function TeamPlayerWatch({ teamName, items }: TeamPlayerWatchProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/65">Player Watch</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          Fresh player notes for {teamName}, powered by the SportsDataIO trial feed.
        </p>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex gap-3">
              {item.imageUrl ? (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={`${item.name} headshot`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-black text-white/85">
                  {initials(item.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-white/45">
                    {[item.team, item.position].filter(Boolean).join(' • ') || 'NFL'}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium leading-snug text-white/90">{item.noteTitle}</p>

                <p className="mt-2 text-xs leading-relaxed text-white/65">{item.noteSummary}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-white/45">
                  {formatUpdatedAt(item.updatedAt)} • {item.source}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Link href="/headlines" className="mt-3 inline-block text-xs font-semibold text-white/75 hover:text-white">
        Browse all headlines →
      </Link>
    </section>
  );
}
