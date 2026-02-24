'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { DraftStrategy, ScoringFormat } from '@/lib/fantasy/mockDraftData'
import type { MockDraftResult, SimPick } from '@/lib/fantasy/mockDraftEngine'

type ApiResponse =
  | { ok: true; result: MockDraftResult }
  | { ok: false; error?: string; errors?: string[] }

const TEAM_OPTIONS = [10, 12, 14]
const ROUND_OPTIONS = [12, 15, 18]

const STRATEGY_OPTIONS: Array<{ value: DraftStrategy; label: string; description: string }> = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Best player available with clean roster construction.',
  },
  {
    value: 'hero_rb',
    label: 'Hero RB',
    description: 'Prioritize one anchor RB early, then load WR/TE value.',
  },
  {
    value: 'zero_rb',
    label: 'Zero RB',
    description: 'Hammer WR/TE early, hunt RB upside in middle rounds.',
  },
  {
    value: 'elite_qb',
    label: 'Elite QB',
    description: 'Push for top QB tier in the early-middle rounds.',
  },
  {
    value: 'upside_chaser',
    label: 'Upside Chaser',
    description: 'Target ceiling and breakout profiles at each turn.',
  },
]

const SCORING_OPTIONS: Array<{ value: ScoringFormat; label: string }> = [
  { value: 'ppr', label: 'PPR' },
  { value: 'half_ppr', label: 'Half-PPR' },
  { value: 'standard', label: 'Standard' },
]

function adpDiffClass(diff: number): string {
  if (diff >= 8) return 'text-emerald-300'
  if (diff >= 2) return 'text-emerald-200'
  if (diff <= -8) return 'text-rose-300'
  if (diff <= -2) return 'text-rose-200'
  return 'text-white/80'
}

function adpDiffLabel(diff: number): string {
  if (diff > 0) return `+${diff.toFixed(1)}`
  return diff.toFixed(1)
}

