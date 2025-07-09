import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'rankings',
  title: 'Rankings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rankingType',
      title: 'Ranking Type',
      type: 'string',
      options: {
        list: [
          { title: 'Offensive Rankings', value: 'offense' },
          { title: 'Defensive Rankings', value: 'defense' },
          { title: 'Rookie Rankings', value: 'rookie' },
          { title: 'Fantasy QB Rankings', value: 'fantasy-qb' },
          { title: 'Fantasy RB Rankings', value: 'fantasy-rb' },
          { title: 'Fantasy WR Rankings', value: 'fantasy-wr' },
          { title: 'Fantasy TE Rankings', value: 'fantasy-te' },
          { title: 'Draft Rankings', value: 'draft' },
          { title: 'Position Rankings', value: 'position' },
          { title: 'Team Rankings', value: 'team' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'teams',
      title: 'Team Rankings',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'rank',
              title: 'Rank',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).max(32),
            }),
            defineField({
              name: 'previousRank',
              title: 'Previous Rank',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(32),
            }),
            defineField({
              name: 'teamName',
              title: 'Team Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'teamLogo',
              title: 'Team Logo',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'teamColor',
              title: 'Team Color',
              type: 'string',
              description: 'Hex color code for team (e.g., #FF0000)',
            }),
            defineField({
              name: 'summary',
              title: 'Summary',
              type: 'string',
              description: 'Brief summary for this ranking',
            }),
            defineField({
              name: 'analysis',
              title: 'Analysis',
              type: 'array',
              of: [{ type: 'block' }],
              description: 'Detailed analysis for this ranking position',
            }),
            defineField({
              name: 'stats',
              title: 'Key Stats',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Stat Label',
                      type: 'string',
                    }),
                    defineField({
                      name: 'value',
                      title: 'Stat Value',
                      type: 'string',
                    }),
                  ],
                },
              ],
            }),
          ],
          preview: {
            select: {
              rank: 'rank',
              teamName: 'teamName',
              summary: 'summary',
              media: 'teamLogo',
            },
            prepare({ rank, teamName, summary, media }) {
              return {
                title: `${rank}. ${teamName}`,
                subtitle: summary,
                media,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'methodology',
      title: 'Methodology',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Explanation of how these rankings were determined',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      description: 'Number of times this ranking has been viewed (automatically tracked)',
      initialValue: 0,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      rankingType: 'rankingType',
      author: 'author.name',
      media: 'coverImage',
    },
    prepare({ title, rankingType, author, media }) {
      return {
        title,
        subtitle: `${rankingType?.toUpperCase()} by ${author}`,
        media,
      }
    },
  },
})
