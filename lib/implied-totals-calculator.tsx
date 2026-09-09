'use client'

import { useId, useMemo, useState } from 'react'

export type ImpliedTotalsResult = {
  favorite: number
  underdog: number
}

const roundToHundredth = (value: number) => Math.round(value * 100) / 100

export function calculateImpliedTotals(
  gameTotal: number,
  favoriteSpread: number,
): ImpliedTotalsResult | null {
  if (!Number.isFinite(gameTotal) || !Number.isFinite(favoriteSpread)) return null

  const absoluteSpread = Math.abs(favoriteSpread)
  if (gameTotal <= 0 || absoluteSpread > gameTotal) return null

  return {
    favorite: roundToHundredth((gameTotal + absoluteSpread) / 2),
    underdog: roundToHundredth((gameTotal - absoluteSpread) / 2),
  }
}

const formatPoints = (value: number) => {
  const formatted = value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  return `${formatted} points`
}

export default function ImpliedTotalsCalculator() {
  const headingId = useId()
  const descriptionId = useId()
  const [gameTotal, setGameTotal] = useState('47.5')
  const [favoriteSpread, setFavoriteSpread] = useState('3.5')

  const result = useMemo(
    () => calculateImpliedTotals(Number(gameTotal), Number(favoriteSpread)),
    [favoriteSpread, gameTotal],
  )

  return (
    <section
      aria-labelledby={headingId}
      className="my-8 rounded-2xl border border-white/15 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-5 shadow-xl sm:p-7"
    >
      <h2 id={headingId} className="text-2xl font-bold tracking-tight text-white">
        Implied team total calculator
      </h2>
      <p id={descriptionId} className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">
        Enter the current game total and the favorite&apos;s spread. You may enter the spread as
        either a positive or negative number; the calculation uses its absolute value.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-gray-100">
          Game total
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={gameTotal}
            onChange={(event) => setGameTotal(event.currentTarget.value)}
            aria-describedby={descriptionId}
            className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-base text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-gray-100">
          Favorite spread
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={favoriteSpread}
            onChange={(event) => setFavoriteSpread(event.currentTarget.value)}
            aria-describedby={descriptionId}
            className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-base text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
          />
        </label>
      </div>

      <div className="mt-5" aria-live="polite" aria-atomic="true">
        {result ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <dt className="text-sm font-medium text-gray-300">Favorite implied total</dt>
              <dd className="mt-1 text-2xl font-black text-white">{formatPoints(result.favorite)}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <dt className="text-sm font-medium text-gray-300">Underdog implied total</dt>
              <dd className="mt-1 text-2xl font-black text-white">{formatPoints(result.underdog)}</dd>
            </div>
          </dl>
        ) : (
          <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-100">
            Enter a game total above zero and a spread whose absolute value does not exceed the
            total.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-gray-400">
        This is a derived calculation, not a posted sportsbook team-total line. Use the spread and
        total from the same book and timestamp.
      </p>
    </section>
  )
}
