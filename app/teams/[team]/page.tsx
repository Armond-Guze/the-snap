import { TEAM_META, TEAM_ABBRS, getTeamSeasonSchedule } from '@/lib/schedule';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import StructuredData from '@/app/components/StructuredData';
import { buildSportsEventList } from '@/lib/seo/sportsEventSchema';
import { client } from '@/sanity/lib/client';
import { getActiveSeason } from '@/lib/season';
import { fetchNFLStandingsWithFallback } from '@/lib/nfl-api';
import { TEAM_COLORS } from '@/app/components/teamLogos';

// Follow project convention: params delivered as a Promise
interface TeamPageProps { params: Promise<{ team: string }> }

function slugifyTeamName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function generateStaticParams() {
  return TEAM_ABBRS.flatMap((t) => {
    const meta = TEAM_META[t];
    const slug = meta?.name ? slugifyTeamName(meta.name) : null;
    return [
      { team: t.toLowerCase() },
      ...(slug ? [{ team: slug }] : []),
    ];
  });
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { team } = await params;
  const abbr = team.toUpperCase();
  const meta = TEAM_META[abbr] || Object.entries(TEAM_META).find(([, m]) => slugifyTeamName(m.name) === team.toLowerCase())?.[1];
  if (!meta) return { title: 'Team Schedule | The Snap' };
  const year = await getActiveSeason();
  const name = meta.name;
  const slug = slugifyTeamName(name);
  const title = `${year} ${name} Schedule – Game Dates & Scores | The Snap`;
  const description = `Full ${year} ${name} schedule with dates, opponents, kickoff times (ET), TV channels, live scores and final results.`;
  return {
    title,
    description,
    alternates: { canonical: `https://thegamesnap.com/teams/${slug}` },
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description }
  };
}

export const revalidate = 300;

function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export default async function TeamSchedulePage({ params }: TeamPageProps) {
  const { team } = await params;
  const raw = team.toLowerCase();
  const directAbbr = raw.toUpperCase();
  const directMeta = TEAM_META[directAbbr];
  const slugMatch = Object.entries(TEAM_META).find(([, m]) => slugifyTeamName(m.name) === raw);
  const abbr = directMeta ? directAbbr : slugMatch?.[0];
  const meta = abbr ? TEAM_META[abbr] : undefined;
  if (meta) {
    const slug = slugifyTeamName(meta.name);
    if (raw !== slug) {
      redirect(`/teams/${slug}`);
    }
  }
  if (!abbr || !meta) return <div className="max-w-4xl mx-auto px-4 py-12 text-white">Unknown team.</div>;
  const season = await getActiveSeason();
  const games = await getTeamSeasonSchedule(abbr);
  const standings = await fetchNFLStandingsWithFallback();
  const teamStanding = standings.find((t) => t.teamName.toLowerCase() === meta.name.toLowerCase());
  const divisionTeams = teamStanding
    ? standings
        .filter((t) => t.division === teamStanding.division)
        .slice()
        .sort((a, b) => {
          if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (a.losses !== b.losses) return a.losses - b.losses;
          return a.teamName.localeCompare(b.teamName);
        })
    : [];
  const divisionRank = teamStanding
    ? divisionTeams.findIndex((t) => t.teamName === teamStanding.teamName) + 1
    : null;
  const recordLabel = teamStanding
    ? `${teamStanding.wins}-${teamStanding.losses}${teamStanding.ties ? `-${teamStanding.ties}` : ''}`
    : null;
  const teamTag = await client.fetch<{ _id: string } | null>(
    `*[_type == "tag" && title == $title][0]{ _id }`,
    { title: meta.name }
  );
  const latestNews = teamTag?._id
    ? await client.fetch<{ _id: string; title: string; homepageTitle?: string; summary?: string; slug: { current: string }; _type?: string; coverImage?: { asset?: { url?: string } }; featuredImage?: { asset?: { url?: string } }; image?: { asset?: { url?: string } } }[]>(
        `*[
          ((_type=="article" && format=="headline") || _type=="headline") && published==true &&
          defined(teams) && $tagId in teams[]._ref
        ]|order(coalesce(publishedAt,_createdAt) desc)[0...20]{ _id,title,homepageTitle,summary,slug,_type,coverImage{asset->{url}},featuredImage{asset->{url}},image{asset->{url}} }`,
        { tagId: teamTag._id }
      )
    : [];
  const dedupedNews = (() => {
    const seen = new Set<string>();
    const items: typeof latestNews = [];
    for (const item of latestNews) {
      const slug = item.slug?.current?.trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      items.push(item);
      if (items.length >= 8) break;
    }
    return items;
  })();
  const enableEventSchema = process.env.ENABLE_EVENT_SCHEMA === 'true';
  const eventList = enableEventSchema
    ? buildSportsEventList(games, { country: 'US' }).slice(0, 50)
    : [];
    const teamSchema = enableEventSchema && eventList.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsTeam',
        name: meta.name,
        sport: 'American Football',
        memberOf: { '@type': 'SportsOrganization', name: 'NFL' },
          season: String(season),
        url: `https://thegamesnap.com/teams/${slugifyTeamName(meta.name)}`,
        hasPart: eventList,
      }
    : null;



  const teamAccent = TEAM_COLORS[abbr] || '#ffffff';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <section
        className="relative mb-6 rounded-2xl border border-white/10 p-5"
        style={{
          borderColor: `${teamAccent}55`,
          boxShadow: `0 12px 30px -20px ${teamAccent}88`,
          backgroundImage: `linear-gradient(120deg, ${teamAccent}66 0%, ${teamAccent}55 60%, ${teamAccent}44 100%)`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          {meta.logo && (
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-white/10 border border-white/10 p-2">
              <Image src={meta.logo} alt={`${meta.name} logo`} fill sizes="80px" className="object-contain" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 mb-2">
              <span className="px-2 py-1 bg-white/10 rounded border border-white/10">
                Record: {recordLabel || '—'}
              </span>
              <span className="px-2 py-1 bg-white/10 rounded border border-white/10">
                {teamStanding?.division ? `${teamStanding.division} • ${divisionRank ? ordinal(divisionRank) : '—'}` : 'Division: —'}
              </span>
            </div>
            <h1 className="text-3xl font-bold">{meta.name}</h1>
          </div>
        </div>
      </section>
      {teamSchema && <StructuredData data={teamSchema} id={`sd-team-${abbr}`} />}
      

      {dedupedNews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Latest {meta.name} News</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dedupedNews.map(n => {
              const href = n._type === 'article' ? `/articles/${n.slug.current}` : `/headlines/${n.slug.current}`;
              const img = n.coverImage?.asset?.url || n.featuredImage?.asset?.url || n.image?.asset?.url;
              return (
                <Link key={n._id} href={href} className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors overflow-hidden">
                  <div className="aspect-video bg-black/40">
                    {img && (
                      <Image src={img} alt={n.title} width={640} height={360} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white group-hover:text-white line-clamp-2">
                      {n.homepageTitle || n.title}
                    </h3>
                    {n.summary && (
                      <p className="text-xs text-white/60 mt-2 line-clamp-2">{n.summary}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}