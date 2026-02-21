import { TEAM_META, TEAM_ABBRS, getTeamSeasonSchedule } from '@/lib/schedule';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import StructuredData from '@/app/components/StructuredData';
import { buildSportsEventList } from '@/lib/seo/sportsEventSchema';
import { client } from '@/sanity/lib/client';
import { getActiveSeason } from '@/lib/season';
import { fetchNFLStandingsWithFallback, type ProcessedTeamData } from '@/lib/nfl-api';
import { TEAM_COLORS } from '@/app/components/teamLogos';
import { SITE_URL } from '@/lib/site-config';

interface TeamPageProps {
  params: Promise<{ team: string }>;
}

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

function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatRecord(team?: ProcessedTeamData) {
  if (!team) return '—';
  return `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`;
}

function formatGameDateLabel(dateUTC: string) {
  const d = new Date(dateUTC);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}

function formatGameTimeLabel(dateUTC: string) {
  const d = new Date(dateUTC);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });
}

function teamBySlugOrAbbr(team: string) {
  const raw = team.toLowerCase();
  const directAbbr = raw.toUpperCase();
  const directMeta = TEAM_META[directAbbr];
  if (directMeta) {
    return { abbr: directAbbr, meta: directMeta };
  }

  const slugMatch = Object.entries(TEAM_META).find(([, m]) => slugifyTeamName(m.name) === raw);
  if (!slugMatch) return null;

  return {
    abbr: slugMatch[0],
    meta: slugMatch[1],
  };
}

function sortStandings(teams: ProcessedTeamData[]) {
  return teams.slice().sort((a, b) => {
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return a.teamName.localeCompare(b.teamName);
  });
}

