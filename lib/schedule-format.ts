import { EnrichedGame } from './schedule';

// Returns dateLabel (Today/Tomorrow or short date), timeLabel, and diff in days
export function formatGameDateParts(dateUTC: string, now = new Date()): { dateLabel: string; timeLabel: string; diffDays: number } {
  const d = new Date(dateUTC);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfGame = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfGame.getTime() - startOfToday.getTime()) / 86400000);
  let dateLabel: string;
  if (diffDays === 0) dateLabel = 'Today';
  else if (diffDays === 1) dateLabel = 'Tomorrow';
  else dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return { dateLabel, timeLabel, diffDays };
}

export function formatGameLine(game: EnrichedGame): string {
  const { dateLabel, timeLabel } = formatGameDateParts(game.dateUTC);
  return `${dateLabel} ${timeLabel}`;
}
