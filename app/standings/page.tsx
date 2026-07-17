import { client } from "@/sanity/lib/client";
import Image from "next/image";
import Link from "next/link";
import { TEAM_META } from "@/lib/schedule";
import { getActiveSeason } from "@/lib/season";
import { fetchNFLStandingsWithFallback, ProcessedTeamData } from "@/lib/nfl-api";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600; // allow ISR; tag-based revalidation will refresh instantly when triggered

export const metadata: Metadata = {
  title: "NFL Standings | The Snap",
  description:
    "Live NFL standings, division races, and conference tables with updated records from The Snap.",
  alternates: {
    canonical: `${SITE_URL}/standings`,
  },
  openGraph: {
    title: "NFL Standings | The Snap",
    description:
      "Live NFL standings, division races, and conference tables with updated records from The Snap.",
    url: `${SITE_URL}/standings`,
    type: "website",
  },
};

interface StandingsTeam {
  _id: string;
  teamName: string;
  teamAbbr: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  conference: string;
  division: string;
  streak?: string;
}

const divisions = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West'
];

// Official conference accents (AFC red / NFC blue)
const CONFERENCE_ACCENTS: Record<string, string> = {
  AFC: '#D50A0A',
  NFC: '#1B48E0',
};

// Team colors (primary, secondary) used for row accents
const TEAM_COLORS: Record<string, { bg: string; accent: string }> = {
  BUF: { bg: '#00338D', accent: '#C60C30' },
  DAL: { bg: '#041E42', accent: '#869397' },
  KC: { bg: '#E31837', accent: '#FFB81C' },
  PHI: { bg: '#004C54', accent: '#A5ACAF' },
  SF: { bg: '#AA0000', accent: '#B3995D' },
  GB: { bg: '#203731', accent: '#FFB612' },
  MIA: { bg: '#008E97', accent: '#F58220' },
  NYJ: { bg: '#125740', accent: '#FFFFFF' },
  NE: { bg: '#002244', accent: '#C60C30' },
  PIT: { bg: '#101820', accent: '#FFB612' },
  BAL: { bg: '#241773', accent: '#9E7C0C' },
  DEN: { bg: '#002244', accent: '#FB4F14' },
  CHI: { bg: '#0B162A', accent: '#C83803' },
  DET: { bg: '#0076B6', accent: '#B0B7BC' },
  MIN: { bg: '#4F2683', accent: '#FFC62F' },
  NO: { bg: '#101820', accent: '#D3BC8D' },
  LV: { bg: '#000000', accent: '#A5ACAF' },
  LAC: { bg: '#0080C6', accent: '#FFC20E' },
  LAR: { bg: '#003594', accent: '#FFA300' },
  ATL: { bg: '#A71930', accent: '#000000' },
  CAR: { bg: '#0085CA', accent: '#101820' },
  CLE: { bg: '#311D00', accent: '#FF3C00' },
  HOU: { bg: '#03202F', accent: '#A71930' },
  IND: { bg: '#002C5F', accent: '#A2AAAD' },
  JAX: { bg: '#101820', accent: '#D7A22A' },
  TEN: { bg: '#0C2340', accent: '#4B92DB' },
  SEA: { bg: '#002244', accent: '#69BE28' },
  TB: { bg: '#D50A0A', accent: '#FF7900' },
  WAS: { bg: '#5A1414', accent: '#FFB612' },
  ARI: { bg: '#97233F', accent: '#FFB612' },
  CIN: { bg: '#FB4F14', accent: '#000000' },
  NYG: { bg: '#0B2265', accent: '#A71930' },
};

