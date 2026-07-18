import type { Metadata } from 'next';
import Link from 'next/link';
import StructuredData from '../../../components/StructuredData';
import WeekDropdown from '../../WeekDropdown';
import TimezoneClient from '../../TimezoneClient';
import { GamesBuckets } from '../../ScheduleContent';
import { getScheduleWeekOrCurrent } from '@/lib/schedule';
import { getScheduleSeason } from '@/lib/season';
import { fetchTeamRecords } from '@/lib/team-records';
import { normalizeTimezoneCode } from '@/lib/schedule-format';
import { buildSportsEventList } from '@/lib/seo/sportsEventSchema';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 300;

interface Params { week: string }
interface WeekPageProps {
  params: Promise<Params>;
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

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { week: rawWeek } = await params;
  const parsedWeek = Number(rawWeek);
  const week = Number.isInteger(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 18 ? parsedWeek : undefined;
  const season = await getScheduleSeason();
  const canonical = `${SITE_URL}${week ? `/schedule/week/${week}` : '/schedule'}`;
  const title = week
    ? `${season} NFL Week ${week} Schedule: Times & TV | The Snap`
    : `${season} NFL Schedule | The Snap`;
  const description = week
    ? `Complete ${season} NFL Week ${week} schedule with every matchup, kickoff time, TV network, flexible game, live status and final score.`
    : `Full ${season} NFL schedule with weekly matchups, kickoff times and TV networks.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: Boolean(week), follow: true },
  };
}

export default async function WeekSchedulePage({ params, searchParams }: WeekPageProps) {
  const [{ week: rawWeek }, query] = await Promise.all([params, searchParams]);
  const requestedWeek = Number(rawWeek);
  const teamParam = toSingleParam(query.team)?.toUpperCase();
  const timezoneCode = normalizeTimezoneCode(toSingleParam(query.tz));
  const season = await getScheduleSeason();
  const { week, games } = await getScheduleWeekOrCurrent(requestedWeek, String(season));
  const recordsMap = await fetchTeamRecords(season);
  const filteredGames = teamParam
    ? games.filter((game) => game.home === teamParam || game.away === teamParam)
    : games;
  const flexibleGameCount = filteredGames.filter((game) => game.dateTimeTBD).length;

  const enableEventSchema = process.env.ENABLE_EVENT_SCHEMA === 'true';
  const events = enableEventSchema
    ? buildSportsEventList(filteredGames.filter((game) => !game.dateTimeTBD), { country: 'US' }).slice(0, 25)
    : [];
  const scheduleSchema = events.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${season} NFL Week ${week} Schedule`,
        itemListElement: events,
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-3 text-white md:pt-8">
      {scheduleSchema && <StructuredData data={scheduleSchema} id={`sd-${season}-week-${week}`} />}
      <h1 className="mb-2 text-3xl font-bold">{season} NFL Schedule – Week {week}</h1>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-white/65">
        All {filteredGames.length} Week {week} matchups with kickoff times, TV networks and game status.
        {flexibleGameCount > 0 && ` ${flexibleGameCount} late-season matchup${flexibleGameCount === 1 ? ' is' : 's are'} awaiting an official date and kickoff time.`}
      </p>
      <WeekDropdown currentWeek={week} showAutoWeekLink={false} />
      <TimezoneClient />
      <GamesBuckets games={filteredGames} recordsMap={recordsMap} timezoneCode={timezoneCode} />
      <p className="mt-10 text-sm text-white/65">
        <Link href="/schedule" className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
          Return to the full {season} NFL schedule
        </Link>
      </p>
    </div>
  );
}

export async function generateStaticParams() {
  return Array.from({ length: 18 }, (_, index) => ({ week: String(index + 1) }));
}
