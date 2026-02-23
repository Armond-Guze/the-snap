type TeamRefLike = { title?: string } | null | undefined

export type PowerRankingEntryLike = {
  rank?: number
  team?: TeamRefLike
  teamAbbr?: string
  teamName?: string
  summary?: string
  note?: string
  previousRank?: number
  prevRankOverride?: number
  movement?: number
  movementOverride?: number
}

const PLAYOFF_LABELS: Record<string, string> = {
  WC: 'Wild Card',
  DIV: 'Divisional',
  CONF: 'Conference Championship',
  SB: 'Super Bowl',
}

function clampMetaTitle(input: string): string {
  const clean = input.trim().replace(/\s+/g, ' ')
  if (clean.length <= 60) return clean
  const shortened = clean.slice(0, 60)
  const split = shortened.lastIndexOf(' ')
  return `${(split > 30 ? shortened.slice(0, split) : shortened).trim()}…`
}

function clampMetaDescription(input: string): string {
  const clean = input.trim().replace(/\s+/g, ' ')
  if (clean.length <= 160) return clean
  const shortened = clean.slice(0, 160)
  const split = shortened.lastIndexOf(' ')
  return `${(split > 80 ? shortened.slice(0, split) : shortened).trim()}…`
}

function getTeamLabel(item: PowerRankingEntryLike): string {
  return (
    item.teamAbbr ||
    item.teamName ||
    (item.team && typeof item.team.title === 'string' ? item.team.title : undefined) ||
    'TEAM'
  )
}

function getPreviousRank(item: PowerRankingEntryLike): number | null {
  if (typeof item.previousRank === 'number') return item.previousRank
  if (typeof item.prevRankOverride === 'number') return item.prevRankOverride
  return null
}

function getMovement(item: PowerRankingEntryLike): number {
  if (typeof item.movement === 'number') return item.movement
  if (typeof item.movementOverride === 'number') return item.movementOverride
  if (typeof item.rank === 'number') {
    const previous = getPreviousRank(item)
    if (typeof previous === 'number') return previous - item.rank
  }
  return 0
}

export function normalizePowerRankingItems(items: unknown[]): PowerRankingEntryLike[] {
  return items
    .filter((item): item is PowerRankingEntryLike => !!item && typeof item === 'object')
    .map((item) => {
      const previousRank = getPreviousRank(item)
      const movement = getMovement(item)
      return {
        ...item,
        summary: item.summary || item.note || '',
        note: item.note || item.summary || '',
        previousRank: typeof previousRank === 'number' ? previousRank : undefined,
        prevRankOverride: typeof previousRank === 'number' ? previousRank : undefined,
        movement,
        movementOverride: movement,
      }
    })
}

export function deriveBiggestMovers(items: PowerRankingEntryLike[]) {
  const normalized = normalizePowerRankingItems(items)
  if (!normalized.length) return { biggestRiser: '', biggestFaller: '' }

  let riserLabel = ''
  let riserMove = 0
  let fallerLabel = ''
  let fallerMove = 0

  normalized.forEach((item) => {
    const move = getMovement(item)
    if (move > 0 && (!riserLabel || move > riserMove)) {
      riserLabel = getTeamLabel(item)
      riserMove = move
    }
    if (move < 0 && (!fallerLabel || move < fallerMove)) {
      fallerLabel = getTeamLabel(item)
      fallerMove = move
    }
  })

  return {
    biggestRiser: riserLabel ? `${riserLabel} (+${riserMove})` : '',
    biggestFaller: fallerLabel ? `${fallerLabel} (${fallerMove})` : '',
  }
}

export function buildPowerRankingSeoPrefill(input: {
  title?: string
  summary?: string
  seasonYear?: number
  weekNumber?: number
  playoffRound?: string
}) {
  const season = input.seasonYear || new Date().getFullYear()
  const weekLabel =
    typeof input.weekNumber === 'number'
      ? `Week ${input.weekNumber}`
      : input.playoffRound
        ? PLAYOFF_LABELS[input.playoffRound] || input.playoffRound
        : null

  const titleBase = input.title || `NFL Power Rankings ${season}${weekLabel ? ` - ${weekLabel}` : ''}`
  const focusKeyword = weekLabel
    ? `nfl power rankings ${season} ${weekLabel.toLowerCase()}`
    : `nfl power rankings ${season}`

  const metaTitle = clampMetaTitle(`${titleBase} | The Snap`)
  const metaDescription = clampMetaDescription(
    input.summary ||
      `Complete NFL Power Rankings for ${season}${weekLabel ? `, ${weekLabel}` : ''}. See biggest risers, fallers, and team-by-team analysis.`
  )

  return {
    autoGenerate: true,
    metaTitle,
    metaDescription,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    focusKeyword,
    additionalKeywords: [
      `nfl rankings ${season}`,
      weekLabel ? `${weekLabel.toLowerCase()} power rankings` : 'weekly nfl power rankings',
      'the snap nfl rankings',
    ],
    lastGenerated: new Date().toISOString(),
  }
}
