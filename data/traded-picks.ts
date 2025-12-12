export interface TradedPick {
  originalTeam: string; // team abbr owning the pick initially
  toTeam: string; // team abbr now owning the pick
  round: number;
  note?: string;
}

// Keep this list small and season-specific; update as trades happen.
// Examples include well-known pick swaps. Add conditions in `note` if partial.
export const tradedPicks: TradedPick[] = [
  { originalTeam: 'CAR', toTeam: 'CHI', round: 1, note: 'From 2024 trade package' },
  { originalTeam: 'CLE', toTeam: 'HOU', round: 1, note: 'From Watson trade' },
];
