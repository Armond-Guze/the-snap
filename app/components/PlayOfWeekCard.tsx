import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'
import { formatCompactDate } from '@/lib/date-utils'
import type { PlayOfWeek } from '@/types'

type PlayOfWeekCardProps = {
  play: PlayOfWeek
  variant?: 'featured' | 'standard'
  disableLink?: boolean
}

const badgePalette: Record<string, string> = {
  SPEED: 'from-emerald-500/25 to-emerald-400/10 text-emerald-200 border-emerald-500/40',
  POWER: 'from-orange-500/25 to-orange-400/10 text-orange-200 border-orange-500/40',
  IQ: 'from-cyan-500/25 to-cyan-400/10 text-cyan-200 border-cyan-500/40',
  CHAOS: 'from-fuchsia-500/25 to-fuchsia-400/10 text-fuchsia-200 border-fuchsia-500/40',
  SKILL: 'from-indigo-500/25 to-indigo-400/10 text-indigo-200 border-indigo-500/40',
}

const momentumTone: Record<string, { label: string; color: string; arrow: string }> = {
  'Big Swing': { label: 'Big Swing', color: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30', arrow: 'rotate-0' },
  'Momentum Boost': { label: 'Momentum Boost', color: 'bg-sky-500/15 text-sky-200 border-sky-500/30', arrow: '-rotate-12' },
  Neutral: { label: 'Neutral', color: 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30', arrow: 'rotate-0 opacity-70' },
  'Momentum Loss': { label: 'Momentum Loss', color: 'bg-rose-500/15 text-rose-200 border-rose-500/30', arrow: 'rotate-180' },
}

function DifficultyBar({ level }: { level?: number }) {
  const safeLevel = Math.min(Math.max(level || 0, 0), 5)
  return (
    <div className="flex items-center gap-2 text-xs text-gray-300">
      <span className="text-gray-400">Difficulty</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={clsx(
              'h-2 w-6 rounded-sm border border-white/10 transition-colors duration-300',
              n <= safeLevel ? 'bg-amber-400/80 border-amber-300/60 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-white/5'
            )}
          />
        ))}
      </div>
    </div>
  )
}

function MomentumChip({ direction, magnitude }: { direction?: string; magnitude?: number }) {
  if (!direction) return null
  const tone = momentumTone[direction] || momentumTone['Neutral']
  const mag = Math.min(Math.max(magnitude || 1, 1), 3)
  return (
    <div className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide', tone.color)}>
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className={clsx('block h-3 w-3 rotate-45 border-2 border-current transition-transform duration-300', tone.arrow)} />
        <span className="absolute inset-0 rounded-full border border-white/10 opacity-30" />
      </span>
      <span>{tone.label}</span>
      <span className="text-white/70">x{mag}</span>
    </div>
  )
}

function BadgeRow({ badges }: { badges?: string[] }) {
  if (!badges?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const key = badge.toUpperCase()
        const style = badgePalette[key] || 'from-white/10 to-white/5 text-white border-white/10'
        return (
          <span
            key={badge}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
              style
            )}
          >
            {badge}
          </span>
        )
      })}
    </div>
  )
}

function StatPills({ play }: { play: PlayOfWeek }) {
  const stats: Array<{ label: string; value?: string | number }> = [
    { label: 'Quarter', value: play.quarter },
    { label: 'Clock', value: play.clock },
    { label: 'Down', value: play.downDistance },
    { label: 'Yard Line', value: play.yardLine },
    { label: 'Yards', value: typeof play.yardsGained === 'number' ? play.yardsGained : undefined },
    { label: 'EPA Δ', value: typeof play.epaDelta === 'number' ? play.epaDelta : undefined },
    { label: 'Win % Δ', value: typeof play.winProbDelta === 'number' ? `${play.winProbDelta}%` : undefined },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {stats
        .filter((stat) => stat.value !== undefined && stat.value !== '')
        .map((stat) => (
          <span
            key={stat.label}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
          >
            <span className="text-white/60">{stat.label}</span>
            <span className="font-semibold text-white">{stat.value}</span>
          </span>
        ))}
    </div>
  )
}

export default function PlayOfWeekCard({ play, variant = 'standard', disableLink = false }: PlayOfWeekCardProps) {
  const href = !disableLink && play.slug?.current ? `/play-of-the-week/${play.slug.current}` : undefined
  const teams = play.teams?.map((t) => t.title).filter(Boolean)
  const date = formatCompactDate(play.date || undefined)
  const impact = play.impactTags || []
  const showCallout = play.callout && play.callout.trim().length > 0

  const card = (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-black/60 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)]',
        variant === 'featured' ? 'lg:col-span-2' : ''
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className={clsx('relative w-full overflow-hidden rounded-xl bg-black/40', variant === 'featured' ? 'lg:w-1/2' : 'lg:w-[40%]')}>
          {play.coverImage?.asset?.url ? (
            <Image
              src={play.coverImage.asset.url}
              alt={play.coverImage.alt || play.title}
              width={900}
              height={600}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={variant === 'featured'}
            />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-gray-500">
              No cover image
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {play.clipUrl && (
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Watch clip
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
              {play.playType && <span className="rounded-full bg-white/5 px-3 py-1 text-white">{play.playType}</span>}
              {teams?.length ? (
                <span className="rounded-full bg-white/5 px-3 py-1 text-gray-200">{teams.join(' vs ')}</span>
              ) : null}
              <span className="rounded-full bg-white/5 px-3 py-1 text-gray-300">{date}</span>
            </div>
            <DifficultyBar level={play.difficulty} />
          </div>

          <div className="space-y-2">
            <h3 className={clsx('font-extrabold text-white', variant === 'featured' ? 'text-2xl lg:text-3xl' : 'text-xl')}>
              {play.title}
            </h3>
            {play.summary && (
              <p className="text-base text-gray-300 line-clamp-3 lg:line-clamp-4">{play.summary}</p>
            )}
            {showCallout && (
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90">
                “{play.callout?.trim()}”
              </p>
            )}
          </div>

          <BadgeRow badges={play.skillBadges} />
          <MomentumChip direction={play.momentumDirection} magnitude={play.momentumMagnitude} />
          <StatPills play={play} />

          {impact.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {impact.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-200">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {play.clipUrl && (
            <div className="pt-2">
              <a
                href={play.clipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-300 hover:text-emerald-50"
              >
                Watch the play
                <span aria-hidden className="text-base">↗</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