function PickList({ picks }: { picks: SimPick[] }) {
  if (picks.length === 0) {
    return <p className="text-sm text-white/60">No picks to show yet.</p>
  }

  return (
    <div className="space-y-2">
      {picks.map((pick) => (
        <div
          key={`${pick.overallPick}-${pick.playerName}-${pick.teamSlot}`}
          className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              #{pick.overallPick} ({pick.position}) {pick.playerName}
            </p>
            <p className={`text-xs font-semibold ${adpDiffClass(pick.adpDiff)}`}>
              ADP delta {adpDiffLabel(pick.adpDiff)}
            </p>
          </div>
          <p className="mt-1 text-xs text-white/70">
            Team {pick.teamSlot} • {pick.playerTeam} • Proj {pick.projection.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-white/55">{pick.reason}</p>
        </div>
      ))}
    </div>
  )
}

export default function SimulatorClient() {
  const [teams, setTeams] = useState<number>(12)
  const [rounds, setRounds] = useState<number>(15)
  const [draftSlot, setDraftSlot] = useState<number>(6)
  const [scoring, setScoring] = useState<ScoringFormat>('half_ppr')
  const [strategy, setStrategy] = useState<DraftStrategy>('balanced')
  const [seed, setSeed] = useState<number>(() => Date.now())

  const [result, setResult] = useState<MockDraftResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const slotOptions = useMemo(
    () => Array.from({ length: teams }, (_, index) => index + 1),
    [teams]
  )

  useEffect(() => {
    if (draftSlot > teams) {
      setDraftSlot(teams)
    }
  }, [teams, draftSlot])

  async function runSimulation(event?: FormEvent<HTMLFormElement>, seedOverride?: number) {
    event?.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/fantasy/mock-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teams,
          rounds,
          draftSlot,
          scoring,
          strategy,
          seed: seedOverride ?? seed,
        }),
      })

      const payload = (await response.json()) as ApiResponse

      if (!response.ok || !payload.ok) {
        const details = !payload.ok ? payload.errors?.join(' ') || payload.error : 'Simulation failed.'
        throw new Error(details || 'Simulation failed.')
      }

      setResult(payload.result)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to run simulator right now.'
      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runSimulation()
    // run one default simulation on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[hsl(0_0%_3.9%)] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Fantasy Tools</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Fantasy Mock Draft Simulator</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            Set your slot and league format, draft against simulated bot teams, and get instant grades,
            top values, reaches, and steal reports.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <form onSubmit={runSimulation} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-white/60">Teams</span>
              <select
                value={teams}
                onChange={(event) => setTeams(Number(event.target.value))}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none ring-cyan-300/60 transition focus:ring-2"
              >
                {TEAM_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} Teams
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-white/60">Rounds</span>
              <select
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value))}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none ring-cyan-300/60 transition focus:ring-2"
              >
                {ROUND_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} Rounds
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-white/60">Draft Slot</span>
              <select
                value={draftSlot}
                onChange={(event) => setDraftSlot(Number(event.target.value))}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none ring-cyan-300/60 transition focus:ring-2"
              >
                {slotOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-white/60">Scoring</span>
              <select
                value={scoring}
                onChange={(event) => setScoring(event.target.value as ScoringFormat)}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none ring-cyan-300/60 transition focus:ring-2"
              >
                {SCORING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2 xl:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-white/60">Strategy</span>
              <select
                value={strategy}
                onChange={(event) => setStrategy(event.target.value as DraftStrategy)}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm outline-none ring-cyan-300/60 transition focus:ring-2"
              >
                {STRATEGY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Running...' : 'Run Simulation'}
            </button>

            <button
              type="button"
              onClick={() => {
                const nextSeed = Date.now()
                setSeed(nextSeed)
                void runSimulation(undefined, nextSeed)
              }}
              className="rounded-lg border border-white/20 bg-white/[0.04] px-4 py-2 text-sm text-white/85 transition hover:bg-white/[0.08]"
            >
              New Random Board
            </button>

            <p className="text-xs text-white/55">Seed: {seed}</p>
          </div>

          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </form>

        {result && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">Draft Grade</p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-5xl font-black text-cyan-300">{result.grade.letter}</p>
                  <p className="pb-1 text-sm text-white/70">Score {result.grade.score}/99</p>
                </div>
                <p className="mt-3 text-sm text-white/80">{result.grade.summary}</p>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {Object.entries(result.userRoster).map(([position, count]) => (
                    <div key={position} className="rounded-lg border border-white/10 bg-black/35 p-2 text-center">
                      <p className="text-[11px] text-white/60">{position}</p>
                      <p className="text-lg font-semibold text-white">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">Best Picks</p>
                <div className="mt-3">
                  <PickList picks={result.bestPicks} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">Your Reaches</p>
                <div className="mt-3">
                  <PickList picks={result.userReaches} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
                <p className="text-xs uppercase tracking-[0.14em] text-white/60">League Steals</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {result.leagueSteals.map((pick) => (
                    <div
                      key={`steal-${pick.overallPick}-${pick.playerName}`}
                      className="rounded-lg border border-white/10 bg-black/35 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          #{pick.overallPick} {pick.playerName}
                        </p>
                        <p className={`text-xs font-semibold ${adpDiffClass(pick.adpDiff)}`}>
                          {adpDiffLabel(pick.adpDiff)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-white/65">
                        Team {pick.teamSlot} • {pick.position} • {pick.playerTeam}
                        {pick.isUser ? ' • You' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Your Full Draft</p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.1em] text-white/50">
                      <th className="px-3 py-1">Pick</th>
                      <th className="px-3 py-1">Round</th>
                      <th className="px-3 py-1">Player</th>
                      <th className="px-3 py-1">Pos</th>
                      <th className="px-3 py-1">Proj</th>
                      <th className="px-3 py-1">ADP Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.userPicks.map((pick) => (
                      <tr key={`${pick.overallPick}-${pick.playerName}`} className="rounded-lg bg-black/35">
                        <td className="px-3 py-2 text-white/80">#{pick.overallPick}</td>
                        <td className="px-3 py-2 text-white/80">{pick.round}.{pick.pickInRound}</td>
                        <td className="px-3 py-2 font-semibold text-white">{pick.playerName}</td>
                        <td className="px-3 py-2 text-white/80">{pick.position}</td>
                        <td className="px-3 py-2 text-white/80">{pick.projection.toFixed(1)}</td>
                        <td className={`px-3 py-2 font-semibold ${adpDiffClass(pick.adpDiff)}`}>
                          {adpDiffLabel(pick.adpDiff)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
