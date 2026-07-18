import { client } from "@/sanity/lib/client";
import Image from "next/image";
import Link from "next/link";
import StructuredData from "../components/StructuredData";
import { TEAM_META } from "@/lib/schedule";
import { getActiveSeason, getScheduleSeason } from "@/lib/season";
import { fetchNFLStandingsWithFallback, ProcessedTeamData } from "@/lib/nfl-api";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600; // allow ISR; tag-based revalidation will refresh instantly when triggered

export async function generateMetadata(): Promise<Metadata> {
  const season = await getActiveSeason();
  const title = `${season} NFL Standings: AFC, NFC & Division Records | The Snap`;
  const description = `${season} NFL standings with AFC and NFC division records, win percentages, streaks and links to every team hub. Updated throughout the season.`;
  return {
    title,
    description,
    keywords: [
      `${season} NFL standings`,
      'NFL standings',
      'AFC standings',
      'NFC standings',
      'NFL division standings',
    ],
    alternates: { canonical: `${SITE_URL}/standings` },
    openGraph: { title, description, url: `${SITE_URL}/standings`, type: "website" },
    twitter: { card: 'summary_large_image', title, description },
  };
}

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

function slugifyTeamName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Lightweight in-file component (not exported) to keep file cohesive
function DivisionTable({
  division,
  teams
}: { division: string; teams: StandingsTeam[] }) {
  return (
    <div className="bg-[hsl(0_0%_3.9%)] border border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="bg-[hsl(0_0%_3.9%)] px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
        <h3 className="text-base font-semibold text-white tracking-wide">{division}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">{division} standings</caption>
          <thead>
            <tr className="bg-[hsl(0_0%_3.9%)/0.8]">
              <th className="px-2.5 py-1.5 text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider">Team</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">W</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">L</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">T</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">Win %</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">Strk</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr
                key={team._id}
                className="border-b border-gray-800 hover:bg-[hsl(0_0%_5%)] transition-colors bg-[hsl(0_0%_3.9%)]"
              >
                <td className="px-2.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                      <Image
                        src={TEAM_META[team.teamAbbr]?.logo || "/images/teams/placeholder.svg"}
                        alt={team.teamName}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                    <Link
                      href={`/teams/${slugifyTeamName(team.teamName)}`}
                      className="text-white font-medium text-[13px] sm:text-sm truncate max-w-[110px] md:max-w-[160px] hover:text-white/90"
                    >
                      {team.teamName}
                    </Link>
                  </div>
                </td>
                <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">{team.wins}</td>
                <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">{team.losses}</td>
                <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">{team.ties}</td>
                <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">{(team.winPercentage * 100).toFixed(1)}%</td>
                <td className="px-2.5 py-2.5 text-center text-white/80 font-medium text-xs">{team.streak || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {teams.length === 0 && (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">No standings data available for {division}</div>
      )}
    </div>
  );
}

export default async function StandingsPage() {
  // Fetch standings data (server-side) with tag for instant revalidation
  const [season, scheduleSeason] = await Promise.all([getActiveSeason(), getScheduleSeason()]);
  const noCdnClient = client.withConfig({ useCdn: false });
  const docs: Array<{ _id: string; teamAbbr: string; wins: number; losses: number; ties?: number; streak?: string; updatedAt: string }>
    = await noCdnClient.fetch(
      `*[_type=="teamRecord" && season == $season]{ _id, teamAbbr, wins, losses, ties, streak, "updatedAt": _updatedAt }`,
      { season },
      { next: { tags: ['standings'], revalidate: 120 } }
    );

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
  const isFinal = enriched.length === 32 && enriched.every((team) => team.wins + team.losses + team.ties >= 17);
  const standingsSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${season} NFL Standings`,
    url: `${SITE_URL}/standings`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: enriched.length,
      itemListElement: divisions.flatMap((division) => standingsByDivision[division] || []).map((team, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${team.teamName} ${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`,
        url: `${SITE_URL}/teams/${slugifyTeamName(team.teamName)}`,
      })),
    },
  };

  return (
    <div className="bg-[hsl(0_0%_3.9%)] min-h-screen text-white">
      <StructuredData id={`standings-${season}`} data={standingsSchema} />
      {/* Compact Header / Tagline */}
      <header className="px-4 sm:px-6 lg:px-8 pt-8 pb-4 border-b border-gray-800/60 bg-[hsl(0_0%_3.9%)/0.9] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {season} NFL STANDINGS
          </h1>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-3xl">
            {isFinal
              ? `Final ${season} regular-season records for every AFC and NFC division.`
              : `${season} regular-season records for every AFC and NFC division, updated as games finish.`}
          </p>
          {lastUpdatedDisplay && (
            <p className="text-xs text-gray-500 mt-2">Last updated {lastUpdatedDisplay}.</p>
          )}
        </div>
      </header>
      {/* Standings Content (moved up, improved design) */}
  <section className="relative pt-6 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          {/* Two-column conference layout on xl+, stacked otherwise */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-14 xl:gap-16 2xl:gap-20">
            {/* AFC */}
            <div>
              <div className="sticky top-0 z-10 bg-[hsl(0_0%_3.9%)/0.95] py-2.5 mb-4 rounded-xl shadow-lg border-b border-gray-800">
                <h2 className="text-xl md:text-2xl font-bold text-white text-center tracking-wide">American Football Conference (AFC)</h2>
              </div>
              <div className="space-y-6 md:space-y-8">
                {afcDivisions.map(div => (
                  <DivisionTable key={div} division={div} teams={standingsByDivision[div] || []} />
                ))}
              </div>
            </div>
            {/* NFC */}
            <div>
              <div className="sticky top-0 z-10 bg-[hsl(0_0%_3.9%)/0.95] py-2.5 mb-4 rounded-xl shadow-lg border-b border-gray-800">
                <h2 className="text-xl md:text-2xl font-bold text-white text-center tracking-wide">National Football Conference (NFC)</h2>
              </div>
              <div className="space-y-6 md:space-y-8">
                {nfcDivisions.map(div => (
                  <DivisionTable key={div} division={div} teams={standingsByDivision[div] || []} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-gray-800/70 px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="standings-guide">
        <div className="mx-auto max-w-4xl">
          <h2 id="standings-guide" className="text-2xl font-bold">How to read NFL standings</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            W, L and T show wins, losses and ties. Win percentage counts a tie as half a win, while Strk shows a team&apos;s current winning or losing streak. Teams on this page are sorted by record and winning percentage; the NFL applies additional official tiebreakers when records are equal.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/schedule" className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-white/85 hover:bg-white/10">
              View the {scheduleSeason} NFL schedule
            </Link>
            <Link href="/teams" className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-white/85 hover:bg-white/10">
              Browse all team hubs
            </Link>
            <Link href="/articles/power-rankings" className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-white/85 hover:bg-white/10">
              NFL power rankings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
