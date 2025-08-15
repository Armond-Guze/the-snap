import { defineField, defineType } from 'sanity'

// Stores newsletter subscriber emails (no PII beyond email). Optional name later.
export const newsletterSubscriber = defineType({
  name: 'newsletterSubscriber',
  title: 'Newsletter Subscriber',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.required().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { name: 'email', invert: false }),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      initialValue: 'site',
      readOnly: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'createdAt' },
    prepare({ title, subtitle }) {
      return { title, subtitle: subtitle ? new Date(subtitle).toLocaleString() : '' }
    },
  },
});
