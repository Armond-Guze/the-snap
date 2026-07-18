import type { Metadata } from 'next';
import StructuredData from '../components/StructuredData';
import WeekDropdown from './WeekDropdown';
import TimezoneClient from './TimezoneClient';
import { GamesBuckets, ScheduleFAQ } from './ScheduleContent';
import { getScheduleWeekOrCurrent } from '@/lib/schedule';
import { getScheduleSeason } from '@/lib/season';
import { fetchTeamRecords } from '@/lib/team-records';
import { normalizeTimezoneCode } from '@/lib/schedule-format';
import { buildSportsEventList } from '@/lib/seo/sportsEventSchema';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const season = await getScheduleSeason();
  const title = `${season} NFL Schedule: Games, Times & TV | The Snap`;
  const description = `Full ${season} NFL schedule by week with matchups, kickoff times, TV networks, flexible games, live status and final scores.`;
  return {
    title,
    description,
    keywords: [
      `${season} NFL schedule`,
      'NFL schedule',
      'NFL games this week',
      'NFL TV schedule',
      'NFL kickoff times',
    ],
    alternates: { canonical: `${SITE_URL}/schedule` },
    openGraph: { title, description, url: `${SITE_URL}/schedule`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  };
}

interface ScheduleLandingProps {
  searchParams: Promise<{
    team?: string | string[];
    tz?: string | string[];
  }>;
}

function toSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.find((entry) => entry.trim().length > 0)?.trim();
  }
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export default async function ScheduleLandingPage({ searchParams }: ScheduleLandingProps) {
  const query = await searchParams;
  const teamParam = toSingleParam(query.team)?.toUpperCase();
  const timezoneCode = normalizeTimezoneCode(toSingleParam(query.tz));
  const season = await getScheduleSeason();
  const { week, games } = await getScheduleWeekOrCurrent(undefined, String(season));
  const recordsMap = await fetchTeamRecords(season);
  const filteredGames = teamParam
    ? games.filter((game) => game.home === teamParam || game.away === teamParam)
    : games;

  const enableEventSchema = process.env.ENABLE_EVENT_SCHEMA === 'true';
  const events = enableEventSchema
    ? buildSportsEventList(filteredGames.filter((game) => !game.dateTimeTBD), { country: 'US' }).slice(0, 25)
    : [];
  const scheduleSchema = events.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${season} NFL Schedule Week ${week}`,
        itemListElement: events,
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-3 text-white md:pt-8">
      {scheduleSchema && <StructuredData data={scheduleSchema} id={`sd-schedule-${season}-week-${week}`} />}
      <h1 className="mb-2 text-3xl font-bold">{season} NFL Schedule</h1>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-white/65">
        Browse every regular-season matchup by week, including kickoff times, TV networks, live game status and final scores. The schedule opens to Week {week}, the nearest upcoming or active week.
      </p>
      <WeekDropdown currentWeek={week} showAutoWeekLink={false} />
      <TimezoneClient />
      <GamesBuckets games={filteredGames} recordsMap={recordsMap} timezoneCode={timezoneCode} />
      <ScheduleFAQ season={season} />
    </div>
  );
}
