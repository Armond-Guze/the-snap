import { client } from "@/sanity/lib/client";
import Image from "next/image";
import { TEAM_META } from "@/lib/schedule";
import { getActiveSeason } from "@/lib/season";

export const revalidate = 3600; // allow ISR; tag-based revalidation will refresh instantly when triggered

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

// Lightweight in-file component (not exported) to keep file cohesive
function DivisionTable({
  division,
  teams
}: { division: string; teams: StandingsTeam[] }) {
  return (
    <div className="bg-black border border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="bg-black px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
        <h3 className="text-base font-semibold text-white tracking-wide">{division}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-black/80">
              <th className="px-2.5 py-1.5 text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider">Team</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">W</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">L</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">Win %</th>
              <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">Strk</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr
                key={team._id}
                className="border-b border-gray-800 hover:bg-gray-900/70 transition-colors bg-black"
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
                    <span className="text-white font-medium text-[13px] sm:text-sm truncate max-w-[110px] md:max-w-[160px]">{team.teamName}</span>
                  </div>
                </td>
                <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">{team.wins}</td>
                <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">{team.losses}</td>
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
  const season = await getActiveSeason();
  const noCdnClient = client.withConfig({ useCdn: false });
  const docs: Array<{ _id: string; teamAbbr: string; wins: number; losses: number; ties?: number; streak?: string; updatedAt: string }>
    = await noCdnClient.fetch(
      `*[_type=="teamRecord" && season == $season]{ _id, teamAbbr, wins, losses, ties, streak, "updatedAt": _updatedAt }`,
      { season },
      { next: { tags: ['standings'], revalidate: 120 } }
    );

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

  const enriched: StandingsTeam[] = docs.map(d => {
    const abbr = d.teamAbbr.toUpperCase();
    const name = abbrToName[abbr] || abbr;
    const group = abbrToDivision[abbr];
    const wins = d.wins || 0, losses = d.losses || 0, ties = d.ties || 0;
    const gp = wins + losses + ties;
    const winPercentage = gp > 0 ? (wins + ties * 0.5) / gp : 0;
    return {
      _id: d._id,
      teamName: name,
      teamAbbr: abbr,
      wins, losses, ties,
      winPercentage,
      conference: group?.conference || 'AFC',
      division: group?.division || 'AFC East',
      streak: d.streak
    };
  });

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

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Compact Header / Tagline */}
      <header className="px-4 sm:px-6 lg:px-8 pt-8 pb-4 border-b border-gray-800/60 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            NFL STANDINGS
          </h1>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-3xl">
            Stay updated on the NFL standings with the latest rankings and team performance insights from <span className="text-gray-200 font-semibold">The Snap</span>.
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
              <div className="sticky top-0 z-10 bg-black/95 py-2.5 mb-4 rounded-xl shadow-lg border-b border-gray-800">
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
              <div className="sticky top-0 z-10 bg-black/95 py-2.5 mb-4 rounded-xl shadow-lg border-b border-gray-800">
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
    </div>
  );
}
