import { defineType, defineField } from 'sanity'
import { apiVersion } from '../env'

const RESERVED_ROOT_SLUGS = new Set([
  'about',
  'admin',
  'api',
  'articles',
  'calendar',
  'categories',
  'contact',
  'fantasy',
  'headlines',
  'newsletter',
  'play-of-the-week',
  'power-rankings',
  'privacy-policy',
  'privacypolicy',
  'rankings',
  'robots.txt',
  'rss.xml',
  'schedule',
  'sitemap.xml',
  'standings',
  'studio',
  'tags',
  'tankathon',
  'teams',
  'terms',
])

export const topicHub = defineType({
  name: 'topicHub',
  title: 'Topic Hubs',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'targeting', title: 'Targeting' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().min(3).max(80),
      group: 'content',
    }),
    defineField({
      name: 'navLabel',
      title: 'Navbar Label',
      type: 'string',
      description: 'Optional shorter label for future nav usage (ex: "Draft").',
      validation: (rule) => rule.max(24),
      group: 'content',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) =>
        rule.required().custom(async (value, ctx) => {
          const slug = typeof value?.current === 'string' ? value.current.trim().toLowerCase() : ''
          if (!slug) return true
          if (RESERVED_ROOT_SLUGS.has(slug)) {
            return `"${slug}" is reserved by an existing route. Choose a different slug.`
          }

          const rawId = typeof ctx.document?._id === 'string' ? ctx.document._id : ''
          const cleanId = rawId.replace(/^drafts\./, '')
          const draftId = cleanId ? `drafts.${cleanId}` : ''
          const count = await ctx
            .getClient({ apiVersion })
            .fetch<number>(
              `count(*[_type == "topicHub" && slug.current == $slug && !(_id in [$id,$draftId])])`,
              { slug, id: cleanId, draftId }
            )
          return count > 0 ? 'Slug already in use by another Topic Hub' : true
        }),
      group: 'content',
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: 'Used in hero and SEO description fallback.',
      validation: (rule) => rule.max(220),
      group: 'content',
    }),
    defineField({
      name: 'intro',
      title: 'Intro Copy',
      type: 'text',
      rows: 6,
      description: 'Optional long intro shown at the top of the hub page.',
      validation: (rule) => rule.max(1200),
      group: 'content',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
      group: 'content',
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      description: 'Optional hex accent used for page highlights (example: #00A3FF).',
      validation: (rule) =>
        rule
          .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, { name: 'hex color' })
          .warning('Use a hex color like #00A3FF'),
      group: 'content',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Inactive hubs are hidden from auto-discovery and return 404 on site.',
      group: 'content',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      initialValue: 50,
      validation: (rule) => rule.min(1).max(200),
      description: 'Lower number = higher priority for future menus.',
      group: 'content',
    }),
    defineField({
      name: 'relatedCategories',
      title: 'Auto-Match Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      options: { layout: 'tags' },
      description: 'Articles with any of these categories are pulled into this hub automatically.',
      group: 'targeting',
    }),
    defineField({
      name: 'relatedTags',
      title: 'Auto-Match Canonical Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'advancedTag' }] }],
      options: { layout: 'tags' },
      description: 'Articles with these tagRefs are pulled in automatically.',
      group: 'targeting',
    }),
    defineField({
      name: 'featuredArticles',
      title: 'Featured Content',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'article' }, { type: 'headline' }, { type: 'fantasyFootball' }],
        },
      ],
      description: 'Pinned items that always appear first.',
      group: 'targeting',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      initialValue: { autoGenerate: true },
      options: { collapsible: true, collapsed: false },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      active: 'active',
      media: 'coverImage',
    },
    prepare({ title, slug, active, media }) {
      return {
        title,
        subtitle: `${active === false ? 'Inactive' : 'Active'} • /${slug || ''}`,
        media,
      }
    },
  },
})
