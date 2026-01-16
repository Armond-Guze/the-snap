import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'powerRankingWeek',
  title: 'Power Rankings (Week Snapshot)',
  type: 'document',
  fields: [
    defineField({ name: 'season', type: 'number', title: 'Season Year', validation: r => r.required() }),
    defineField({ name: 'week', type: 'number', title: 'Week Number', validation: r => r.required().min(1).max(25) }),
    defineField({
      name: 'items',
      title: 'Ranked Teams (1–32)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'rank', type: 'number', title: 'Rank', validation: r => r.required().min(1).max(32) },
            { name: 'teamAbbr', type: 'string', title: 'Team (abbr)', validation: r => r.required() },
            { name: 'teamName', type: 'string', title: 'Team Name' },
            { name: 'note', type: 'text', rows: 2, title: 'Short note' },
            { name: 'prevRank', type: 'number', title: 'Prev Rank' },
            { name: 'movement', type: 'number', title: 'Movement (+/-)' },
          ],
        },
      ],
      // Sanity ArrayRule uses .min on arrays
      validation: (Rule) =>
        Rule.required().custom((items: Array<{ rank?: number; teamAbbr?: string }> | undefined) => {
          if (!Array.isArray(items)) return 'Add the ranked teams';
          if (items.length !== 32) return 'Must include exactly 32 teams';
          const ranks = items.map(i => i?.rank).filter((r): r is number => typeof r === 'number');
          if (new Set(ranks).size !== 32) return 'Ranks must be unique';
          const missing = Array.from({ length: 32 }, (_, idx) => idx + 1).filter(n => !ranks.includes(n));
          if (missing.length) return 'Ranks must be contiguous 1–32';
          const teams = items.map(i => (i?.teamAbbr || '').toUpperCase()).filter(Boolean);
          if (teams.length !== 32) return 'Each ranking must have a team abbreviation';
          if (new Set(teams).size !== 32) return 'Teams must be unique';
          return true;
        }),
    }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Published At' }),
  defineField({ name: 'slug', type: 'slug', title: 'Slug', options: { source: 'week' } }),
  ],
  preview: {
    select: { season: 'season', week: 'week' },
    prepare(selection: { season?: number; week?: number }) {
      const { season, week } = selection;
      return { title: `Week ${week ?? '?'} — ${season ?? '?'}` };
    },
  },
});
