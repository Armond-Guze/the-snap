import {TagsIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const tagType = defineType({
  name: 'tag',
  title: 'Tag',
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
