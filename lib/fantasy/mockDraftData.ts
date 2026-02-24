export type FantasyPosition = 'QB' | 'RB' | 'WR' | 'TE' | 'DST' | 'K'

export type DraftStrategy =
  | 'balanced'
  | 'hero_rb'
  | 'zero_rb'
  | 'elite_qb'
  | 'upside_chaser'

export type ScoringFormat = 'ppr' | 'half_ppr' | 'standard'

export interface FantasyPlayer {
  id: string
  name: string
  team: string
  position: FantasyPosition
  adp: number
  tier: number
  projStd: number
  projHalf: number
  projPpr: number
  upside: number
}

const TEAM_CODES = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
  'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
  'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
]

const TEAM_NAMES: Record<string, string> = {
  ARI: 'Arizona Cardinals',
  ATL: 'Atlanta Falcons',
  BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers',
  CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals',
  CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos',
  DET: 'Detroit Lions',
  GB: 'Green Bay Packers',
  HOU: 'Houston Texans',
  IND: 'Indianapolis Colts',
  JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs',
  LAC: 'Los Angeles Chargers',
  LAR: 'Los Angeles Rams',
  LV: 'Las Vegas Raiders',
  MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings',
  NE: 'New England Patriots',
  NO: 'New Orleans Saints',
  NYG: 'New York Giants',
  NYJ: 'New York Jets',
  PHI: 'Philadelphia Eagles',
  PIT: 'Pittsburgh Steelers',
  SEA: 'Seattle Seahawks',
  SF: 'San Francisco 49ers',
  TB: 'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans',
  WAS: 'Washington Commanders',
}

const QB_NAMES: Array<[string, string]> = [
  ['Josh Allen', 'BUF'],
  ['Lamar Jackson', 'BAL'],
  ['Jalen Hurts', 'PHI'],
  ['Patrick Mahomes', 'KC'],
  ['Joe Burrow', 'CIN'],
  ['Jayden Daniels', 'WAS'],
  ['C.J. Stroud', 'HOU'],
  ['Dak Prescott', 'DAL'],
  ['Justin Herbert', 'LAC'],
  ['Kyler Murray', 'ARI'],
  ['Trevor Lawrence', 'JAX'],
  ['Jordan Love', 'GB'],
  ['Brock Purdy', 'SF'],
  ['Caleb Williams', 'CHI'],
  ['Drake Maye', 'NE'],
  ['Bo Nix', 'DEN'],
  ['Tua Tagovailoa', 'MIA'],
  ['J.J. McCarthy', 'MIN'],
  ['Baker Mayfield', 'TB'],
  ['Anthony Richardson', 'IND'],
  ['Geno Smith', 'SEA'],
  ['Cam Ward', 'TEN'],
  ['Jaxson Dart', 'NYG'],
  ['Daniel Jones', 'IND'],
]

const RB_NAMES: Array<[string, string]> = [
  ['Bijan Robinson', 'ATL'],
  ['Christian McCaffrey', 'SF'],
  ['Breece Hall', 'NYJ'],
  ['Saquon Barkley', 'PHI'],
  ['Jahmyr Gibbs', 'DET'],
  ['Jonathan Taylor', 'IND'],
  ['DeVon Achane', 'MIA'],
  ['Kyren Williams', 'LAR'],
  ['Josh Jacobs', 'GB'],
  ['Kenneth Walker III', 'SEA'],
  ['Isiah Pacheco', 'KC'],
  ['James Cook', 'BUF'],
  ['Alvin Kamara', 'NO'],
  ['Joe Mixon', 'HOU'],
  ['Derrick Henry', 'BAL'],
  ['Rachaad White', 'TB'],
  ['J.K. Dobbins', 'DEN'],
  ['Tony Pollard', 'TEN'],
  ['DAndre Swift', 'CHI'],
  ['Najee Harris', 'PIT'],
  ['Travis Etienne Jr.', 'JAX'],
  ['Jerome Ford', 'CLE'],
  ['Brian Robinson Jr.', 'WAS'],
  ['Zach Charbonnet', 'SEA'],
  ['Tyjae Spears', 'TEN'],
  ['Rico Dowdle', 'DAL'],
  ['Trey Benson', 'ARI'],
  ['Tyler Allgeier', 'ATL'],
]