export async function generateStaticParams() {
  return TEAM_ABBRS.flatMap((abbr) => {
    const meta = TEAM_META[abbr];
    const slug = meta?.name ? slugifyTeamName(meta.name) : null;

    return [{ team: abbr.toLowerCase() }, ...(slug ? [{ team: slug }] : [])];
  });
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { team } = await params;
  const resolved = teamBySlugOrAbbr(team);

  if (!resolved) {
    return { title: 'NFL Team Hub | The Snap' };
  }

  const season = await getActiveSeason();
  const slug = slugifyTeamName(resolved.meta.name);
  const title = `${resolved.meta.name} Hub (${season}) – News, Schedule & Division Snapshot | The Snap`;
  const description = `Everything for the ${resolved.meta.name} in one place: latest stories, season schedule, and live division context.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/teams/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/teams/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export const revalidate = 300;

export default async function TeamHubPage({ params }: TeamPageProps) {
  const { team } = await params;
  const resolved = teamBySlugOrAbbr(team);

  if (!resolved) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-white">Unknown team.</div>;
  }

  const { abbr, meta } = resolved;
  const canonicalSlug = slugifyTeamName(meta.name);
  if (team.toLowerCase() !== canonicalSlug) {
    redirect(`/teams/${canonicalSlug}`);
  }

  const [season, games, standings] = await Promise.all([
    getActiveSeason(),
    getTeamSeasonSchedule(abbr),
    fetchNFLStandingsWithFallback(),
  ]);

  const teamStanding = standings.find((t) => t.teamName.toLowerCase() === meta.name.toLowerCase());
  const divisionStandings = teamStanding
    ? sortStandings(standings.filter((t) => t.division === teamStanding.division))
    : [];
  const conferenceStandings = teamStanding
    ? sortStandings(standings.filter((t) => t.conference === teamStanding.conference))
    : [];

  const divisionRank = teamStanding
    ? divisionStandings.findIndex((t) => t.teamName === teamStanding.teamName) + 1
    : null;
  const conferenceRank = teamStanding
    ? conferenceStandings.findIndex((t) => t.teamName === teamStanding.teamName) + 1
    : null;

  const now = Date.now();
  const upcomingGames = games.filter((g) => Date.parse(g.dateUTC) >= now).slice(0, 5);
  const recentGames = games.filter((g) => Date.parse(g.dateUTC) < now).slice(-3).reverse();

  const teamTag = await client.fetch<{ _id: string } | null>(
    `*[
      _type == "tag" && (
        title == $title ||
        slug.current == $slug ||
        lower(title) == lower($abbr) ||
        $abbr in coalesce(aliases, [])
      )
    ][0]{ _id }`,
    { title: meta.name, slug: canonicalSlug, abbr }
  );

  const latestNews = teamTag?._id
    ? await client.fetch<
        {
          _id: string;
          title: string;
          homepageTitle?: string;
          summary?: string;
          slug: { current: string };
          _type?: string;
          publishedAt?: string;
          date?: string;
          coverImage?: { asset?: { url?: string } };
          featuredImage?: { asset?: { url?: string } };
          image?: { asset?: { url?: string } };
        }[]
      >(
        `*[
          _type in ["article", "headline", "rankings"] &&
          published == true &&
          defined(slug.current) &&
          (
            (defined(teams) && $tagId in teams[]._ref) ||
            (defined(tagRefs) && $tagId in tagRefs[]._ref)
          )
        ]
        | order(coalesce(publishedAt, date, _createdAt) desc)[0...20]{
          _id,
          title,
          homepageTitle,
          summary,
          slug,
          _type,
          publishedAt,
          date,
          coverImage{asset->{url}},
          featuredImage{asset->{url}},
          image{asset->{url}}
        }`,
        { tagId: teamTag._id }
      )
    : [];

  const dedupedNews = (() => {
    const seen = new Set<string>();
    const items: typeof latestNews = [];

    for (const item of latestNews) {
      const slugValue = item.slug?.current?.trim();
      if (!slugValue || seen.has(slugValue)) continue;
      seen.add(slugValue);
      items.push(item);
      if (items.length >= 8) break;
    }

    return items;
  })();

  const eventSchemaEnabled = process.env.ENABLE_EVENT_SCHEMA === 'true';
  const eventList = eventSchemaEnabled ? buildSportsEventList(games, { country: 'US' }).slice(0, 50) : [];

  const teamSchema = eventSchemaEnabled && eventList.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsTeam',
        name: meta.name,
        sport: 'American Football',
        memberOf: { '@type': 'SportsOrganization', name: 'NFL' },
        season: String(season),
        url: `${SITE_URL}/teams/${canonicalSlug}`,
        hasPart: eventList,
      }
    : null;

  const teamAccent = TEAM_COLORS[abbr] || '#9CA3AF';
  const currentDivisionCodes = DIVISION_GROUPS.find((group) => group.title === teamStanding?.division)?.teams || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-white sm:px-6 lg:px-8">
      {teamSchema && <StructuredData data={teamSchema} id={`sd-team-${abbr}`} />}

      <section
        className="relative overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-7"
        style={{
          borderColor: `${teamAccent}66`,
          boxShadow: `0 22px 60px -45px ${teamAccent}`,
          backgroundImage: `linear-gradient(135deg, ${teamAccent}44 0%, rgba(10,10,12,0.92) 45%, rgba(3,3,4,0.95) 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.16),transparent_35%)]" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {meta.logo && (
              <div className="relative h-16 w-16 rounded-2xl border border-white/20 bg-white/10 p-2 sm:h-20 sm:w-20">
                <Image src={meta.logo} alt={`${meta.name} logo`} fill sizes="80px" className="object-contain" />
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Team Hub</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">{meta.name}</h1>
              <p className="mt-2 text-sm text-white/75">{season} coverage center: schedule, standings context, and latest team stories.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
            <div className="rounded-xl border border-white/15 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Record</p>
              <p className="mt-1 text-lg font-bold text-white">{formatRecord(teamStanding)}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Division</p>
              <p className="mt-1 text-lg font-bold text-white">{divisionRank ? ordinal(divisionRank) : '—'}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Conference</p>
              <p className="mt-1 text-lg font-bold text-white">{conferenceRank ? ordinal(conferenceRank) : '—'}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Division</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{teamStanding?.division || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          <Link href="/standings" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Standings</Link>
          <Link href={`/schedule?team=${abbr}`} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Team Schedule</Link>
          <Link href={`/headlines?search=${encodeURIComponent(meta.name)}`} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">Search Headlines</Link>
          <Link href="/teams" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">All Teams Hub</Link>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
        <main className="space-y-10">
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Latest {meta.name} News</h2>
                <p className="mt-1 text-sm text-white/60">Recent stories tagged to this team across The Snap.</p>
              </div>
            </div>

            {dedupedNews.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                No tagged team stories yet. Check back soon.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {dedupedNews.map((item) => {
                  const href = item._type === 'headline' ? `/headlines/${item.slug.current}` : `/articles/${item.slug.current}`;
                  const img = item.coverImage?.asset?.url || item.featuredImage?.asset?.url || item.image?.asset?.url;

                  return (
                    <Link
                      key={item._id}
                      href={href}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.07]"
                    >
                      <div className="relative aspect-video overflow-hidden bg-zinc-900">
                        {img ? (
                          <Image
                            src={img}
                            alt={item.homepageTitle || item.title}
                            fill
                            sizes="(min-width: 1280px) 24vw, (min-width: 640px) 48vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                          {(item.date || item.publishedAt) ? new Date(item.date || item.publishedAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Latest'}
                        </p>
                        <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-white group-hover:text-white/90">
                          {item.homepageTitle || item.title}
                        </h3>
                        {item.summary && <p className="mt-2 line-clamp-2 text-xs text-white/65">{item.summary}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">{season} Schedule Snapshot</h2>
              <p className="mt-1 text-sm text-white/60">Next up and recent results view for quick team tracking.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/65">Upcoming Games</h3>
                {upcomingGames.length === 0 ? (
                  <p className="text-sm text-white/60">No upcoming games found.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {upcomingGames.map((game) => {
                      const isHome = game.home === abbr;
                      const oppAbbr = isHome ? game.away : game.home;
                      const oppMeta = TEAM_META[oppAbbr];
                      return (
                        <li key={game.gameId} className="rounded-xl border border-white/10 bg-black/25 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Week {game.week}</p>
                            <p className="text-xs text-white/55">{formatGameDateLabel(game.dateUTC)} • {formatGameTimeLabel(game.dateUTC)} ET</p>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-white">{isHome ? 'vs' : '@'} {oppMeta?.name || oppAbbr}</p>
                          <div className="mt-1 text-xs text-white/55">{game.network || 'Network TBD'}{game.venue ? ` • ${game.venue}` : ''}</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/65">Recent Games</h3>
                {recentGames.length === 0 ? (
                  <p className="text-sm text-white/60">Season has not started yet.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {recentGames.map((game) => {
                      const isHome = game.home === abbr;
                      const oppAbbr = isHome ? game.away : game.home;
                      const oppMeta = TEAM_META[oppAbbr];
                      return (
                        <li key={game.gameId} className="rounded-xl border border-white/10 bg-black/25 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Week {game.week}</p>
                            <p className="text-xs text-white/55">{formatGameDateLabel(game.dateUTC)}</p>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-white">{isHome ? 'vs' : '@'} {oppMeta?.name || oppAbbr}</p>
                          <div className="mt-1 text-xs text-white/55">{game.network || 'Network TBD'}{game.venue ? ` • ${game.venue}` : ''}</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/65">Division Snapshot</h2>
            {divisionStandings.length === 0 ? (
              <p className="text-sm text-white/60">Division standings unavailable.</p>
            ) : (
              <ul className="space-y-2">
                {divisionStandings.map((teamData, index) => {
                  const teamCode = TEAM_ABBRS.find((code) => TEAM_META[code].name === teamData.teamName);
                  const isCurrent = teamData.teamName === meta.name;
                  return (
                    <li
                      key={teamData.teamName}
                      className={`rounded-lg border px-3 py-2 ${
                        isCurrent ? 'border-white/35 bg-white/10' : 'border-white/10 bg-black/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {index + 1}. {teamData.teamName}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.1em] text-white/55">{teamCode || 'NFL'}</p>
                        </div>
                        <p className="text-sm font-bold text-white">{formatRecord(teamData)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {currentDivisionCodes.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/65">Division Team Hubs</h2>
              <div className="grid grid-cols-2 gap-2">
                {currentDivisionCodes.map((code) => {
                  const tMeta = TEAM_META[code];
                  return (
                    <Link
                      key={code}
                      href={`/teams/${slugifyTeamName(tMeta.name)}`}
                      className="rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-center text-xs font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {code}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">NFL Team Hub Index</h2>
            <p className="text-sm text-white/60">Jump to any team page directly from here.</p>
          </div>
          <Link href="/standings" className="text-sm font-semibold text-white/75 hover:text-white">View full standings →</Link>
        </div>

        <div className="space-y-5">
          {DIVISION_GROUPS.map((division) => (
            <div key={division.title}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/55">{division.title}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {division.teams.map((code) => {
                  const tMeta = TEAM_META[code];
                  const accent = TEAM_COLORS[code] || '#9CA3AF';
                  return (
                    <Link
                      key={code}
                      href={`/teams/${slugifyTeamName(tMeta.name)}`}
                      className="group rounded-xl border border-white/10 px-3 py-2 transition-colors hover:bg-white/[0.07]"
                      style={{ backgroundColor: `${accent}22` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md bg-black/25 p-1">
                          <Image src={tMeta.logo} alt={`${tMeta.name} logo`} fill sizes="28px" className="object-contain" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">{code}</p>
                          <p className="truncate text-[11px] text-white/70 group-hover:text-white/90">
                            {tMeta.name.split(' ').slice(-1)[0]}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
