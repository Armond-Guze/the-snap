import {
  buildFantasyPlayerPool,
  type DraftStrategy,
  type FantasyPlayer,
  type FantasyPosition,
  type ScoringFormat,
} from '@/lib/fantasy/mockDraftData'

const ALLOWED_TEAMS = [10, 12, 14] as const
const ALLOWED_ROUNDS = [12, 15, 18] as const
const STRATEGIES: DraftStrategy[] = [
  'balanced',
  'hero_rb',
  'zero_rb',
  'elite_qb',
  'upside_chaser',
]

const POSITION_ORDER: FantasyPosition[] = ['QB', 'RB', 'WR', 'TE', 'DST', 'K']

type RosterMap = Record<FantasyPosition, number>

export interface MockDraftSettings {
  teams: number
  rounds: number
  draftSlot: number
  scoring: ScoringFormat
  strategy: DraftStrategy
  seed?: number | string
}

export interface NormalizedMockDraftSettings {
  teams: (typeof ALLOWED_TEAMS)[number]
  rounds: (typeof ALLOWED_ROUNDS)[number]
  draftSlot: number
  scoring: ScoringFormat
  strategy: DraftStrategy
  seed: number
}

export interface SimPick {
  overallPick: number
  round: number
  pickInRound: number
  teamSlot: number
  isUser: boolean
  playerName: string
  playerTeam: string
  position: FantasyPosition
  adp: number
  adpDiff: number
  projection: number
  reason: string
}

export interface DraftGrade {
  letter: string
  score: number
  summary: string
}

export interface MockDraftResult {
  settings: NormalizedMockDraftSettings
  grade: DraftGrade
  userRoster: RosterMap
  userPicks: SimPick[]
  bestPicks: SimPick[]
  userReaches: SimPick[]
  leagueSteals: SimPick[]
}

interface TeamDraftState {
  teamSlot: number
  strategy: DraftStrategy
  roster: FantasyPlayer[]
  counts: RosterMap
  picks: SimPick[]
}

interface TeamEvaluation {
  teamSlot: number
  starterProjection: number
  valueIndex: number
  balanceIndex: number
  upsideIndex: number
}

function createEmptyRoster(): RosterMap {
  return { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0, K: 0 }
}

function getRosterTargets(rounds: number): RosterMap {
  if (rounds <= 12) {
    return { QB: 1, RB: 4, WR: 4, TE: 2, DST: 1, K: 0 }
  }

  if (rounds <= 15) {
    return { QB: 1, RB: 5, WR: 5, TE: 2, DST: 1, K: 1 }
  }

  return { QB: 2, RB: 6, WR: 6, TE: 2, DST: 1, K: 1 }
}

function projectionFor(player: FantasyPlayer, scoring: ScoringFormat): number {
  if (scoring === 'ppr') return player.projPpr
  if (scoring === 'half_ppr') return player.projHalf
  return player.projStd
}