const WR_NAMES: Array<[string, string]> = [
  ['Justin Jefferson', 'MIN'],
  ['CeeDee Lamb', 'DAL'],
  ['JaMarr Chase', 'CIN'],
  ['Amon-Ra St. Brown', 'DET'],
  ['Tyreek Hill', 'MIA'],
  ['A.J. Brown', 'PHI'],
  ['Puka Nacua', 'LAR'],
  ['Garrett Wilson', 'NYJ'],
  ['Drake London', 'ATL'],
  ['Nico Collins', 'HOU'],
  ['Marvin Harrison Jr.', 'ARI'],
  ['Brandon Aiyuk', 'SF'],
  ['DJ Moore', 'CHI'],
  ['DK Metcalf', 'SEA'],
  ['DeVonta Smith', 'PHI'],
  ['Rashee Rice', 'KC'],
  ['Chris Olave', 'NO'],
  ['Jaylen Waddle', 'MIA'],
  ['Zay Flowers', 'BAL'],
  ['Terry McLaurin', 'WAS'],
  ['George Pickens', 'PIT'],
  ['Rome Odunze', 'CHI'],
  ['Tank Dell', 'HOU'],
  ['Xavier Worthy', 'KC'],
  ['Keenan Allen', 'CHI'],
  ['Courtland Sutton', 'DEN'],
  ['Jaxon Smith-Njigba', 'SEA'],
  ['Rashid Shaheed', 'NO'],
  ['Jordan Addison', 'MIN'],
  ['Calvin Ridley', 'TEN'],
  ['Malik Nabers', 'NYG'],
  ['Ladd McConkey', 'LAC'],
  ['Jerry Jeudy', 'CLE'],
  ['Christian Kirk', 'JAX'],
  ['DeAndre Hopkins', 'TEN'],
  ['Mike Evans', 'TB'],
  ['Chris Godwin', 'TB'],
  ['Jameson Williams', 'DET'],
  ['Amari Cooper', 'BUF'],
  ['Stefon Diggs', 'HOU'],
]

const TE_NAMES: Array<[string, string]> = [
  ['Sam LaPorta', 'DET'],
  ['Travis Kelce', 'KC'],
  ['Trey McBride', 'ARI'],
  ['George Kittle', 'SF'],
  ['Mark Andrews', 'BAL'],
  ['Dalton Kincaid', 'BUF'],
  ['Jake Ferguson', 'DAL'],
  ['Evan Engram', 'JAX'],
  ['Dallas Goedert', 'PHI'],
  ['T.J. Hockenson', 'MIN'],
  ['Kyle Pitts', 'ATL'],
  ['David Njoku', 'CLE'],
  ['Cole Kmet', 'CHI'],
  ['Pat Freiermuth', 'PIT'],
  ['Tyler Higbee', 'LAR'],
  ['Chigoziem Okonkwo', 'TEN'],
]

const DST_CODES = [
  'SF', 'BAL', 'BUF', 'DAL', 'KC', 'NYJ', 'PIT', 'CLE',
  'PHI', 'MIA', 'DET', 'HOU', 'SEA', 'DEN', 'LAR', 'MIN',
]

const KICKER_NAMES: Array<[string, string]> = [
  ['Justin Tucker', 'BAL'],
  ['Brandon Aubrey', 'DAL'],
  ['Harrison Butker', 'KC'],
  ['Jake Elliott', 'PHI'],
  ['Tyler Bass', 'BUF'],
  ['Younghoe Koo', 'ATL'],
  ['Cameron Dicker', 'LAC'],
  ['Jason Sanders', 'MIA'],
  ['Chase McLaughlin', 'TB'],
  ['Evan McPherson', 'CIN'],
  ['Kaimi Fairbairn', 'HOU'],
  ['Greg Zuerlein', 'NYJ'],
]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function tierByIndex(index: number): number {
  if (index < 6) return 1
  if (index < 14) return 2
  if (index < 24) return 3
  if (index < 38) return 4
  return 5
}

function buildSkillPlayers(
  list: Array<[string, string]>,
  position: 'QB' | 'RB' | 'WR' | 'TE',
  adpStart: number,
  adpStep: number,
  stdStart: number,
  stdDrop: number,
  halfStart: number,
  halfDrop: number,
  pprStart: number,
  pprDrop: number
): FantasyPlayer[] {
  return list.map(([name, team], index) => ({
    id: `${slugify(name)}-${team}-${position}`,
    name,
    team,
    position,
    adp: Math.round((adpStart + index * adpStep) * 10) / 10,
    tier: tierByIndex(index),
    projStd: Math.max(95, Math.round((stdStart - index * stdDrop) * 10) / 10),
    projHalf: Math.max(110, Math.round((halfStart - index * halfDrop) * 10) / 10),
    projPpr: Math.max(120, Math.round((pprStart - index * pprDrop) * 10) / 10),
    upside: Math.max(0.2, Math.min(0.95, 0.86 - index * 0.015)),
  }))
}

