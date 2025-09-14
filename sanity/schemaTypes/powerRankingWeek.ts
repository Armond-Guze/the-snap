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
      validation: (Rule) => Rule.required().min(1),
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
