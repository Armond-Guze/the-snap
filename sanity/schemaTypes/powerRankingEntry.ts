import { defineField, defineType } from 'sanity'

const teamColorOptions = [
  { title: 'Arizona Cardinals — #97233F', value: '#97233F' },
  { title: 'Atlanta Falcons — #A71930', value: '#A71930' },
  { title: 'Baltimore Ravens — #241773', value: '#241773' },
  { title: 'Buffalo Bills — #00338D', value: '#00338D' },
  { title: 'Carolina Panthers — #0085CA', value: '#0085CA' },
  { title: 'Chicago Bears — #0B162A', value: '#0B162A' },
  { title: 'Cincinnati Bengals — #FB4F14', value: '#FB4F14' },
  { title: 'Cleveland Browns — #311D00', value: '#311D00' },
  { title: 'Dallas Cowboys — #041E42', value: '#041E42' },
  { title: 'Denver Broncos — #FB4F14', value: '#FB4F14' },
  { title: 'Detroit Lions — #0076B6', value: '#0076B6' },
  { title: 'Green Bay Packers — #203731', value: '#203731' },
  { title: 'Houston Texans — #03202F', value: '#03202F' },
  { title: 'Indianapolis Colts — #002C5F', value: '#002C5F' },
  { title: 'Jacksonville Jaguars — #006778', value: '#006778' },
  { title: 'Kansas City Chiefs — #E31837', value: '#E31837' },
  { title: 'Las Vegas Raiders — #000000', value: '#000000' },
  { title: 'Los Angeles Chargers — #0080C6', value: '#0080C6' },
  { title: 'Los Angeles Rams — #003594', value: '#003594' },
  { title: 'Miami Dolphins — #008E97', value: '#008E97' },
  { title: 'Minnesota Vikings — #4F2683', value: '#4F2683' },
  { title: 'New England Patriots — #002244', value: '#002244' },
  { title: 'New Orleans Saints — #D3BC8D', value: '#D3BC8D' },
  { title: 'New York Giants — #0B2265', value: '#0B2265' },
  { title: 'New York Jets — #125740', value: '#125740' },
  { title: 'Philadelphia Eagles — #004C54', value: '#004C54' },
  { title: 'Pittsburgh Steelers — #FFB612', value: '#FFB612' },
  { title: 'San Francisco 49ers — #AA0000', value: '#AA0000' },
  { title: 'Seattle Seahawks — #002244', value: '#002244' },
  { title: 'Tampa Bay Buccaneers — #D50A0A', value: '#D50A0A' },
  { title: 'Tennessee Titans — #0C2340', value: '#0C2340' },
  { title: 'Washington Commanders — #5A1414', value: '#5A1414' },
]

export default defineType({
  name: 'powerRankingEntry',
  title: 'Power Ranking Entry',
  type: 'object',
  fields: [
    defineField({
      name: 'rank',
      title: 'Rank',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(32),
    }),
    defineField({
      name: 'team',
      title: 'Team',
      type: 'reference',
      to: [{ type: 'tag' }],
      description: 'Use the canonical team tag.',
      validation: (Rule) => Rule.required().error('Team tag is required'),
    }),
    defineField({
      name: 'teamAbbr',
      title: 'Team Abbreviation',
      type: 'string',
      description: 'Optional (for labels/links): KC, SF, BUF.',
    }),
    defineField({
      name: 'teamName',
      title: 'Team Name (override)',
      type: 'string',
      description: 'Optional display override.',
    }),
    defineField({
      name: 'teamColor',
      title: 'Team Name Color',
      type: 'string',
      description: 'Hex color used only for team name text.',
      options: { list: teamColorOptions },
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, { name: 'hex color' })
          .warning('Use a hex color like #FFB612.'),
    }),
    defineField({
      name: 'teamLogo',
      title: 'Team Logo',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
    defineField({
      name: 'previousRank',
      title: 'Previous Rank',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(32),
    }),
    defineField({
      name: 'movement',
      title: 'Movement (+/-)',
      type: 'number',
      description: 'Positive means moved up, negative means moved down.',
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Elite', value: 'elite' },
          { title: 'Contender', value: 'contender' },
          { title: 'Middle Tier', value: 'middle' },
          { title: 'Slipping', value: 'slipping' },
          { title: 'Rebuilding', value: 'rebuilding' },
        ],
      },
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      description: 'Short punchy summary for this team.',
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: 'analysis',
      title: 'Analysis (Full Write-Up)',
      type: 'blockContent',
    }),
    defineField({
      name: 'note',
      title: 'Legacy Note',
      type: 'text',
      rows: 2,
      hidden: true,
    }),
    defineField({
      name: 'prevRankOverride',
      title: 'Legacy Prev Rank',
      type: 'number',
      hidden: true,
    }),
    defineField({
      name: 'movementOverride',
      title: 'Legacy Movement',
      type: 'number',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      rank: 'rank',
      teamAbbr: 'teamAbbr',
      teamName: 'teamName',
      teamTag: 'team.title',
      teamLogo: 'teamLogo',
      teamTagLogo: 'team.teamLogo',
      movement: 'movement',
      movementOverride: 'movementOverride',
      tier: 'tier',
    },
    prepare(selection) {
      const rank = typeof selection.rank === 'number' ? selection.rank : '?'
      const teamNameRaw = (selection.teamTag || selection.teamName || '').trim()
      const teamNameLooksLikeAbbr = /^[A-Z]{2,4}$/.test(teamNameRaw)
      const fallbackName = (selection.teamName || selection.teamAbbr || 'Team').trim()
      const team = teamNameRaw && !teamNameLooksLikeAbbr ? teamNameRaw : fallbackName
      const movement = typeof selection.movement === 'number'
        ? selection.movement
        : typeof selection.movementOverride === 'number'
          ? selection.movementOverride
          : null
      const movementLabel = movement === null ? 'n/a' : movement > 0 ? `+${movement}` : String(movement)
      const tierLabel = selection.tier ? selection.tier.toUpperCase() : 'NO TIER'

      return {
        title: `${rank} - ${team}`,
        subtitle: `${tierLabel} • ${movementLabel}`,
        media: selection.teamLogo || selection.teamTagLogo,
      }
    },
  },
})
