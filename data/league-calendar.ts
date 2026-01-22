import { LeagueMilestone } from '@/types/calendar';

export const leagueMilestones: LeagueMilestone[] = [
  {
    id: 'combine-2026',
    title: 'NFL Scouting Combine',
    date: '2026-02-24T15:00:00Z',
    windowEnd: '2026-03-03T23:00:00Z',
    phase: 'Pre-Draft Intel',
    type: 'window',
    location: 'Lucas Oil Stadium — Indianapolis',
    description: 'Prospects hit the field and meeting rooms while front offices collect verified measurables.',
    tags: ['prospects', 'measurements', 'interviews'],
    faq: [
      {
        question: 'How can fans follow live drills?',
        answer: 'NFL Network streams the marquee workouts each afternoon; we embed clips and instant-read takeaways on headlines throughout the week.'
      },
      {
        question: 'Why does the Combine matter?',
        answer: 'Beyond 40-yard dash times, medicals and interviews shape draft boards more than any single workout.'
      }
    ],
    relatedPaths: ['/headlines', '/draft-tracker']
  },
  {
    id: 'tag-window-2026',
    title: 'Franchise/Transition Tag Window',
    date: '2026-02-25T17:00:00Z',
    windowEnd: '2026-03-11T21:00:00Z',
    phase: 'Pre-Draft Intel',
    type: 'window',
    description: 'Teams lock in cornerstone veterans or let them test the market before free agency opens.',
    tags: ['contracts', 'roster-building'],
    faq: [
      {
        question: 'How many times can a player be tagged?',
        answer: 'Teams can tag a player in consecutive seasons, but the cost escalates by 120% of the previous salary, making repeat tags pricey.'
      }
    ],
    relatedPaths: ['/headlines/tags', '/articles/power-rankings']
  },
  {
    id: 'league-year-2026',
    title: 'New League Year & Free Agency Opens',
    date: '2026-03-18T20:00:00Z',
    phase: 'Pre-Draft Intel',
    type: 'event',
    description: 'Contracts can become official, trades process, and the negotiating frenzy goes public.',
    tags: ['free agency', 'transactions'],
    relatedPaths: ['/headlines/free-agency', '/articles/power-rankings']
  },
  {
    id: 'draft-round1-2026',
    title: 'NFL Draft — Round 1',
    date: '2026-04-23T00:00:00Z',
    phase: 'Draft Week',
    type: 'event',
    location: 'Detroit Draft Theater',
    description: 'Night one sets the tone with quarterback dominos and blue-chip defenders flying off the board.',
    tags: ['draft', 'round 1'],
    relatedPaths: ['/draft-board', '/articles/power-rankings']
  },
  {
    id: 'draft-weekend-2026',
    title: 'NFL Draft — Rounds 2-7',
    date: '2026-04-24T16:00:00Z',
    windowEnd: '2026-04-25T23:00:00Z',
    phase: 'Draft Week',
    type: 'window',
    description: 'Where contenders are built: day-two steals, developmental tackles, and special-teams aces.',
    tags: ['draft sleepers', 'team needs'],
    relatedPaths: ['/draft-board', '/fantasy']
  },
  {
    id: 'rookie-minicamp-2026',
    title: 'Rookie Minicamps Open',
    date: '2026-05-09T16:00:00Z',
    phase: 'Rookie Camps',
    type: 'window',
    windowEnd: '2026-05-19T23:00:00Z',
    description: 'First on-field install for new draft picks and priority free agents before veterans report.',
    tags: ['rookies', 'install'],
    relatedPaths: ['/headlines', '/fantasy']
  },
  {
    id: 'otas-2026',
    title: 'Organized Team Activities (OTAs)',
    date: '2026-05-20T16:00:00Z',
    windowEnd: '2026-06-12T23:00:00Z',
    phase: 'Summer Install',
    type: 'window',
    description: 'Veterans rejoin the roster for light practices, schematic refreshers, and chemistry work.',
    tags: ['otas', 'install'],
    faq: [
      {
        question: 'Are OTAs mandatory?',
        answer: 'Workouts are officially voluntary, but attendance signals leadership standing and role security.'
      }
    ],
    relatedPaths: ['/headlines', '/fantasy']
  },
  {
    id: 'training-camp-2026',
    title: 'Training Camps Report Dates',
    date: '2026-07-22T14:00:00Z',
    windowEnd: '2026-07-30T23:00:00Z',
    phase: 'Preseason Ramp',
    type: 'window',
    description: 'Physical practices begin, depth charts harden, and Hard Knocks cameras roll.',
    tags: ['training camp', 'position battles'],
    relatedPaths: ['/articles/power-rankings', '/headlines']
  },
  {
    id: 'preseason-kickoff-2026',
    title: 'Preseason Week 1',
    date: '2026-08-07T00:00:00Z',
    phase: 'Preseason Ramp',
    type: 'event',
    description: 'First live reps for rookies and backups fighting for roster spots.',
    tags: ['preseason', 'depth chart'],
    relatedPaths: ['/schedule', '/fantasy']
  },
  {
    id: 'season-kickoff-2026',
    title: 'Regular Season Kickoff Game',
    date: '2026-09-10T00:20:00Z',
    phase: 'Regular Season',
    type: 'event',
    description: 'Banner-raising Thursday night showcase launches another 18-week sprint.',
    tags: ['regular season', 'kickoff'],
    relatedPaths: ['/schedule', '/articles/power-rankings']
  }
];
