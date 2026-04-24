import {defineArrayMember, defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons'
import DataTableInput from '../plugins/dataTableInput'

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
    defineArrayMember({
      type: 'object',
      name: 'dataTable',
      title: 'Data Table',
      description: 'Paste spreadsheet-style rows for odds, standings, rankings, and other quick comparisons.',
      components: {input: DataTableInput},
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'Optional note shown below the table.',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'columns',
          title: 'Columns',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
          validation: (Rule) => Rule.required().min(2).max(8),
        }),
        defineField({
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'dataTableRow',
              title: 'Row',
              fields: [
                defineField({
                  name: 'cells',
                  title: 'Cells',
                  type: 'array',
                  of: [defineArrayMember({type: 'string'})],
                  validation: (Rule) => Rule.required().min(1),
                }),
              ],
              preview: {
                select: {
                  cells: 'cells',
                },
                prepare(selection) {
                  const cells = Array.isArray(selection.cells) ? selection.cells.filter(Boolean) : []
                  return {
                    title: cells[0] || 'Table row',
                    subtitle: `${cells.length} cells`,
                  }
                },
              },
            }),
          ],
          validation: (Rule) =>
            Rule.required()
              .min(1)
              .custom((rows, ctx) => {
                const parent = ctx.parent as {columns?: unknown} | undefined
                const columns = Array.isArray(parent?.columns) ? parent.columns : []
                if (!Array.isArray(rows) || columns.length === 0) return true

                const mismatchIndex = rows.findIndex((row) => {
                  const rowValue = row as {cells?: unknown} | undefined
                  const cells = Array.isArray(rowValue?.cells) ? rowValue.cells : []
                  return cells.length !== columns.length
                })

                if (mismatchIndex >= 0) {
                  return `Row ${mismatchIndex + 1} must contain ${columns.length} cells to match the header.`
                }

                return true
              }),
        }),
      ],
      preview: {
        select: {
          caption: 'caption',
          columns: 'columns',
          rows: 'rows',
        },
        prepare(selection) {
          const columnCount = Array.isArray(selection.columns) ? selection.columns.length : 0
          const rowCount = Array.isArray(selection.rows) ? selection.rows.length : 0
          return {
            title: selection.caption || 'Data Table',
            subtitle: `${columnCount} columns • ${rowCount} rows`,
          }
        },
      },
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
          title: 'Associated Team',
          type: 'reference',
          to: [{ type: 'tag' }],
          description: 'Optional. Use the player’s drafted team, current team, or associated team for the card.',
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
        {
          name: 'descriptor',
          title: 'Descriptor',
          type: 'string',
          description: 'Optional. Example: Ohio State • LB/EDGE • Junior',
          validation: Rule => Rule.max(120),
        },
        {
          name: 'teamContext',
          title: 'Team Context',
          type: 'string',
          description: 'Optional. Example: Round 1 • No. 5 overall',
          validation: Rule => Rule.max(80),
        },
        {
          name: 'grade',
          title: 'Grade / Badge',
          type: 'string',
          description: 'Optional short badge like A-, Value Pick, or Best Fit.',
          validation: Rule => Rule.max(24),
        },
        {
          name: 'note',
          title: 'Supporting Note',
          type: 'text',
          rows: 2,
          description: 'Optional short note shown below the card.',
          validation: Rule => Rule.max(220),
        },
        {
          name: 'headshot',
          title: 'Image Override',
          type: 'image',
          options: { hotspot: true },
          description: 'Optional. Use if no player reference image is available.',
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              validation: Rule => Rule.max(100),
            }),
          ],
        },
      ],
      preview: {
        select: {
          rank: 'rank',
          entityType: 'entityType',
          name: 'name',
          playerName: 'player.name',
          teamName: 'team.title',
          grade: 'grade',
        },
        prepare(sel) {
          const rank = typeof sel.rank === 'number' ? `No. ${sel.rank}` : 'No. ?'
          const displayName = sel.name || sel.playerName || sel.teamName || 'Ranking Entry'
          const entityType = sel.entityType ? ` • ${String(sel.entityType).toUpperCase()}` : ''
          const grade = sel.grade ? ` • ${sel.grade}` : ''
          return {
            title: `${rank} - ${displayName}`,
            subtitle: `Ranking card${entityType}${grade}`,
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