function hashSeed(seed: string | number): number {
  const input = String(seed)
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function createRng(seed: number): () => number {
  let state = seed || 1
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeScoring(input: string | undefined): ScoringFormat {
  if (input === 'ppr' || input === 'half_ppr' || input === 'standard') return input
  return 'half_ppr'
}

function normalizeStrategy(input: string | undefined): DraftStrategy {
  if (input && STRATEGIES.includes(input as DraftStrategy)) return input as DraftStrategy
  return 'balanced'
}

function normalizeTeams(input: number | undefined): (typeof ALLOWED_TEAMS)[number] {
  if (input && ALLOWED_TEAMS.includes(input as (typeof ALLOWED_TEAMS)[number])) {
    return input as (typeof ALLOWED_TEAMS)[number]
  }
  return 12
}

function normalizeRounds(input: number | undefined): (typeof ALLOWED_ROUNDS)[number] {
  if (input && ALLOWED_ROUNDS.includes(input as (typeof ALLOWED_ROUNDS)[number])) {
    return input as (typeof ALLOWED_ROUNDS)[number]
  }
  return 15
}

export function normalizeMockDraftSettings(
  input: Partial<MockDraftSettings> | null | undefined
): NormalizedMockDraftSettings {
  const teams = normalizeTeams(typeof input?.teams === 'number' ? input.teams : undefined)
  const rounds = normalizeRounds(typeof input?.rounds === 'number' ? input.rounds : undefined)

  const rawDraftSlot = typeof input?.draftSlot === 'number' ? Math.floor(input.draftSlot) : Math.ceil(teams / 2)
  const draftSlot = clamp(rawDraftSlot, 1, teams)

  const scoring = normalizeScoring(typeof input?.scoring === 'string' ? input.scoring : undefined)
  const strategy = normalizeStrategy(typeof input?.strategy === 'string' ? input.strategy : undefined)

  const rawSeed = input?.seed ?? Date.now()
  const seed = typeof rawSeed === 'number' && Number.isFinite(rawSeed) ? Math.floor(rawSeed) : hashSeed(String(rawSeed))

  return {
    teams,
    rounds,
    draftSlot,
    scoring,
    strategy,
    seed,
  }
}

function pickReason(adpDiff: number, needScore: number, strategyScore: number): string {
  if (adpDiff >= 14) return 'Big value fall versus ADP'
  if (adpDiff >= 7) return 'Good value at current slot'
  if (needScore >= 0.95) return 'Addresses a major roster need'
  if (needScore >= 0.6) return 'Fills depth at a priority position'
  if (strategyScore >= 0.45) return 'Fits your strategy profile'
  if (adpDiff <= -10) return 'Aggressive upside reach'
  return 'Best balance of projection and roster fit'
}

function strategyModifier(
  strategy: DraftStrategy,
  position: FantasyPosition,
  round: number,
  adpDiff: number,
  upside: number
): number {
  if (strategy === 'hero_rb') {
    if (round <= 4 && position === 'RB') return 0.85
    if (round >= 7 && position === 'RB') return -0.2
  }

  if (strategy === 'zero_rb') {
    if (round <= 5 && position === 'RB') return -1.05
    if (round >= 6 && position === 'RB') return 0.55
    if (round <= 4 && (position === 'WR' || position === 'TE')) return 0.25
  }

  if (strategy === 'elite_qb') {
    if (round >= 2 && round <= 6 && position === 'QB') return 0.9
    if (round <= 3 && position === 'TE') return 0.2
  }

  if (strategy === 'upside_chaser') {
    return upside * 0.9 + (adpDiff < 0 ? 0.15 : 0)
  }

  return 0
}

function positionEarliestRound(position: FantasyPosition): number {
  if (position === 'DST') return 11
  if (position === 'K') return 13
  return 1
}

function positionHardCap(position: FantasyPosition, targets: RosterMap): number {
  const target = targets[position]
  if (target <= 0) return 0
  if (position === 'RB' || position === 'WR') return target + 2
  return target + 1
}

function buildPositionCeilings(players: FantasyPlayer[], scoring: ScoringFormat): Record<FantasyPosition, number> {
  const ceilings: Record<FantasyPosition, number> = {
    QB: 1,
    RB: 1,
    WR: 1,
    TE: 1,
    DST: 1,
    K: 1,
  }

  for (const player of players) {
    const projection = projectionFor(player, scoring)
    if (projection > ceilings[player.position]) {
      ceilings[player.position] = projection
    }
  }

  return ceilings
}

function choosePlayerIndex(
  available: FantasyPlayer[],
  team: TeamDraftState,
  settings: NormalizedMockDraftSettings,
  rosterTargets: RosterMap,
  positionCeilings: Record<FantasyPosition, number>,
  round: number,
  overallPick: number,
  rng: () => number
): number {
  let bestIndex = -1
  let bestScore = Number.NEGATIVE_INFINITY

  for (let index = 0; index < available.length; index += 1) {
    const player = available[index]
    const position = player.position

    if (round < positionEarliestRound(position)) {
      continue
    }

    const cap = positionHardCap(position, rosterTargets)
    if (cap === 0 || team.counts[position] >= cap) {
      continue
    }

    const projection = projectionFor(player, settings.scoring)
    const projectionScore = projection / positionCeilings[position]

    const target = rosterTargets[position]
    const current = team.counts[position]
    const needGap = Math.max(0, target - current)
    const needScore = target === 0 ? 0 : needGap / target

    const adpDiff = overallPick - player.adp
    const valueScore = clamp(adpDiff / 18, -2, 2)

    const reachPenalty = overallPick + 8 < player.adp ? 1.2 : 0
    const overflowPenalty = current > target ? 0.55 * (current - target + 1) : 0

    const strategyScore = strategyModifier(team.strategy, position, round, adpDiff, player.upside)
    const upsideScore = player.upside * (team.strategy === 'upside_chaser' ? 0.65 : 0.28)
    const tierScore = (6 - player.tier) * 0.09
    const randomness = (rng() - 0.5) * 0.22

    const score =
      projectionScore * 2.15 +
      needScore * 1.65 +
      valueScore * 1.05 +
      strategyScore +
      upsideScore +
      tierScore -
      reachPenalty -
      overflowPenalty +
      randomness

    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  return bestIndex
}

function buildTeamStates(settings: NormalizedMockDraftSettings, rng: () => number): TeamDraftState[] {
  const states: TeamDraftState[] = []

  for (let slot = 1; slot <= settings.teams; slot += 1) {
    const isUser = slot === settings.draftSlot
    const randomStrategy = STRATEGIES[Math.floor(rng() * STRATEGIES.length)] || 'balanced'

    states.push({
      teamSlot: slot,
      strategy: isUser ? settings.strategy : randomStrategy,
      roster: [],
      counts: createEmptyRoster(),
      picks: [],
    })
  }

  return states
}

function pickOrderForRound(teams: number, round: number): number[] {
  if (round % 2 === 1) {
    return Array.from({ length: teams }, (_, index) => index + 1)
  }
  return Array.from({ length: teams }, (_, index) => teams - index)
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function starterProjection(roster: FantasyPlayer[], scoring: ScoringFormat): number {
  const byPosition: Record<FantasyPosition, FantasyPlayer[]> = {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    DST: [],
    K: [],
  }

  for (const player of roster) {
    byPosition[player.position].push(player)
  }

  for (const position of POSITION_ORDER) {
    byPosition[position].sort(
      (left, right) => projectionFor(right, scoring) - projectionFor(left, scoring)
    )
  }

  const starters: FantasyPlayer[] = []
  starters.push(...byPosition.QB.slice(0, 1))
  starters.push(...byPosition.RB.slice(0, 2))
  starters.push(...byPosition.WR.slice(0, 2))
  starters.push(...byPosition.TE.slice(0, 1))

  const flexPool = [...byPosition.RB.slice(2), ...byPosition.WR.slice(2), ...byPosition.TE.slice(1)]
  flexPool.sort((left, right) => projectionFor(right, scoring) - projectionFor(left, scoring))
  starters.push(...flexPool.slice(0, 1))

  if (byPosition.DST.length > 0) starters.push(byPosition.DST[0])
  if (byPosition.K.length > 0) starters.push(byPosition.K[0])

  return Number(starters.reduce((sum, player) => sum + projectionFor(player, scoring), 0).toFixed(2))
}

function percentile(value: number, population: number[]): number {
  if (population.length <= 1) return 1
  const sorted = [...population].sort((a, b) => a - b)
  const index = sorted.findIndex((entry) => value <= entry)
  if (index === -1) return 1
  return index / (sorted.length - 1)
}

function evaluateTeam(
  team: TeamDraftState,
  rosterTargets: RosterMap,
  scoring: ScoringFormat
): TeamEvaluation {
  const starterScore = starterProjection(team.roster, scoring)
  const valueIndex = average(team.picks.map((pick) => pick.adpDiff))

  const balanceErrors = POSITION_ORDER.map((position) => {
    const target = rosterTargets[position]
    if (target === 0) return 0
    return Math.abs(team.counts[position] - target) / target
  })

  const balanceIndex = clamp(1 - average(balanceErrors), 0, 1)
  const upsideIndex = average(team.roster.map((player) => player.upside))

  return {
    teamSlot: team.teamSlot,
    starterProjection: starterScore,
    valueIndex: Number(valueIndex.toFixed(2)),
    balanceIndex: Number(balanceIndex.toFixed(2)),
    upsideIndex: Number(upsideIndex.toFixed(2)),
  }
}

function letterGrade(score: number): string {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 67) return 'D+'
  if (score >= 63) return 'D'
  return 'D-'
}

function buildGradeSummary(
  score: number,
  starterPct: number,
  valuePct: number,
  balancePct: number,
  upsidePct: number
): string {
  const strengths: string[] = []

  if (starterPct >= 0.65) strengths.push('strong weekly starter core')
  if (valuePct >= 0.6) strengths.push('value-driven picks')
  if (balancePct >= 0.7) strengths.push('clean roster construction')
  if (upsidePct >= 0.7) strengths.push('high-upside bench profile')

  if (strengths.length === 0) {
    if (score < 75) {
      return 'This draft is playable, but it needs better ADP discipline and positional timing in early rounds.'
    }
    return 'Balanced result with room to improve value timing and late-round upside swings.'
  }

  return `Built on ${strengths.slice(0, 2).join(' and ')}.`
}

function pickView(pick: SimPick): SimPick {
  return {
    overallPick: pick.overallPick,
    round: pick.round,
    pickInRound: pick.pickInRound,
    teamSlot: pick.teamSlot,
    isUser: pick.isUser,
    playerName: pick.playerName,
    playerTeam: pick.playerTeam,
    position: pick.position,
    adp: pick.adp,
    adpDiff: pick.adpDiff,
    projection: pick.projection,
    reason: pick.reason,
  }
}

export function runMockDraft(input: Partial<MockDraftSettings>): MockDraftResult {
  const settings = normalizeMockDraftSettings(input)
  const rng = createRng(hashSeed(settings.seed))
  const rosterTargets = getRosterTargets(settings.rounds)

  const available = buildFantasyPlayerPool()
  const positionCeilings = buildPositionCeilings(available, settings.scoring)
  const teams = buildTeamStates(settings, rng)

  const allPicks: SimPick[] = []

  for (let round = 1; round <= settings.rounds; round += 1) {
    const order = pickOrderForRound(settings.teams, round)

    for (let pickInRound = 1; pickInRound <= order.length; pickInRound += 1) {
      const teamSlot = order[pickInRound - 1]
      const team = teams[teamSlot - 1]
      const overallPick = (round - 1) * settings.teams + pickInRound

      const chosenIndex = choosePlayerIndex(
        available,
        team,
        settings,
        rosterTargets,
        positionCeilings,
        round,
        overallPick,
        rng
      )

      if (chosenIndex < 0) {
        continue
      }

      const [player] = available.splice(chosenIndex, 1)
      const adpDiff = Number((overallPick - player.adp).toFixed(1))

      const target = rosterTargets[player.position]
      const current = team.counts[player.position]
      const needScore = target <= 0 ? 0 : Math.max(0, target - current) / target
      const strategyScore = strategyModifier(
        team.strategy,
        player.position,
        round,
        adpDiff,
        player.upside
      )

      const pick: SimPick = {
        overallPick,
        round,
        pickInRound,
        teamSlot,
        isUser: teamSlot === settings.draftSlot,
        playerName: player.name,
        playerTeam: player.team,
        position: player.position,
        adp: player.adp,
        adpDiff,
        projection: projectionFor(player, settings.scoring),
        reason: pickReason(adpDiff, needScore, strategyScore),
      }

      team.roster.push(player)
      team.counts[player.position] += 1
      team.picks.push(pick)
      allPicks.push(pick)
    }
  }

  const evaluations = teams.map((team) => evaluateTeam(team, rosterTargets, settings.scoring))
  const userTeam = teams.find((team) => team.teamSlot === settings.draftSlot)

  if (!userTeam) {
    throw new Error('Unable to locate user draft slot in simulation result')
  }

  const userEval = evaluations.find((evaluation) => evaluation.teamSlot === userTeam.teamSlot)

  if (!userEval) {
    throw new Error('Unable to evaluate user draft result')
  }

  const starterPct = percentile(
    userEval.starterProjection,
    evaluations.map((evaluation) => evaluation.starterProjection)
  )
  const valuePct = percentile(
    userEval.valueIndex,
    evaluations.map((evaluation) => evaluation.valueIndex)
  )
  const balancePct = percentile(
    userEval.balanceIndex,
    evaluations.map((evaluation) => evaluation.balanceIndex)
  )
  const upsidePct = percentile(
    userEval.upsideIndex,
    evaluations.map((evaluation) => evaluation.upsideIndex)
  )

  const rawScore =
    66 + starterPct * 18 + valuePct * 8 + balancePct * 5 + upsidePct * 3
  const finalScore = Math.round(clamp(rawScore, 58, 99))

  const grade: DraftGrade = {
    letter: letterGrade(finalScore),
    score: finalScore,
    summary: buildGradeSummary(finalScore, starterPct, valuePct, balancePct, upsidePct),
  }

  const userPicks = [...userTeam.picks].sort((left, right) => left.overallPick - right.overallPick)
  const bestPicks = [...userPicks]
    .sort((left, right) => right.adpDiff - left.adpDiff || right.projection - left.projection)
    .slice(0, 4)
    .map(pickView)

  const userReaches = [...userPicks]
    .sort((left, right) => left.adpDiff - right.adpDiff || right.projection - left.projection)
    .slice(0, 3)
    .map(pickView)

  const leagueSteals = [...allPicks]
    .sort((left, right) => right.adpDiff - left.adpDiff)
    .slice(0, 8)
    .map(pickView)

  return {
    settings,
    grade,
    userRoster: userTeam.counts,
    userPicks: userPicks.map(pickView),
    bestPicks,
    userReaches,
    leagueSteals,
  }
}
