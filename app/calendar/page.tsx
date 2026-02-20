import Link from 'next/link';
import type { Metadata } from 'next';
import { getCalendarBuckets, getCalendarMilestones, getNextMilestone } from '@/lib/calendar';
import { formatDetailedDate } from '@/lib/date-utils';
import type { CalendarMilestone } from '@/types/calendar';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'NFL Offseason Calendar | The Snap',
  description:
    'Track every meaningful NFL offseason milestone with live countdowns, FAQs, and curated coverage from The Snap.',
  alternates: {
    canonical: '/calendar'
  },
  openGraph: {
    title: 'NFL Offseason Calendar',
    description: 'Important dates, countdowns, and context for the next league year.',
    url: `${SITE_URL}/calendar`
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Offseason Calendar',
    description: 'Important dates, countdowns, and context for the next league year.'
  }
};

export default function CalendarPage() {
  const milestones = getCalendarMilestones();
  const buckets = getCalendarBuckets();
  const nextMilestone = getNextMilestone(milestones);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black pb-24">
      <Hero nextMilestone={nextMilestone} totalMilestones={milestones.length} />
      <section className="max-w-6xl mx-auto mt-16 space-y-12 px-4 sm:px-6 lg:px-0">
        {buckets.map((bucket) => (
          <div key={bucket.phase} className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-10">
            <div className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">{bucket.phase}</p>
                <h2 className="text-2xl font-semibold text-white">{bucket.phase === 'Pre-Draft Intel' ? 'Intel & positioning' : bucket.phase}</h2>
              </div>
              <p className="text-sm text-white/70">{bucket.dateRangeLabel}</p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {bucket.milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Hero({ nextMilestone, totalMilestones }: { nextMilestone?: CalendarMilestone; totalMilestones: number }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]">
      <div className="absolute inset-0 opacity-20 blur-3xl" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:px-0">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">League calendar</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Every offseason flashpoint in a single command center
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
            Pin the combine, tag deadlines, minicamps, and preseason kickoffs without digging through PDF memos. We update the
            timeline, FAQs, and recommended coverage so you always know what&apos;s next.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <StatBlock label="Milestones mapped" value={String(totalMilestones)} sublabel="Offseason checkpoints" />
            <StatBlock label="Next up" value={nextMilestone?.countdownLabel ?? 'TBA'} sublabel={nextMilestone?.title ?? 'Awaiting new dates'} />
          </div>
        </div>
        <div className="w-full max-w-lg self-stretch rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-6 shadow-[0_25px_90px_rgba(8,145,178,0.35)]">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Next milestone</p>
          {nextMilestone ? (
            <div className="mt-4 space-y-4">
              <h3 className="text-2xl font-semibold text-white">{nextMilestone.title}</h3>
              <p className="text-sm text-white/70">{formatMilestoneDateLabel(nextMilestone)}</p>
              <p className="text-sm font-medium text-cyan-200">{nextMilestone.countdownLabel}</p>
              <p className="text-sm text-white/70">{nextMilestone.description}</p>
              {nextMilestone.relatedPaths?.length ? (
                <div className="pt-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Prep reads</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {nextMilestone.relatedPaths.map((path) => (
                      <Link
                        key={path}
                        href={path}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                      >
                        ↗ {path.replace(/^\//, '') || 'Read more'}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-lg font-semibold text-white">Catch your breath</p>
              <p className="mt-2 text-sm text-white/70">
                We&apos;ll refresh this module the moment the league publishes next season&apos;s key dates.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatBlock({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <p className="text-xs uppercase tracking-[0.35em] text-white/40">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="text-sm text-white/60">{sublabel}</p>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: CalendarMilestone }) {
  const statusClass = {
    upcoming: 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10',
    live: 'text-amber-200 border-amber-400/40 bg-amber-500/10',
    past: 'text-white/60 border-white/20 bg-white/5'
  }[milestone.status];

  return (
    <article className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.015] p-6 shadow-[0_35px_90px_rgba(0,0,0,0.35)]">
      <div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClass}`}>
            {milestone.status}
          </span>
          <span className="text-xs text-white/60">{formatMilestoneDateLabel(milestone)}</span>
          {milestone.windowLabel && <span className="text-xs text-white/60">• {milestone.windowLabel}</span>}
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">{milestone.title}</h3>
        {milestone.location && <p className="text-sm text-white/60">{milestone.location}</p>}
        <p className="mt-3 text-sm leading-relaxed text-white/75">{milestone.description}</p>
        <p className="mt-2 text-sm font-semibold text-cyan-200">{milestone.countdownLabel}</p>
        {milestone.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {milestone.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {milestone.faq?.length || milestone.relatedPaths?.length ? (
        <div className="mt-6 space-y-4 border-t border-white/5 pt-5 text-sm text-white/70">
          {milestone.faq?.length ? (
            <details className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/80">
              <summary className="cursor-pointer text-sm font-semibold tracking-wide">FAQ</summary>
              <div className="mt-3 space-y-3 text-sm">
                {milestone.faq.map((item) => (
                  <div key={item.question}>
                    <p className="font-semibold text-white">{item.question}</p>
                    <p className="text-white/70">{item.answer}</p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
          {milestone.relatedPaths?.length ? (
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Related coverage</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {milestone.relatedPaths.map((path) => (
                  <Link
                    key={path}
                    href={path}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    ↗ {path.replace(/^\//, '') || 'Read more'}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function formatMilestoneDateLabel(milestone: CalendarMilestone): string {
  if (milestone.type === 'window' && milestone.windowLabel) {
    return milestone.windowLabel;
  }
  return formatDetailedDate(milestone.startDate.toISOString());
}
