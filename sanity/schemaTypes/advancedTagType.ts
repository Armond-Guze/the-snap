import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const advancedTagType = defineType({
  name: 'advancedTag',
  title: 'Canonical Tags',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tag Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(40),
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases (optional)',
      description: 'Alternate names/abbreviations that should map to this canonical tag.',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (Rule) => Rule.max(10),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.max(200),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})

export default advancedTagType
