import type { EnrichedGame } from '@/lib/schedule';

type GameLike = Pick<EnrichedGame, 'home' | 'away' | 'dateUTC' | 'status'> & {
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  network?: string | null;
};

export interface SportsEventOptions {
  country?: string;
}

const eventStatusMap: Record<string, string> = {
  FINAL: 'https://schema.org/EventCompleted',
  IN_PROGRESS: 'https://schema.org/EventInProgress',
  SCHEDULED: 'https://schema.org/EventScheduled',
};

export function buildSportsEvent(game: GameLike, opts: SportsEventOptions = {}) {
  const venue = game.venue?.trim();
  const city = game.city?.trim();
  const state = game.state?.trim();
  const country = (opts.country || game.country || 'US').trim();

  // Require location fields; if missing, do not emit schema
  if (!venue || !city || !state || !country) return null;

  if (!game.dateUTC || Number.isNaN(Date.parse(game.dateUTC))) return null;

  const startDate = new Date(game.dateUTC).toISOString();
  const statusKey = game.status?.toUpperCase?.() || 'SCHEDULED';
  const eventStatus = eventStatusMap[statusKey] || 'https://schema.org/EventScheduled';

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${game.away} @ ${game.home}`,
    startDate,
    eventStatus,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: state,
        addressCountry: country,
      },
    },
    competitor: [
      { '@type': 'SportsTeam', name: game.away },
      { '@type': 'SportsTeam', name: game.home },
    ],
    broadcastChannel: game.network || undefined,
  } as const;
}

export function buildSportsEventList(games: GameLike[], opts: SportsEventOptions = {}) {
  return games
    .map((g) => buildSportsEvent(g, opts))
    .filter((g): g is NonNullable<ReturnType<typeof buildSportsEvent>> => Boolean(g));
}
