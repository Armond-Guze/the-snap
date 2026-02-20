export const NFL_TEAM_CODES = [
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GB",
  "HOU",
  "IND",
  "JAX",
  "KC",
  "LV",
  "LAC",
  "LAR",
  "MIA",
  "MIN",
  "NE",
  "NO",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SF",
  "SEA",
  "TB",
  "TEN",
  "WAS",
] as const;

const NFL_TEAM_CODE_SET = new Set<string>(NFL_TEAM_CODES);

export type NflTeamCode = (typeof NFL_TEAM_CODES)[number];

export function normalizeTeamCode(value: unknown): NflTeamCode | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  return NFL_TEAM_CODE_SET.has(normalized)
    ? (normalized as NflTeamCode)
    : null;
}
