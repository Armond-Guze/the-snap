import { DocumentActionComponent, DocumentActionProps } from 'sanity';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

export const createRankingsSnapshotAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published } = props;
  const doc = (draft || published) as unknown as {
    _type?: string;
    season?: number;
    currentWeek?: number;
    entries?: Array<{ rank: number; teamAbbr: string; teamName?: string; note?: string }>;
  };
  if (!doc || doc._type !== 'rankings') return null;

  const disabled = !doc?.entries || !Array.isArray(doc.entries) || !doc.currentWeek || !doc.season;

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

      const items = (doc.entries || []).map((e) => {
        const prevRank = prev?.items?.find((p: { teamAbbr: string; rank: number }) => p.teamAbbr === e.teamAbbr)?.rank;
        const movement = typeof prevRank === 'number' ? prevRank - e.rank : 0;
        return {
          _type: 'object',
          rank: e.rank,
          teamAbbr: e.teamAbbr,
          teamName: e.teamName ?? e.teamAbbr,
          note: e.note ?? '',
          prevRank: prevRank ?? null,
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
