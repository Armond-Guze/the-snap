import { GameCenterTimelineEntry } from '@/lib/game-center';

interface Props {
  entries: GameCenterTimelineEntry[];
}

const statusStyles: Record<GameCenterTimelineEntry['status'], string> = {
  upcoming: 'bg-slate-800 text-slate-300 border border-slate-700',
  live: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40',
  complete: 'bg-slate-900 text-slate-400 border border-slate-800',
};

export function GameCenterTimeline({ entries }: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold text-white">Timeline</h2>
      <div className="mt-4 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className={`rounded-2xl p-4 ${statusStyles[entry.status]}`}>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{entry.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{entry.detail}</p>
            <p className="mt-1 text-sm text-slate-300">
              {entry.status === 'live'
                ? 'Happening now'
                : entry.status === 'complete'
                ? 'Locked in'
                : 'On deck'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
