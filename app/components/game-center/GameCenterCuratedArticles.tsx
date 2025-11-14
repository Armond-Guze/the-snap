import Link from 'next/link'
import { GameCenterArticleLink } from '@/lib/game-center'

interface Props {
  articles: GameCenterArticleLink[]
}

export function GameCenterCuratedArticles({ articles }: Props) {
  if (!articles.length) return null
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Curated coverage</h2>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Editor picks</p>
      </div>
      <div className="mt-4 space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={article.href}
            className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 transition hover:border-slate-600 hover:bg-slate-900"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{article.typeLabel}</p>
              <p className="text-base font-semibold text-white">{article.title}</p>
            </div>
            <span className="text-sm text-slate-400">Read &rarr;</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
