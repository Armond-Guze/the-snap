import {TagsIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const tagType = defineType({
  name: 'tag',
  title: 'Team Tags',
  type: 'document',
  icon: TagsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tag Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(30),
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases (optional)',
      description: 'Alternate names/abbreviations that should map to this tag. Example: MNF, Monday Night',
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
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Tag Description',
      type: 'text',
      validation: (Rule) => Rule.max(150),
    }),
    defineField({
      name: 'trending',
      title: 'Trending Tag',
      type: 'boolean',
      description: 'Mark this tag as trending to feature it prominently',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})

export default tagType;
