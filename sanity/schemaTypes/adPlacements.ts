import { defineType, defineField } from 'sanity'

export const adPlacements = defineType({
  name: 'adPlacements',
  title: 'Ad Placements',
  type: 'document',
  fields: [
    defineField({
      name: 'notes',
      title: 'Internal Notes',
      type: 'text'
    }),
    defineField({
      name: 'slots',
      title: 'Ad Slots',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'slot',
          fields: [
            { name: 'key', type: 'string', title: 'Key', validation: r => r.required() },
            { name: 'description', type: 'string', title: 'Description' },
            { name: 'networkCode', type: 'string', title: 'Network Code' },
            { name: 'unitPath', type: 'string', title: 'Unit Path', description: 'DFP / GAM unit path if applicable' },
            { name: 'sizes', type: 'array', title: 'Sizes (WxH)', of: [{ type: 'string' }], options: { layout: 'tags' } },
            { name: 'active', type: 'boolean', title: 'Active', initialValue: true },
            { name: 'lazy', type: 'boolean', title: 'Lazy Load', initialValue: true }
          ],
          preview: { select: { title: 'key', subtitle: 'unitPath' } }
        }
      ]
    })
  ],
  preview: { prepare: () => ({ title: 'Ad Placements' }) }
})
