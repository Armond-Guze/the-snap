import {defineType, defineArrayMember} from 'sanity'
import {ImageIcon} from '@sanity/icons'

/**
 * This is the schema type for block content used in the post document type
 * Importing this type into the studio configuration's `schema` property
 * lets you reuse it in other document types with:
 *  {
 *    name: 'someName',
 *    title: 'Some title',
 *    type: 'blockContent'
 *  }
 */

export const blockContentType = defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      // Styles let you define what blocks can be marked up as. The default
      // set corresponds with HTML tags, but you can set any title or value
      // you want, and decide how you want to deal with it where you want to
      // use your content.
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [{title: 'Bullet', value: 'bullet'}],
      // Marks let you mark up inline text in the Portable Text Editor
      marks: {
        // Decorators usually describe a single property – e.g. a typographic
        // preference or highlighting
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Large Text', value: 'large'},
        ],
        // Annotations can be any object structure – e.g. a link or a footnote.
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    // Enhanced blockquote for player/coach quotes
    defineArrayMember({
      type: 'object',
      name: 'blockquote',
      title: 'Quote',
      fields: [
        {
          name: 'text',
          title: 'Quote Text',
          type: 'text',
          validation: Rule => Rule.required()
        },
        {
          name: 'author',
          title: 'Author',
          type: 'string',
          description: 'Who said this quote?'
        },
        {
          name: 'title',
          title: 'Author Title',
          type: 'string',
          description: 'e.g. Head Coach, Quarterback, etc.'
        },
        {
          name: 'team',
          title: 'Team',
          type: 'string',
          description: 'Team affiliation'
        },
        {
          name: 'source',
          title: 'Source',
          type: 'string',
          description: 'Where was this quote from? (optional)'
        },
        {
          name: 'style',
          title: 'Quote Style',
          type: 'string',
          options: {
            list: [
              {title: 'Default', value: 'default'},
              {title: 'Highlighted', value: 'highlighted'},
              {title: 'Pull Quote', value: 'pullquote'},
              {title: 'Sidebar Quote', value: 'sidebar'}
            ]
          },
          initialValue: 'default'
        }
      ],
      preview: {
        select: {
          text: 'text',
          author: 'author',
          title: 'title'
        },
        prepare(selection) {
          const {text, author, title} = selection
          const subtitle = author ? `— ${author}${title ? `, ${title}` : ''}` : ''
          return {
            title: text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : 'Quote',
            subtitle: subtitle
          }
        }
      }
    }),
    // Content dividers
    defineArrayMember({
      type: 'object',
      name: 'divider',
      title: 'Divider',
      fields: [
        {
          name: 'style',
          title: 'Style',
          type: 'string',
          options: {
            list: [
              {title: 'Simple Line', value: 'line'},
              {title: 'Dotted Line', value: 'dots'},
              {title: 'Stars', value: 'stars'},
              {title: 'NFL Theme', value: 'nfl'},
              {title: 'Custom', value: 'custom'}
            ]
          },
          initialValue: 'line'
        },
        {
          name: 'spacing',
          title: 'Spacing',
          type: 'string',
          options: {
            list: [
              {title: 'Small', value: 'small'},
              {title: 'Medium', value: 'medium'},
              {title: 'Large', value: 'large'}
            ]
          },
          initialValue: 'medium'
        },
        {
          name: 'customText',
          title: 'Custom Text',
          type: 'string',
          description: 'Optional text for custom dividers',
          hidden: ({parent}) => parent?.style !== 'custom'
        }
      ],
      preview: {
        select: {
          style: 'style',
          spacing: 'spacing',
          customText: 'customText'
        },
        prepare(selection) {
          const {style, spacing, customText} = selection
          const styleMap = {
            line: '————————',
            dots: '• • • • • • •',
            stars: '★ ★ ★ ★ ★',
            nfl: '🏈 🏈 🏈',
            custom: customText || 'Custom'
          }
          return {
            title: styleMap[style as keyof typeof styleMap] || 'Divider',
            subtitle: `${spacing} spacing`
          }
        }
      }
    }),
    // You can add additional types here. Note that you can't use
    // primitive types such as 'string' and 'number' in the same array
    // as a block type.
    defineArrayMember({
      type: 'image',
      icon: ImageIcon,
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        }
      ]
    }),
    // Inline ranking card for "No. X" player/team blocks inside article body
    defineArrayMember({
      type: 'object',
      name: 'rankingCard',
      title: 'Ranking Card',
      fields: [
        {
          name: 'rank',
          title: 'Rank Number',
          type: 'number',
          validation: Rule => Rule.required().min(1).max(999),
        },
        {
          name: 'entityType',
          title: 'Entity Type',
          type: 'string',
          options: {
            list: [
              { title: 'Player', value: 'player' },
              { title: 'Team', value: 'team' },
              { title: 'Coach', value: 'coach' },
              { title: 'Unit', value: 'unit' },
              { title: 'Other', value: 'other' },
            ],
            layout: 'radio',
          },
          initialValue: 'player',
        },
        {
          name: 'player',
          title: 'Player (reference)',
          type: 'reference',
          to: [{ type: 'player' }],
          hidden: ({ parent }) => parent?.entityType !== 'player',
        },
        {
          name: 'team',
          title: 'Team Tag (reference)',
          type: 'reference',
          to: [{ type: 'tag' }],
          description: 'Pick your canonical team tag.',
          hidden: ({ parent }) => parent?.entityType !== 'team',
        },
        {
          name: 'name',
          title: 'Display Name (manual / override)',
          type: 'string',
          description: 'Optional. If blank, uses referenced player/team name.',
          validation: Rule => Rule.max(80),
        },
        {
          name: 'position',
          title: 'Position (manual override)',
          type: 'string',
          description: 'Optional. If blank, uses the referenced player position.',
          validation: Rule => Rule.max(12),
        },
      ],
      preview: {
        select: {
          rank: 'rank',
          entityType: 'entityType',
          name: 'name',
          playerName: 'player.name',
          teamName: 'team.title',
        },
        prepare(sel) {
          const rank = typeof sel.rank === 'number' ? `No. ${sel.rank}` : 'No. ?'
          const displayName = sel.name || sel.playerName || sel.teamName || 'Ranking Entry'
          const entityType = sel.entityType ? ` • ${String(sel.entityType).toUpperCase()}` : ''
          return {
            title: `${rank} - ${displayName}`,
            subtitle: `Ranking card${entityType}`,
          }
        },
      },
    }),

    // Snap-style graphics (Aura Meter + Trajectory Sticker + Pressure Stamp)
    defineArrayMember({
      type: 'snapGraphicCard',
      name: 'snapGraphicCard',
      title: 'Snap Graphic Card',
    }),
  ],
})