function buildDstPlayers(): FantasyPlayer[] {
  return DST_CODES.map((team, index) => {
    const teamName = TEAM_NAMES[team] || team
    return {
      id: `${team.toLowerCase()}-dst`,
      name: `${teamName} D/ST`,
      team,
      position: 'DST',
      adp: 145 + index * 2.2,
      tier: tierByIndex(index + 16),
      projStd: Math.round((120 - index * 2.1) * 10) / 10,
      projHalf: Math.round((120 - index * 2.1) * 10) / 10,
      projPpr: Math.round((120 - index * 2.1) * 10) / 10,
      upside: Math.max(0.2, 0.58 - index * 0.015),
    }
  })
}

function buildKickers(): FantasyPlayer[] {
  return KICKER_NAMES.map(([name, team], index) => ({
    id: `${slugify(name)}-${team}-k`,
    name,
    team,
    position: 'K',
    adp: 165 + index * 2.4,
    tier: tierByIndex(index + 18),
    projStd: Math.round((132 - index * 1.8) * 10) / 10,
    projHalf: Math.round((132 - index * 1.8) * 10) / 10,
    projPpr: Math.round((132 - index * 1.8) * 10) / 10,
    upside: Math.max(0.15, 0.52 - index * 0.018),
  }))
}

function fillDepth(
  players: FantasyPlayer[],
  position: FantasyPosition,
  targetCount: number,
  startAdp: number,
  adpStep: number,
  stdStart: number,
  halfStart: number,
  pprStart: number
) {
  let count = players.filter((player) => player.position === position).length
  let created = 1
  while (count < targetCount) {
    const team = TEAM_CODES[(count + created) % TEAM_CODES.length]
    const nameBase =
      position === 'DST'
        ? `${TEAM_NAMES[team] || team} D/ST Depth ${created}`
        : `${team} ${position} Depth ${created}`
    const suffix = `${position.toLowerCase()}-depth-${team}-${created}`
    const projPenalty = count - targetCount / 2
    players.push({
      id: suffix,
      name: nameBase,
      team,
      position,
      adp: Math.round((startAdp + count * adpStep) * 10) / 10,
      tier: 5,
      projStd: Math.max(50, Math.round((stdStart - projPenalty * 0.85) * 10) / 10),
      projHalf: Math.max(58, Math.round((halfStart - projPenalty * 0.85) * 10) / 10),
      projPpr: Math.max(64, Math.round((pprStart - projPenalty * 0.85) * 10) / 10),
      upside: Math.max(0.1, 0.4 - count * 0.004),
    })
    count += 1
    created += 1
  }
}

export function buildFantasyPlayerPool(): FantasyPlayer[] {
  const pool: FantasyPlayer[] = [
    ...buildSkillPlayers(QB_NAMES, 'QB', 24, 4.8, 305, 4.1, 308, 4.1, 312, 4.1),
    ...buildSkillPlayers(RB_NAMES, 'RB', 1, 3.1, 242, 3.2, 258, 3.1, 272, 2.9),
    ...buildSkillPlayers(WR_NAMES, 'WR', 2, 2.9, 212, 2.7, 248, 2.9, 286, 3.1),
    ...buildSkillPlayers(TE_NAMES, 'TE', 28, 5.9, 145, 2.7, 166, 2.9, 183, 3.1),
    ...buildDstPlayers(),
    ...buildKickers(),
  ]

  fillDepth(pool, 'QB', 36, 170, 2.2, 170, 170, 170)
  fillDepth(pool, 'RB', 92, 115, 1.65, 132, 145, 158)
  fillDepth(pool, 'WR', 102, 105, 1.55, 125, 142, 165)
  fillDepth(pool, 'TE', 36, 175, 2.1, 105, 112, 120)
  fillDepth(pool, 'DST', 20, 172, 1.7, 98, 98, 98)
  fillDepth(pool, 'K', 20, 185, 1.8, 103, 103, 103)

  const seen = new Set<string>()
  const deduped = pool.filter((player) => {
    if (seen.has(player.id)) return false
    seen.add(player.id)
    return true
  })

  return deduped.sort((a, b) => a.adp - b.adp)
}
