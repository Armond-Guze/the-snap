'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import { tagsQuery, trendingTagsQuery } from '@/sanity/lib/queries';
import { Tag } from '@/types';
import { TEAM_COLORS } from './teamLogos';

interface TagCloudProps {
  showTrendingOnly?: boolean;
  maxTags?: number;
  className?: string;
  activeTag?: string;
  title?: string;
}

type TagWithCount = Tag & { articleCount?: number };

const TEAM_TAG_LOOKUP: Record<string, keyof typeof TEAM_COLORS> = {
  'arizona-cardinals': 'ARI',
  cardinals: 'ARI',
  ari: 'ARI',
  'atlanta-falcons': 'ATL',
  falcons: 'ATL',
  atl: 'ATL',
  'baltimore-ravens': 'BAL',
  ravens: 'BAL',
  bal: 'BAL',
  'buffalo-bills': 'BUF',
  bills: 'BUF',
  buf: 'BUF',
  'carolina-panthers': 'CAR',
  panthers: 'CAR',
  car: 'CAR',
  'chicago-bears': 'CHI',
  bears: 'CHI',
  chi: 'CHI',
  'cincinnati-bengals': 'CIN',
  bengals: 'CIN',
  cin: 'CIN',
  'cleveland-browns': 'CLE',
  browns: 'CLE',
  cle: 'CLE',
  'dallas-cowboys': 'DAL',
  cowboys: 'DAL',
  dal: 'DAL',
  'denver-broncos': 'DEN',
  broncos: 'DEN',
  den: 'DEN',
  'detroit-lions': 'DET',
  lions: 'DET',
  det: 'DET',
  'green-bay-packers': 'GB',
  packers: 'GB',
  gb: 'GB',
  'houston-texans': 'HOU',
  texans: 'HOU',
  hou: 'HOU',
  'indianapolis-colts': 'IND',
  colts: 'IND',
  ind: 'IND',
  'jacksonville-jaguars': 'JAX',
  jaguars: 'JAX',
  jags: 'JAX',
  jax: 'JAX',
  'kansas-city-chiefs': 'KC',
  chiefs: 'KC',
  kc: 'KC',
  'las-vegas-raiders': 'LV',
  raiders: 'LV',
  lv: 'LV',
  'los-angeles-chargers': 'LAC',
  chargers: 'LAC',
  lac: 'LAC',
  'los-angeles-rams': 'LAR',
  rams: 'LAR',
  lar: 'LAR',
  'miami-dolphins': 'MIA',
  dolphins: 'MIA',
  mia: 'MIA',
  'minnesota-vikings': 'MIN',
  vikings: 'MIN',
  min: 'MIN',
  'new-england-patriots': 'NE',
  patriots: 'NE',
  pats: 'NE',
  ne: 'NE',
  'new-orleans-saints': 'NO',
  saints: 'NO',
  no: 'NO',
  'new-york-giants': 'NYG',
  giants: 'NYG',
  nyg: 'NYG',
  'new-york-jets': 'NYJ',
  jets: 'NYJ',
  nyj: 'NYJ',
  'philadelphia-eagles': 'PHI',
  eagles: 'PHI',
  phi: 'PHI',
  'pittsburgh-steelers': 'PIT',
  steelers: 'PIT',
  pit: 'PIT',
  'san-francisco-49ers': 'SF',
  '49ers': 'SF',
  niners: 'SF',
  sf: 'SF',
  'seattle-seahawks': 'SEA',
  seahawks: 'SEA',
  sea: 'SEA',
  'tampa-bay-buccaneers': 'TB',
  buccaneers: 'TB',
  bucs: 'TB',
  tb: 'TB',
  'tennessee-titans': 'TEN',
  titans: 'TEN',
  ten: 'TEN',
  'washington-commanders': 'WAS',
  commanders: 'WAS',
  washington: 'WAS',
  was: 'WAS',
};

