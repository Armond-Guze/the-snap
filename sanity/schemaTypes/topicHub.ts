import { defineType, defineField } from 'sanity'

const fantasyTypeOptions = [
  { title: 'Start/Sit', value: 'start-sit' },
  { title: 'Waiver Wire', value: 'waiver-wire' },
  { title: 'Player Analysis', value: 'player-analysis' },
  { title: 'Week Preview', value: 'week-preview' },
  { title: 'Trade Analysis', value: 'trade-analysis' },
  { title: 'Draft Strategy', value: 'draft-strategy' },
  { title: 'Injury Report', value: 'injury-report' },
  { title: 'General Tips', value: 'general-tips' }
]

export const topicHub = defineType({
  name: 'topicHub',
  title: 'Topic Hub',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' }
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: r => r.required().min(3).max(60),
      group: 'content'
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: r => r.required(),
      group: 'content'
    }),
    defineField({
      name: 'fantasyType',
      title: 'Associated Fantasy Type',
      type: 'string',
      options: { list: fantasyTypeOptions },
      description: 'Optional: link this hub to a fantasy type for automatic population.',
      group: 'content'
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      validation: r => r.max(240),
      group: 'content'
    }),
    defineField({
      name: 'autoPopulate',
      title: 'Auto Populate Articles',
      type: 'boolean',
      initialValue: true,
      description: 'When enabled, hub listings are filled by newest articles matching fantasyType or related tags (unless manually curated below).',
      group: 'content'
    }),
    defineField({
      name: 'featuredArticles',
      title: 'Featured Articles (Overrides Auto For These)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'headline' }, { type: 'fantasyFootball' }] }],
      group: 'content'
    }),
    defineField({
      name: 'relatedTags',
      title: 'Related Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      options: { layout: 'tags' },
      description: 'Tag references used for auto population & internal linking.',
      group: 'content'
    }),
    defineField({
      name: 'relatedHubs',
      title: 'Related Hubs',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'topicHub' }] }],
      description: 'Cross-link sister hubs.',
      group: 'content'
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      initialValue: { autoGenerate: true }
    })
  ],
  preview: {
    select: { title: 'title', fantasyType: 'fantasyType', articles: 'featuredArticles' },
    prepare({ title, fantasyType, articles }) {
      const count = Array.isArray(articles) ? articles.length : 0;
      return {
        title,
        subtitle: [fantasyType && fantasyType.replace('-', ' '), count ? `${count} featured` : null].filter(Boolean).join(' • ')
      }
    }
  }
})
