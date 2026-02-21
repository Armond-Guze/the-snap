import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { TEAM_ABBRS, TEAM_META } from '@/lib/schedule';
import { TEAM_COLORS } from '@/app/components/teamLogos';
import { fetchNFLStandingsWithFallback } from '@/lib/nfl-api';
import { SITE_URL } from '@/lib/site-config';

const DIVISION_GROUPS: Array<{ title: string; teams: (keyof typeof TEAM_META)[] }> = [
  { title: 'AFC East', teams: ['BUF', 'MIA', 'NE', 'NYJ'] },
  { title: 'AFC North', teams: ['BAL', 'CIN', 'CLE', 'PIT'] },
  { title: 'AFC South', teams: ['HOU', 'IND', 'JAX', 'TEN'] },
  { title: 'AFC West', teams: ['DEN', 'KC', 'LAC', 'LV'] },
  { title: 'NFC East', teams: ['DAL', 'NYG', 'PHI', 'WAS'] },
  { title: 'NFC North', teams: ['CHI', 'DET', 'GB', 'MIN'] },
  { title: 'NFC South', teams: ['ATL', 'CAR', 'NO', 'TB'] },
  { title: 'NFC West', teams: ['ARI', 'LAR', 'SEA', 'SF'] },
];

function slugifyTeamName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function formatRecord(wins: number, losses: number, ties: number) {
  return `${wins}-${losses}${ties ? `-${ties}` : ''}`;
}

export const metadata: Metadata = {
  title: 'NFL Teams Hub – All 32 Team Centers | The Snap',
  description: 'Browse all 32 NFL team hubs with quick access to each team\'s latest stories, schedule context, and standings snapshot.',
  alternates: { canonical: `${SITE_URL}/teams` },
  openGraph: {
    title: 'NFL Teams Hub – All 32 Team Centers | The Snap',
    description: 'Jump to any NFL team hub from one league-wide index page.',
    url: `${SITE_URL}/teams`,
    type: 'website',
  },
};

export const revalidate = 300;

export default async function TeamsHubIndexPage() {
  const standings = await fetchNFLStandingsWithFallback();
  const standingsByName = new Map(standings.map((team) => [team.teamName, team]));

  const topByRecord = standings
    .slice()
    .sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.teamName.localeCompare(b.teamName);
    })
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.18),transparent_35%)]" />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">League Navigation</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">NFL Teams Hub</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            One place to jump into any team page. Open a team hub for latest coverage, schedule context, and division positioning.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/standings" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Standings</Link>
            <Link href="/schedule" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">League Schedule</Link>
            <Link href="/headlines" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Headlines</Link>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-white">Top Teams Right Now</h2>
        <p className="mt-1 text-sm text-white/60">Based on current win percentage.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {topByRecord.map((team) => {
            const code = TEAM_ABBRS.find((abbr) => TEAM_META[abbr].name === team.teamName) || 'NFL';
            const meta = TEAM_META[code] || { name: team.teamName, logo: '/images/teams/placeholder-template.svg' };
            return (
              <Link
                key={team.teamName}
                href={`/teams/${slugifyTeamName(team.teamName)}`}
                className="rounded-xl border border-white/10 bg-black/25 p-3 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-black/25 p-1">
                    <Image src={meta.logo} alt={`${team.teamName} logo`} fill sizes="32px" className="object-contain" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{code}</p>
                    <p className="text-[11px] text-white/70">{formatRecord(team.wins, team.losses, team.ties)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8 space-y-6">
        {DIVISION_GROUPS.map((division) => (
          <div key={division.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-white">{division.title}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {division.teams.map((code) => {
                const meta = TEAM_META[code];
                const standing = standingsByName.get(meta.name);
                const accent = TEAM_COLORS[code] || '#9CA3AF';
                return (
                  <Link
                    key={code}
                    href={`/teams/${slugifyTeamName(meta.name)}`}
                    className="rounded-xl border border-white/10 p-3 transition-colors hover:bg-white/10"
                    style={{ backgroundColor: `${accent}22` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-black/25 p-1">
                        <Image src={meta.logo} alt={`${meta.name} logo`} fill sizes="32px" className="object-contain" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">{code}</p>
                        <p className="truncate text-[11px] text-white/75">{meta.name}</p>
                        <p className="text-[10px] text-white/55">
                          {standing ? formatRecord(standing.wins, standing.losses, standing.ties) : '—'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
