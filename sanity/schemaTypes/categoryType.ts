import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import { apiVersion } from '../env'

export const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Category Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(50),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, ctx) => {
          const slug = typeof value?.current === 'string' ? value.current.trim().toLowerCase() : ''
          if (!slug) return true
          const rawId = typeof ctx.document?._id === 'string' ? ctx.document?._id : ''
          const cleanId = rawId.replace(/^drafts\./, '')
          const draftId = cleanId ? `drafts.${cleanId}` : ''
          const count = await ctx
            .getClient({ apiVersion })
            .fetch<number>(
              `count(*[_type == "category" && slug.current == $slug && !(_id in [$id,$draftId])])`,
              { slug, id: cleanId, draftId }
            )
          return count > 0 ? 'Category slug already in use' : true
        }),
    }),
    defineField({
      name: 'description',
      title: 'Category Description',
      type: 'text',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      options: { collapsible: true, collapsed: false },
      initialValue: { autoGenerate: true },
    }),
    defineField({
      name: 'color',
      title: 'Category Color',
      type: 'string',
      options: {
        list: [
          { title: 'Red', value: 'red' },
          { title: 'Blue', value: 'blue' },
          { title: 'Green', value: 'green' },
          { title: 'Yellow', value: 'yellow' },
          { title: 'Purple', value: 'purple' },
          { title: 'Orange', value: 'orange' },
          { title: 'Gray', value: 'gray' },
        ],
      },
      initialValue: 'gray',
    }),
    defineField({
      name: 'priority',
      title: 'Display Priority',
      type: 'number',
      description: 'Lower numbers show first in category lists',
      validation: (Rule) => Rule.min(1).max(100),
      initialValue: 50,
    }),
  ],
  groups: [
    {
      name: "seo",
      title: "SEO",
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})
