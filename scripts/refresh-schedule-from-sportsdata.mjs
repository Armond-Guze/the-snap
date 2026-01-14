import fs from 'node:fs/promises';
import path from 'node:path';

const API_KEY = process.env.SPORTSDATA_API_KEY;
if (!API_KEY) {
  console.error('SPORTSDATA_API_KEY is not set. Set it in your environment.');
  process.exit(1);
}

const season = Number(process.env.NFL_SEASON || new Date().getFullYear());
const outFile = path.resolve(process.cwd(), 'data', 'nfl-2025-schedule.json');
const baseUrl = 'https://api.sportsdata.io/v3/nfl';

async function fetchWeek(week) {
  const url = `${baseUrl}/scores/json/ScoresByWeek/${season}/${week}`;
  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
    // sportsdata caches per key; add small cache-busting query to avoid stale edge caches
    next: { revalidate: 300 }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Week ${week} request failed ${res.status}: ${body.slice(0,300)}`);
  }
  return res.json();
}

function mapGame(score, week) {
  const date = score.DateTime || score.Date;
  const dateUTC = date ? new Date(date).toISOString() : new Date().toISOString();
  return {
    gameId: String(score.GlobalGameID || score.GameKey || `${season}-${week}-${score.HomeTeam}-${score.AwayTeam}`),
    week,
    dateUTC,
    home: score.HomeTeam,
    away: score.AwayTeam,
    network: score.Channel || undefined,
    venue: score.StadiumDetails?.Name || undefined
  };
}

async function main() {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
  const all = [];
  for (const week of weeks) {
    const scores = await fetchWeek(week);
    if (!Array.isArray(scores) || scores.length === 0) {
      console.warn(`Week ${week}: no games returned`);
      continue;
    }
    const mapped = scores.map(score => mapGame(score, week));
    all.push(...mapped);
    console.log(`Week ${week}: saved ${mapped.length} games`);
  }
  // Sort by week then date for stability
  all.sort((a,b) => a.week === b.week ? a.dateUTC.localeCompare(b.dateUTC) : a.week - b.week);
  await fs.writeFile(outFile, JSON.stringify(all, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${all.length} games to ${outFile} for season ${season}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
