// Robust team code resolver for gradients and styling
// Accepts a wide range of inputs: full names, common nicknames, and city-only variants

const OFFICIAL_NAME_TO_CODE: Record<string, string> = {
  'arizona cardinals': 'ARI',
  'atlanta falcons': 'ATL',
  'baltimore ravens': 'BAL',
  'buffalo bills': 'BUF',
  'carolina panthers': 'CAR',
  'chicago bears': 'CHI',
  'cincinnati bengals': 'CIN',
  'cleveland browns': 'CLE',
  'dallas cowboys': 'DAL',
  'denver broncos': 'DEN',
  'detroit lions': 'DET',
  'green bay packers': 'GB',
  'houston texans': 'HOU',
  'indianapolis colts': 'IND',
  'jacksonville jaguars': 'JAX',
  'kansas city chiefs': 'KC',
  'las vegas raiders': 'LV',
  'los angeles chargers': 'LAC',
  'los angeles rams': 'LAR',
  'miami dolphins': 'MIA',
  'minnesota vikings': 'MIN',
  'new england patriots': 'NE',
  'new orleans saints': 'NO',
  'new york giants': 'NYG',
  'new york jets': 'NYJ',
  'philadelphia eagles': 'PHI',
  'pittsburgh steelers': 'PIT',
  'san francisco 49ers': 'SF',
  'seattle seahawks': 'SEA',
  'tampa bay buccaneers': 'TB',
  'tennessee titans': 'TEN',
  'washington commanders': 'WAS',
}

// Common aliases -> code (lowercased keys)
const ALIASES: Record<string, string> = {
  // City-only
  'arizona': 'ARI', 'atlanta': 'ATL', 'baltimore': 'BAL', 'buffalo': 'BUF', 'carolina': 'CAR', 'chicago': 'CHI',
  'cincinnati': 'CIN', 'cleveland': 'CLE', 'dallas': 'DAL', 'denver': 'DEN', 'detroit': 'DET', 'green bay': 'GB',
  'houston': 'HOU', 'indianapolis': 'IND', 'jacksonville': 'JAX', 'kansas city': 'KC', 'vegas': 'LV', 'las vegas': 'LV',
  'la chargers': 'LAC', 'los angeles chargers': 'LAC', 'chargers': 'LAC', 'la rams': 'LAR', 'los angeles rams': 'LAR', 'rams': 'LAR',
  'miami': 'MIA', 'minnesota': 'MIN', 'new england': 'NE', 'new orleans': 'NO', 'giants': 'NYG', 'jets': 'NYJ',
  'philadelphia': 'PHI', 'pittsburgh': 'PIT', 'san francisco': 'SF', '49ers': 'SF', 'niners': 'SF', 'seattle': 'SEA',
  'tampa bay': 'TB', 'buccaneers': 'TB', 'titans': 'TEN', 'washington': 'WAS', 'commanders': 'WAS', 'chiefs': 'KC', 'eagles': 'PHI',
  'bills': 'BUF', 'cowboys': 'DAL', 'packers': 'GB', 'patriots': 'NE', 'saints': 'NO', 'ravens': 'BAL', 'steelers': 'PIT',
  'broncos': 'DEN', 'bears': 'CHI', 'lions': 'DET', 'dolphins': 'MIA', 'vikings': 'MIN', 'browns': 'CLE', 'texans': 'HOU',
  'colts': 'IND', 'jaguars': 'JAX', 'raiders': 'LV', 'seahawks': 'SEA', 'jets team': 'NYJ', 'giants team': 'NYG'
}

// Direct abbreviation pass-through list
const VALID_CODES = new Set(Object.values(OFFICIAL_NAME_TO_CODE))

function clean(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ')
}

export function teamCodeFromName(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null
  const raw = input.trim().toUpperCase()
  if (VALID_CODES.has(raw)) return raw

  const c = clean(input)
  // Exact official name
  if (OFFICIAL_NAME_TO_CODE[c]) return OFFICIAL_NAME_TO_CODE[c]
  // Direct alias
  if (ALIASES[c]) return ALIASES[c]
  // Contains alias token
  for (const key of Object.keys(ALIASES)) {
    if (c.includes(key)) return ALIASES[key]
  }
  return null
}

export function gradientClassForTeam(input: string | null | undefined): string {
  const code = teamCodeFromName(input)
  return code ? `player-gradient-${code}` : 'bg-white/15'
}
