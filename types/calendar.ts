export type MilestonePhase =
  | 'Pre-Draft Intel'
  | 'Draft Week'
  | 'Rookie Camps'
  | 'Summer Install'
  | 'Preseason Ramp'
  | 'Regular Season';

export type MilestoneStatus = 'upcoming' | 'live' | 'past';

export interface MilestoneFaqItem {
  question: string;
  answer: string;
}

export interface LeagueMilestone {
  id: string;
  title: string;
  date: string; // ISO start date
  windowEnd?: string; // ISO end date for windows
  phase: MilestonePhase;
  type: 'event' | 'window';
  description?: string;
  location?: string;
  tags?: string[];
  faq?: MilestoneFaqItem[];
  relatedPaths?: string[]; // Internal routes to drive deeper reading
}

export interface CalendarMilestone extends LeagueMilestone {
  startDate: Date;
  endDate: Date;
  status: MilestoneStatus;
  daysUntil: number | null;
  countdownLabel: string;
  windowLabel?: string;
}

export interface CalendarBucket {
  phase: MilestonePhase;
  milestones: CalendarMilestone[];
  dateRangeLabel: string;
}
