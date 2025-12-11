import { CalendarBucket, CalendarMilestone, LeagueMilestone, MilestoneStatus } from '@/types/calendar';
import { leagueMilestones } from '@/data/league-calendar';

const DAY_IN_MS = 86_400_000;

export function getCalendarMilestones(now: Date = new Date()): CalendarMilestone[] {
  return leagueMilestones
    .map((milestone) => enrichMilestone(milestone, now))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function getCalendarBuckets(now: Date = new Date()): CalendarBucket[] {
  const milestones = getCalendarMilestones(now);
  const grouped = new Map<CalendarBucket['phase'], CalendarMilestone[]>();

  for (const milestone of milestones) {
    const bucket = grouped.get(milestone.phase) ?? [];
    bucket.push(milestone);
    grouped.set(milestone.phase, bucket);
  }

  return Array.from(grouped.entries()).map(([phase, items]) => ({
    phase,
    milestones: items,
    dateRangeLabel: buildRangeLabel(items[0].startDate, items[items.length - 1].endDate)
  }));
}

export function getNextMilestone(milestones: CalendarMilestone[] = getCalendarMilestones()): CalendarMilestone | undefined {
  return milestones.find((milestone) => milestone.status !== 'past');
}

function enrichMilestone(milestone: LeagueMilestone, now: Date): CalendarMilestone {
  const startDate = new Date(milestone.date);
  const endDate = new Date(milestone.windowEnd ?? milestone.date);
  const status = computeStatus(now, startDate, endDate);
  const daysUntil = status === 'past' ? null : Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / DAY_IN_MS));

  return {
    ...milestone,
    startDate,
    endDate,
    status,
    daysUntil,
    countdownLabel: buildCountdownLabel(status, daysUntil),
    windowLabel: milestone.type === 'window' ? buildRangeLabel(startDate, endDate) : undefined,
  };
}

function computeStatus(now: Date, start: Date, end: Date): MilestoneStatus {
  if (now > end) return 'past';
  if (now >= start && now <= end) return 'live';
  return 'upcoming';
}

function buildCountdownLabel(status: MilestoneStatus, daysUntil: number | null): string {
  if (status === 'past') return 'Wrapped';
  if (status === 'live') return 'Live now';
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `${daysUntil} days out`;
}

function buildRangeLabel(start: Date, end: Date): string {
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric'
  });

  const endLabel = sameMonth
    ? end.toLocaleDateString('en-US', { day: 'numeric', year: sameYear ? undefined : 'numeric' })
    : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' });

  return `${startLabel} – ${endLabel}`;
}
