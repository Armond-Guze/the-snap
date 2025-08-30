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
    // Player Heading (custom rich heading with headshot + meta)
    defineArrayMember({
      type: 'object',
      name: 'playerHeading',
      title: 'Player Heading',
      fields: [
        { name: 'player', title: 'Player (reference preferred)', type: 'reference', to: [{ type: 'player' }], description: 'Pick an existing player or fill manual override fields.' },
        { name: 'playerName', title: 'Manual Player Name', type: 'string', hidden: ({ parent }) => !!parent?.player },
        { name: 'team', title: 'Manual Team', type: 'string', hidden: ({ parent }) => !!parent?.player },
        { name: 'position', title: 'Manual Position', type: 'string', description: 'e.g. QB, WR, RB', hidden: ({ parent }) => !!parent?.player },
        { name: 'headshot', title: 'Manual Headshot', type: 'image', options: { hotspot: true }, hidden: ({ parent }) => !!parent?.player, fields: [ { name: 'alt', type: 'string', title: 'Alt Text' } ] },
        { name: 'style', title: 'Style Variant', type: 'string', options: { list: [
          { title: 'Large Banner', value: 'banner' },
          { title: 'Inline Compact', value: 'inline' },
          { title: 'Card', value: 'card' }
        ] }, initialValue: 'banner' },
        { name: 'rank', title: 'Rank Number', type: 'number', description: 'Optional ranking position to display (e.g. 1, 12).', validation: Rule => Rule.min(1).max(999).warning('Rank should be between 1 and 999'), options: { layout: 'number' } },
        { name: 'subtitle', title: 'Subtitle / Tagline', type: 'string', description: 'Optional short context line' },
        { name: 'useTeamColors', title: 'Auto Team Colors', type: 'boolean', initialValue: true, description: 'Apply NFL team color background (uses team code). Works with reference or manual team.' },
      ],
      preview: {
        select: { title: 'player.name', refTeam: 'player.team', manualName: 'playerName', manualTeam: 'team', mediaRef: 'player.headshot', mediaManual: 'headshot', rank: 'rank' },
        prepare(sel) {
          const title = sel.title || sel.manualName || 'Player Heading'
          const subtitleParts = [sel.rank ? `#${sel.rank}` : null, sel.refTeam || sel.manualTeam].filter(Boolean)
          const subtitle = subtitleParts.join(' • ')
          const media = sel.mediaRef || sel.mediaManual
          return { title, subtitle, media }
        }
      }
    }),
  ],
})
