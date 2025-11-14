import { GameCenterInsight } from '@/lib/game-center';

interface Props {
  insights: GameCenterInsight[];
}

export function GameCenterInsights({ insights }: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Instant storylines</h2>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Auto-generated</p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {insights.map((insight) => (
          <article key={insight.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{insight.tag}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{insight.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{insight.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
