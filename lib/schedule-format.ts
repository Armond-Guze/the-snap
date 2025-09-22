import { EnrichedGame } from './schedule';

export const TIMEZONE_MAP: Record<string, string> = {
  ET: 'America/New_York',
  CT: 'America/Chicago',
  MT: 'America/Denver',
  PT: 'America/Los_Angeles',
  UTC: 'Etc/UTC'
};

export const TIMEZONE_CODES = Object.keys(TIMEZONE_MAP);

export interface FormatOptions {
  timezoneCode?: string; // e.g. 'ET'
  now?: Date; // injection for tests
  includeRelative?: boolean; // add Starts in Xh Ym
}

export interface FormattedGameDateParts {
  dateLabel: string;
  timeLabel: string;
  diffDays: number;
  relative?: string; // Starts in 2h 14m
  ianaTimezone: string;
}

function formatRelative(msDiff: number): string | undefined {
  if (msDiff <= 0) return undefined;
  const mins = Math.round(msDiff / 60000);
  if (mins > 24 * 60) return undefined;
  if (mins < 60) return `Starts in ${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `Starts in ${hours}h${rem ? ' ' + rem + 'm' : ''}`;
}

// Returns dateLabel (Today/Tomorrow or short date), timeLabel, diff in days, relative countdown
export function formatGameDateParts(dateUTC: string, opts: FormatOptions = {}): FormattedGameDateParts {
  const { timezoneCode = 'ET', now = new Date(), includeRelative = true } = opts;
  const iana = TIMEZONE_MAP[timezoneCode] || TIMEZONE_MAP.ET;
  const gameDate = new Date(dateUTC);

  // Helper to extract Y/M/D in a specific timezone using formatToParts (avoids DST / UTC boundary issues)
  function ymd(d: Date) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: iana, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)!.value;
    return { y: Number(get('year')), m: Number(get('month')), day: Number(get('day')) };
  }
  const n = ymd(now);
  const g = ymd(gameDate);
  const todayUTC = Date.UTC(n.y, n.m - 1, n.day);
  const gameUTC = Date.UTC(g.y, g.m - 1, g.day);
  const diffDays = Math.round((gameUTC - todayUTC) / 86400000);

  let dateLabel: string;
  if (diffDays === 0) dateLabel = 'Today';
  else if (diffDays === 1) dateLabel = 'Tomorrow';
  else dateLabel = new Intl.DateTimeFormat(undefined, { timeZone: iana, weekday: 'short', month: 'short', day: 'numeric' }).format(gameDate);

  const timeLabel = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: iana }).format(gameDate);
  const relative = includeRelative ? formatRelative(gameDate.getTime() - now.getTime()) : undefined;
  return { dateLabel, timeLabel, diffDays, relative, ianaTimezone: iana };
}

export function formatGameLine(game: EnrichedGame, opts?: FormatOptions): string {
  const { dateLabel, timeLabel } = formatGameDateParts(game.dateUTC, opts);
  return `${dateLabel} ${timeLabel}`;
}

// Shorten TV network labels for compact/mobile displays
// Examples:
// - "Prime Video" -> "Prime"
// - "NFL Network" -> "NFLN"
// - "ESPN/ABC" -> "ESPN"
// - Keep short codes like CBS/FOX/NBC/ESPN/NFLN as-is
export function shortNetworkLabel(network?: string): string {
  if (!network || !network.trim()) return 'TBD';
  const n = network.trim();
  // Prime Video variations
  if (/^prime(\s+video)?$/i.test(n)) return 'Prime';
  // NFL Network full name
  if (/^nfl\s*network$/i.test(n)) return 'NFLN';
  // Already-short forms
  if (/^(CBS|FOX|NBC|ESPN|ABC|NFLN)$/i.test(n)) return n.toUpperCase();
  // If multiple networks separated by '/', prefer the first (e.g., ESPN/ABC -> ESPN)
  if (n.includes('/')) return n.split('/')[0];
  return n;
}
