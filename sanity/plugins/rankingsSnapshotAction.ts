import { DocumentActionComponent, DocumentActionProps } from 'sanity';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

// Minimal map of common NFL team names to standard abbreviations
const TEAM_NAME_TO_ABBR: Record<string, string> = {
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
  'los angeles chargers': 'LAC',
  'los angeles rams': 'LAR',
  'las vegas raiders': 'LV',
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
};

function toAbbr(name?: string | null): string | null {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  return TEAM_NAME_TO_ABBR[key] || null;
}

export const createRankingsSnapshotAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props;
  const doc = (draft || published) as unknown as {
    _type?: string;
    season?: number;
    currentWeek?: number;
    teams?: Array<{ rank: number; teamName?: string; previousRank?: number; summary?: string } | null>;
  };
  if (!doc || doc._type !== 'rankings') return null;

  const disabled = !doc?.teams || !Array.isArray(doc.teams) || doc.teams.length === 0 || !doc.currentWeek || !doc.season;

  return {
    label: 'Create Week Snapshot',
    disabled,
    onHandle: async () => {
      const client = createClient({ projectId, dataset, apiVersion, useCdn: false });
      const season = Number(doc.season);
      const week = Number(doc.currentWeek);

      const prev = await client.fetch(
        `*[_type == "powerRankingWeek" && season == $season && week == $week][0]{ items[]{rank,teamAbbr} }`,
        { season, week: week - 1 }
      );

      const items = (doc.teams || [])
        .filter((t): t is { rank: number; teamName?: string; previousRank?: number; summary?: string } => !!t && typeof t === 'object')
        .map((t) => {
          const abbr = toAbbr(t.teamName || '') || (t.teamName || '').slice(0, 3).toUpperCase();
          const prevRank: number | undefined = prev?.items?.find((p: { teamAbbr: string; rank: number }) => p.teamAbbr === abbr)?.rank;
          const movement = typeof prevRank === 'number' ? prevRank - t.rank : 0;
          return {
            _type: 'object',
            rank: t.rank,
            teamAbbr: abbr,
            teamName: t.teamName || abbr,
            note: t.summary || '',
            prevRank: typeof prevRank === 'number' ? prevRank : null,
            movement,
          };
        });

      const id = `prw-${season}-w${week}`;
      await client.createOrReplace({
        _id: id,
        _type: 'powerRankingWeek',
        season,
        week,
        items,
        publishedAt: new Date().toISOString(),
        slug: { _type: 'slug', current: `week-${week}-${season}` },
      });

      props.onComplete?.();
      // @ts-expect-error (toast may be undefined depending on Studio version)
      props?.toast?.push?.({ status: 'success', title: `Snapshot created: Week ${week} — ${season}` });
    },
  };
};

export const publishAndSnapshotAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props;
  const doc = (draft || published) as { _id?: string; _type?: string } | undefined;
  if (!doc || doc._type !== 'rankings') return null;
  return {
    label: 'Publish + Snapshot',
    onHandle: async () => {
      // Publish via mutation (drafts use prefix "drafts.")
      const client = createClient({ projectId, dataset, apiVersion, useCdn: false });
      if (doc._id?.startsWith('drafts.')) {
        const id = doc._id.replace('drafts.', '');
        const latest = await client.getDocument(doc._id);
        if (latest) {
          await client.createOrReplace({ ...latest, _id: id });
          await client.delete(doc._id);
        }
      }
      // Then create snapshot
      const action = createRankingsSnapshotAction(props);
      await action?.onHandle?.();
      props.onComplete?.();
    },
  };
};