function hexLuminance(hex: string): number {
  const value = hex.replace('#', '');
  if (value.length !== 6) return 0;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Pick the team color that stays visible on a near-black background:
// prefer the primary color, but fall back to the secondary when the
// primary is too dark to read as an accent.
function teamAccent(abbr: string): string {
  const colors = TEAM_COLORS[abbr];
  if (!colors) return '#9ca3af';
  const primaryLum = hexLuminance(colors.bg);
  if (primaryLum >= 50) return colors.bg;
  return hexLuminance(colors.accent) > primaryLum ? colors.accent : colors.bg;
}

// NFL-style win percentage: .750 / 1.000
function formatPct(pct: number): string {
  if (pct >= 1) return '1.000';
  return pct.toFixed(3).replace(/^0/, '');
}

function slugifyTeamName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function StreakBadge({ streak }: { streak?: string }) {
  if (!streak) {
    return <span className="text-xs font-medium text-white/30">—</span>;
  }
  const isWin = streak.toUpperCase().startsWith('W');
  const isLoss = streak.toUpperCase().startsWith('L');
  const tone = isWin
    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
    : isLoss
      ? 'border-red-400/20 bg-red-500/10 text-red-300'
      : 'border-white/10 bg-white/5 text-white/60';
  return (
    <span className={`inline-flex min-w-[2.25rem] items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${tone}`}>
      {streak}
    </span>
  );
}

// Lightweight in-file component (not exported) to keep file cohesive
function DivisionTable({
  division,
  teams,
  confAccent,
}: { division: string; teams: StandingsTeam[]; confAccent: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-4 w-1 rounded-full" style={{ backgroundColor: confAccent }} />
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">{division}</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Division</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-white/40">
              <th scope="col" className="py-2.5 pl-4 pr-2 text-left font-semibold sm:pl-5">Team</th>
              <th scope="col" className="w-10 px-1 py-2.5 text-center font-semibold">W</th>
              <th scope="col" className="w-10 px-1 py-2.5 text-center font-semibold">L</th>
              <th scope="col" className="hidden w-10 px-1 py-2.5 text-center font-semibold sm:table-cell">T</th>
              <th scope="col" className="w-14 px-1 py-2.5 text-center font-semibold">Pct</th>
              <th scope="col" className="w-16 px-2 py-2.5 pr-4 text-center font-semibold sm:pr-5">Strk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {teams.map((team, index) => {
              const accent = teamAccent(team.teamAbbr);
              const hasPlayed = team.wins + team.losses + team.ties > 0;
              const isLeader = index === 0 && hasPlayed;
              return (
                <tr
                  key={team._id}
                  className="transition-colors hover:bg-white/[0.04]"
                  style={isLeader ? {
                    boxShadow: `inset 3px 0 0 0 ${accent}`,
                    background: `linear-gradient(90deg, ${accent}14 0%, transparent 55%)`,
                  } : undefined}
                >
                  <td className="py-2.5 pl-4 pr-2 sm:pl-5">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="w-3.5 text-center text-xs font-semibold tabular-nums text-white/35">{index + 1}</span>
                      <span
                        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full sm:h-9 sm:w-9"
                        style={{ backgroundColor: `${accent}1F` }}
                      >
                        <span className="relative block h-6 w-6 sm:h-7 sm:w-7">
                          <Image
                            src={TEAM_META[team.teamAbbr]?.logo || "/images/teams/placeholder.svg"}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-contain"
                          />
                        </span>
                      </span>
                      <Link
                        href={`/teams/${slugifyTeamName(team.teamName)}`}
                        className={`truncate text-[13px] font-semibold sm:text-sm ${isLeader ? 'text-white' : 'text-white/85'} max-w-[110px] transition-colors hover:text-white md:max-w-[170px]`}
                      >
                        <span className="hidden md:inline">{team.teamName}</span>
                        <span className="md:hidden">{team.teamAbbr}</span>
                      </Link>
                    </div>
                  </td>
                  <td className="px-1 py-2.5 text-center text-sm font-semibold tabular-nums text-white">{team.wins}</td>
                  <td className="px-1 py-2.5 text-center text-sm font-semibold tabular-nums text-white/75">{team.losses}</td>
                  <td className="hidden px-1 py-2.5 text-center text-sm font-medium tabular-nums text-white/60 sm:table-cell">{team.ties}</td>
                  <td className="px-1 py-2.5 text-center text-sm font-medium tabular-nums text-white/85">{formatPct(team.winPercentage)}</td>
                  <td className="px-2 py-2.5 pr-4 text-center sm:pr-5"><StreakBadge streak={team.streak} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {teams.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-white/40">No standings data available for {division}</div>
      )}
    </section>
  );
}

function ConferenceHeader({ abbr, name }: { abbr: string; name: string }) {
  const accent = CONFERENCE_ACCENTS[abbr] || '#9ca3af';
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        aria-hidden
        className="grid h-10 w-12 place-items-center rounded-xl text-sm font-black tracking-wide text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)` }}
      >
        {abbr}
      </span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">{name}</h2>
        <p className="text-xs text-white/40">Division standings</p>
      </div>
    </div>
  );
}

export default async function StandingsPage() {
  // Fetch standings data (server-side) with tag for instant revalidation
  const season = await getActiveSeason();
  const noCdnClient = client.withConfig({ useCdn: false });
  let docs: Array<{ _id: string; teamAbbr: string; wins: number; losses: number; ties?: number; streak?: string; updatedAt: string }> = [];

  try {
    docs = await noCdnClient.fetch(
      `*[_type=="teamRecord" && season == $season]{ _id, teamAbbr, wins, losses, ties, streak, "updatedAt": _updatedAt }`,
      { season },
      { next: { tags: ['standings'], revalidate: 1800 } }
    );
  } catch (error) {
    console.warn('[standings] teamRecord fetch failed, falling back to live API', error);
  }

  const nameToAbbr: Record<string, string> = Object.entries(TEAM_META).reduce((acc, [abbr, meta]) => {
    acc[meta.name] = abbr;
    return acc;
  }, {} as Record<string, string>);

  const lastUpdatedISO = docs.reduce<string | null>((latest, doc) => {
    if (!doc.updatedAt) return latest;
    if (!latest) return doc.updatedAt;
    return doc.updatedAt > latest ? doc.updatedAt : latest;
  }, null);

  const lastUpdatedDisplay = lastUpdatedISO
    ? new Date(lastUpdatedISO).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/New_York'
      })
    : null;

  // Map abbr to full team name using TEAM_META or fallback to abbr
  const abbrToName: Record<string, string> = {
        ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills',
        CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns',
        DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
        HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs',
        LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', LV: 'Las Vegas Raiders', MIA: 'Miami Dolphins',
        MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
        NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SEA: 'Seattle Seahawks',
        SF: 'San Francisco 49ers', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders'
      };

  const abbrToDivision: Record<string, { division: string; conference: string }> = {
        BUF: { division: 'AFC East', conference: 'AFC' }, MIA: { division: 'AFC East', conference: 'AFC' }, NE: { division: 'AFC East', conference: 'AFC' }, NYJ: { division: 'AFC East', conference: 'AFC' },
        BAL: { division: 'AFC North', conference: 'AFC' }, CIN: { division: 'AFC North', conference: 'AFC' }, CLE: { division: 'AFC North', conference: 'AFC' }, PIT: { division: 'AFC North', conference: 'AFC' },
        HOU: { division: 'AFC South', conference: 'AFC' }, IND: { division: 'AFC South', conference: 'AFC' }, JAX: { division: 'AFC South', conference: 'AFC' }, TEN: { division: 'AFC South', conference: 'AFC' },
        DEN: { division: 'AFC West', conference: 'AFC' }, KC: { division: 'AFC West', conference: 'AFC' }, LAC: { division: 'AFC West', conference: 'AFC' }, LV: { division: 'AFC West', conference: 'AFC' },
        DAL: { division: 'NFC East', conference: 'NFC' }, NYG: { division: 'NFC East', conference: 'NFC' }, PHI: { division: 'NFC East', conference: 'NFC' }, WAS: { division: 'NFC East', conference: 'NFC' },
        CHI: { division: 'NFC North', conference: 'NFC' }, DET: { division: 'NFC North', conference: 'NFC' }, GB: { division: 'NFC North', conference: 'NFC' }, MIN: { division: 'NFC North', conference: 'NFC' },
        ATL: { division: 'NFC South', conference: 'NFC' }, CAR: { division: 'NFC South', conference: 'NFC' }, NO: { division: 'NFC South', conference: 'NFC' }, TB: { division: 'NFC South', conference: 'NFC' },
        ARI: { division: 'NFC West', conference: 'NFC' }, LAR: { division: 'NFC West', conference: 'NFC' }, SF: { division: 'NFC West', conference: 'NFC' }, SEA: { division: 'NFC West', conference: 'NFC' },
      };

  const mapToStandingsTeam = (abbr: string, name: string, wins: number, losses: number, ties: number, streak?: string): StandingsTeam => {
    const group = abbrToDivision[abbr];
    const gp = wins + losses + ties;
    const winPercentage = gp > 0 ? (wins + ties * 0.5) / gp : 0;
    return {
      _id: `standings-${abbr}-${season}`,
      teamName: name,
      teamAbbr: abbr,
      wins,
      losses,
      ties,
      winPercentage,
      conference: group?.conference || 'AFC',
      division: group?.division || 'AFC East',
      streak
    };
  };

  let enriched: StandingsTeam[];

  if (docs.length > 0) {
    enriched = docs.map(d => {
      const abbr = d.teamAbbr.toUpperCase();
      const name = abbrToName[abbr] || abbr;
      return mapToStandingsTeam(abbr, name, d.wins || 0, d.losses || 0, d.ties || 0, d.streak);
    });
  } else {
    // Fallback: fetch live/ESPN + hardcoded backup so the page is never empty
    const apiData: ProcessedTeamData[] = await fetchNFLStandingsWithFallback();
    enriched = apiData.map((t) => {
      const abbr = nameToAbbr[t.teamName] || t.teamName.slice(0,3).toUpperCase();
      return mapToStandingsTeam(abbr, t.teamName, t.wins, t.losses, t.ties, undefined);
    });
  }

  const sortFn = (a: StandingsTeam, b: StandingsTeam) => {
    const byPct = b.winPercentage - a.winPercentage; if (byPct !== 0) return byPct;
    const byWins = b.wins - a.wins; if (byWins !== 0) return byWins;
    const byLosses = a.losses - b.losses; if (byLosses !== 0) return byLosses;
    const byTies = (b.ties || 0) - (a.ties || 0); if (byTies !== 0) return byTies;
    return a.teamName.localeCompare(b.teamName);
  };

  const standingsByDivision = divisions.reduce((acc, division) => {
    acc[division] = enriched.filter(t => t.division === division).slice().sort(sortFn);
    return acc;
  }, {} as Record<string, StandingsTeam[]>);

  const afcDivisions = divisions.slice(0, 4);
  const nfcDivisions = divisions.slice(4, 8);

  const hasAnyResults = enriched.some(t => t.wins + t.losses + t.ties > 0);

  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)] text-white">
      {/* Page header */}
      <header className="border-b border-white/10 px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">
              NFL Standings
            </h1>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/70">
              {season} Season
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400 md:text-base">
            Division races and conference tables, refreshed after every game window by <span className="font-semibold text-gray-200">The Snap</span>.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/40">
            {lastUpdatedDisplay && (
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Updated {lastUpdatedDisplay} ET
              </span>
            )}
            {hasAnyResults && (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-[3px] rounded-full bg-white/60" />
                Color bar marks the division leader
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Standings content */}
      <section className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 xl:grid-cols-2 xl:gap-10 2xl:gap-14">
            {/* AFC */}
            <div>
              <ConferenceHeader abbr="AFC" name="American Football Conference" />
              <div className="space-y-5">
                {afcDivisions.map(div => (
                  <DivisionTable key={div} division={div} teams={standingsByDivision[div] || []} confAccent={CONFERENCE_ACCENTS.AFC} />
                ))}
              </div>
            </div>
            {/* NFC */}
            <div>
              <ConferenceHeader abbr="NFC" name="National Football Conference" />
              <div className="space-y-5">
                {nfcDivisions.map(div => (
                  <DivisionTable key={div} division={div} teams={standingsByDivision[div] || []} confAccent={CONFERENCE_ACCENTS.NFC} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