const FALLBACK_ACCENTS = ['#38BDF8', '#F97316', '#22C55E', '#A78BFA', '#14B8A6', '#EF4444', '#F59E0B'];

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const normalized = clean.length === 3
    ? clean
        .split('')
        .map((ch) => ch + ch)
        .join('')
    : clean;

  const intVal = Number.parseInt(normalized, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTeamCodeFromTag(tagTitle: string): keyof typeof TEAM_COLORS | null {
  const normalized = normalizeLabel(tagTitle);

  if (TEAM_TAG_LOOKUP[normalized]) {
    return TEAM_TAG_LOOKUP[normalized];
  }

  const fragmentMatch = Object.entries(TEAM_TAG_LOOKUP).find(([key]) => {
    return key.length > 2 && normalized.includes(key);
  });

  return fragmentMatch?.[1] ?? null;
}

function getTagAccent(tagTitle: string, index: number): string {
  const teamCode = getTeamCodeFromTag(tagTitle);
  if (teamCode) return TEAM_COLORS[teamCode];
  return FALLBACK_ACCENTS[index % FALLBACK_ACCENTS.length];
}

function getTagSize(articleCount: number): string {
  if (articleCount >= 12) return 'text-[14px]';
  if (articleCount >= 6) return 'text-[13px]';
  return 'text-[12px]';
}

export default function TagCloud({
  showTrendingOnly = false,
  maxTags = 20,
  className = '',
  activeTag,
  title,
}: TagCloudProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        const query = showTrendingOnly ? trendingTagsQuery : tagsQuery;
        const data = await client.fetch<TagWithCount[]>(query);
        setTags(data.slice(0, maxTags));
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, [showTrendingOnly, maxTags]);

  const normalizedActive = normalizeLabel(activeTag ?? '');

  const orderedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      const aTeam = getTeamCodeFromTag(a.title) ? 1 : 0;
      const bTeam = getTeamCodeFromTag(b.title) ? 1 : 0;
      if (aTeam !== bTeam) return bTeam - aTeam;

      const aTrending = a.trending ? 1 : 0;
      const bTrending = b.trending ? 1 : 0;
      if (aTrending !== bTrending) return bTrending - aTrending;

      const aCount = typeof a.articleCount === 'number' ? a.articleCount : 0;
      const bCount = typeof b.articleCount === 'number' ? b.articleCount : 0;
      if (aCount !== bCount) return bCount - aCount;

      return a.title.localeCompare(b.title);
    });
  }, [tags]);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
        <div className="flex flex-wrap gap-2">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-xl border border-white/10 bg-white/[0.06] animate-pulse"
              style={{ width: `${64 + (i % 4) * 24}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (orderedTags.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {(showTrendingOnly || title) && (
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
          <span className="inline-flex h-2 w-2 rounded-full bg-sky-300" />
          {title || 'Trending Topics'}
        </h3>
      )}

      <div className="flex flex-wrap gap-2.5">
        {orderedTags.map((tag, index) => {
          const articleCount = typeof tag.articleCount === 'number' ? tag.articleCount : 0;
          const accent = getTagAccent(tag.title, index);
          const isActive = normalizedActive.length > 0 && normalizeLabel(tag.title) === normalizedActive;

          return (
            <Link
              key={tag._id}
              href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
              className={`group relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-semibold tracking-tight transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-200 hover:text-white'
              } ${getTagSize(articleCount)}`}
              title={tag.description || `View articles tagged with ${tag.title}`}
              style={{
                borderColor: hexToRgba(accent, isActive ? 0.65 : 0.35),
                background: `linear-gradient(135deg, ${hexToRgba(accent, isActive ? 0.3 : 0.16)} 0%, rgba(15, 23, 42, 0.48) 100%)`,
                boxShadow: isActive
                  ? `0 0 0 1px ${hexToRgba(accent, 0.6)}, 0 14px 30px -24px ${hexToRgba(accent, 0.95)}`
                  : `0 10px 26px -24px ${hexToRgba(accent, 0.9)}`,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
              <span className="max-w-[10rem] truncate">#{tag.title}</span>

              {articleCount > 0 && (
                <span className="rounded-full bg-black/35 px-1.5 py-0.5 text-[10px] font-bold text-white/85 transition-colors group-hover:bg-white/15">
                  {articleCount}
                </span>
              )}

              {tag.trending && (
                <span className="absolute -right-1 -top-1 rounded-full border border-amber-200/65 bg-amber-300/90 px-1.5 py-[1px] text-[9px] font-black uppercase tracking-[0.08em] text-zinc-900">
                  Hot
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {!showTrendingOnly && orderedTags.length >= maxTags && (
        <Link href="/tags" className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 transition-colors hover:text-white">
          View All Tags
        </Link>
      )}
    </div>
  );
}
