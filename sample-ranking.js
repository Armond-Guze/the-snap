// This is a sample ranking document you can add to your Sanity Studio
// Go to your Sanity Studio at /studio, create a new "Rankings" document, and use this as a template

export const sampleRanking = {
  _type: 'rankings',
  title: 'Week 18 Fantasy QB Rankings',
  slug: {
    current: 'week-18-fantasy-qb-rankings',
    _type: 'slug'
  },
  rankingType: 'fantasy-qb',
  summary: 'Final week fantasy quarterback rankings with playoff implications and matchup analysis.',
  published: true,
  publishedAt: new Date().toISOString(),
  teams: [
    {
      rank: 1,
      previousRank: 2,
      teamName: 'Josh Allen (Buffalo Bills)',
      summary: 'Elite matchup vs Jets defense, playoff seeding on the line',
      stats: [
        { label: 'Pass Yards/Game', value: '285.2' },
        { label: 'Pass TDs', value: '29' },
        { label: 'Rush TDs', value: '12' }
      ]
    },
    {
      rank: 2,
      previousRank: 1,
      teamName: 'Lamar Jackson (Baltimore Ravens)',
      summary: 'Tough matchup but rushing floor remains high',
      stats: [
        { label: 'Pass Yards/Game', value: '265.8' },
        { label: 'Pass TDs', value: '25' },
        { label: 'Rush TDs', value: '4' }
      ]
    },
    {
      rank: 3,
      previousRank: 4,
      teamName: 'Dak Prescott (Dallas Cowboys)',
      summary: 'Bounce-back candidate with improved matchup',
      stats: [
        { label: 'Pass Yards/Game', value: '275.1' },
        { label: 'Pass TDs', value: '32' },
        { label: 'Rush TDs', value: '2' }
      ]
    }
  ],
  seo: {
    metaTitle: 'Week 18 Fantasy QB Rankings - The Snap',
    metaDescription: 'Final week fantasy quarterback rankings with playoff implications and expert analysis.',
    focusKeyword: 'fantasy QB rankings'
  }
};

// Instructions:
// 1. Go to your Sanity Studio at [your-domain]/studio
// 2. Click "Create" and select "Rankings"
// 3. Fill in the fields using the data above
// 4. Make sure to set "Published" to true
// 5. Save the document
// 6. Visit /rankings to see your new rankings page!
