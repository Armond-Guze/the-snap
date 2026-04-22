import { sportsDataFetch } from './sportsdata-client';

const DEFAULT_NEWS_REVALIDATE_SECONDS = 900;
const DEFAULT_PLAYER_REVALIDATE_SECONDS = 21_600;
const DEFAULT_PLAYER_WATCH_LIMIT = 3;

export interface SportsDataNewsNote {
  NewsID: number;
  Source?: string;
  Updated?: string;
  TimeAgo?: string;
  Title?: string;
  Content?: string;
  Url?: string;
  TermsOfUse?: string;
  Author?: string;
  Categories?: string;
  PlayerID?: number | null;
  TeamID?: number | null;
  Team?: string | null;
  PlayerID2?: number | null;
  TeamID2?: number | null;
  Team2?: string | null;
  OriginalSource?: string | null;
  OriginalSourceUrl?: string | null;
}

export interface SportsDataPlayerProfile {
  PlayerID: number;
  Name?: string | null;
  Team?: string | null;
  Position?: string | null;
  PhotoUrl?: string | null;
  Active?: boolean | null;
}

export interface TeamPlayerWatchItem {
  id: string;
  playerId: number;
  name: string;
  team: string;
  position: string;
  imageUrl: string | null;
  noteTitle: string;
  noteSummary: string;
  noteUrl: string | null;
  updatedAt: string | null;
  source: string;
}

function isSportsDataNewsImagesEnabled(): boolean {
  return (process.env.SPORTSDATA_NEWS_IMAGES_ENABLED ?? 'false').toLowerCase() === 'true';
}

function normalizeExternalUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'scrambled') {
    return null;
  }

  try {
    const normalized = new URL(trimmed).toString();
    if (/\/0\.(png|jpg|jpeg|webp)$/i.test(normalized)) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

function summarizeContent(value?: string | null, maxLength = 180): string {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Latest player update from the SportsDataIO trial feed.';
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function buildPlayerMap(entries: SportsDataPlayerProfile[]): Map<number, SportsDataPlayerProfile> {
  const map = new Map<number, SportsDataPlayerProfile>();

  for (const entry of entries) {
    if (!entry?.PlayerID || map.has(entry.PlayerID)) continue;
    map.set(entry.PlayerID, entry);
  }

  return map;
}

export async function fetchSportsDataTeamPlayers(teamAbbr: string): Promise<SportsDataPlayerProfile[]> {
  if (!isSportsDataNewsImagesEnabled()) return [];

  return sportsDataFetch<SportsDataPlayerProfile[]>(`scores/json/Players/${teamAbbr.toUpperCase()}`, {
    revalidateSeconds: DEFAULT_PLAYER_REVALIDATE_SECONDS,
  });
}

export async function fetchSportsDataNewsByTeam(teamAbbr: string): Promise<SportsDataNewsNote[]> {
  if (!isSportsDataNewsImagesEnabled()) return [];

  return sportsDataFetch<SportsDataNewsNote[]>(
    `news-rotoballer/json/RotoBallerPremiumNewsByTeam/${teamAbbr.toUpperCase()}`,
    {
      revalidateSeconds: DEFAULT_NEWS_REVALIDATE_SECONDS,
    }
  );
}

export async function fetchTeamPlayerWatch(teamAbbr: string, limit = DEFAULT_PLAYER_WATCH_LIMIT): Promise<TeamPlayerWatchItem[]> {
  if (!isSportsDataNewsImagesEnabled()) return [];

  try {
    const [news, players] = await Promise.all([
      fetchSportsDataNewsByTeam(teamAbbr),
      fetchSportsDataTeamPlayers(teamAbbr),
    ]);

    if (!news.length || !players.length) {
      return [];
    }

    const playerMap = buildPlayerMap(players);
    const items: TeamPlayerWatchItem[] = [];
    const seenPlayerIds = new Set<number>();

    for (const note of news) {
      const candidateIds = [note.PlayerID, note.PlayerID2].filter(
        (value): value is number => Number.isFinite(value) && Number(value) > 0
      );

      for (const playerId of candidateIds) {
        if (seenPlayerIds.has(playerId)) continue;

        const player = playerMap.get(playerId);
        if (!player?.Name) continue;

        seenPlayerIds.add(playerId);
        items.push({
          id: `${teamAbbr}-${note.NewsID}-${playerId}`,
          playerId,
          name: player.Name,
          team: (player.Team || teamAbbr || '').toUpperCase(),
          position: (player.Position || '').toUpperCase(),
          imageUrl: normalizeExternalUrl(player.PhotoUrl),
          noteTitle: note.Title?.trim() || `${player.Name} update`,
          noteSummary: summarizeContent(note.Content),
          noteUrl: normalizeExternalUrl(note.Url),
          updatedAt: note.Updated ?? null,
          source: note.Source?.trim() || 'SportsDataIO',
        });

        if (items.length >= limit) {
          return items;
        }
      }
    }

    return items;
  } catch (error) {
    console.warn(`SportsDataIO player watch failed for ${teamAbbr}:`, error);
    return [];
  }
}
