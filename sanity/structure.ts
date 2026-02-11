import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons'

// Custom structure to surface the singleton settings doc & clean grouping
export const structure: StructureResolver = (S) => {
  const hiddenDocTypes = new Set([
    'homepageSettings',
    'siteSettings',
    'adPlacements',
    'standings',
    'gameCenterSettings',
    'fantasyFootball',
    'headline',
    'rankings',
    'post', // not used; hide from nav
  ])

  const customOrdered = [
    // Articles first, with filtered views
    S.listItem()
      .title('Articles')
      .schemaType('article')
      .child(
        S.list()
          .title('Articles')
          .items([
            S.listItem()
              .title('All')
              .schemaType('article')
              .child(
                S.documentTypeList('article')
                  .title('Articles (All)')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Headlines')
              .schemaType('article')
              .child(
                S.documentTypeList('article')
                  .title('Headlines')
                  .filter('_type == "article" && format == "headline"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Features')
              .schemaType('article')
              .child(
                S.documentTypeList('article')
                  .title('Features')
                  .filter('_type == "article" && format == "feature"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Fantasy')
              .schemaType('article')
              .child(
                S.documentTypeList('article')
                  .title('Fantasy')
                  .filter('_type == "article" && format == "fantasy"')
                  .initialValueTemplates([
                    S.initialValueTemplateItem('article', { format: 'fantasy' })
                  ])
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Power Rankings')
              .schemaType('article')
              .child(
                S.list()
                  .title('Power Rankings')
                  .items([
                    S.listItem()
                      .title('Template')
                      .schemaType('article')
                      .child(
                        S.documentTypeList('article')
                          .title('Power Rankings — Template')
                          .filter('_type == "article" && format == "powerRankings" && rankingType == "live"')
                          .initialValueTemplates([
                            S.initialValueTemplateItem('article', { format: 'powerRankings', rankingType: 'live' })
                          ])
                          .defaultOrdering([
                            { field: 'seasonYear', direction: 'desc' },
                            { field: 'date', direction: 'desc' },
                          ])
                      ),
                    S.listItem()
                      .title('Weekly Snapshots')
                      .schemaType('article')
                      .child(
                        S.documentTypeList('article')
                          .title('Power Rankings — Snapshots')
                          .filter('_type == "article" && format == "powerRankings" && rankingType == "snapshot"')
                          .initialValueTemplates([
                            S.initialValueTemplateItem('article', { format: 'powerRankings', rankingType: 'snapshot' })
                          ])
                          .defaultOrdering([
                            { field: 'seasonYear', direction: 'desc' },
                            { field: 'weekNumber', direction: 'desc' },
                            { field: 'date', direction: 'desc' },
                          ])
                      ),
                  ])
              ),
            S.listItem()
              .title('Rankings')
              .schemaType('article')
              .child(
                S.documentTypeList('article')
                  .title('Rankings')
                  .filter('(_type == "article" && format == "ranking") || _type == "rankings"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
            S.listItem()
              .title('Analysis')
              .schemaType('article')
              .child(
                S.documentTypeList('article')
                  .title('Analysis')
                  .filter('_type == "article" && format == "analysis"')
                  .defaultOrdering([{ field: 'date', direction: 'desc' }])
              ),
          ])
      ),
    // Existing content groups
    S.listItem()
      .title('Deep Ball Reports')
      .schemaType('deepBallReport')
      .child(
        S.documentTypeList('deepBallReport')
          .title('Deep Ball Reports')
          .defaultOrdering([
            { field: 'season', direction: 'desc' },
            { field: 'week', direction: 'desc' },
            { field: 'publishedAt', direction: 'desc' },
          ])
      ),
    S.listItem()
      .title('Play of the Week')
      .schemaType('playOfWeek')
      .child(
        S.documentTypeList('playOfWeek')
          .title('Play of the Week')
          .defaultOrdering([{ field: 'date', direction: 'desc' }])
      ),
    S.listItem()
      .title('Snap Cards')
      .schemaType('snapCard')
      .child(
        S.documentTypeList('snapCard')
          .title('Snap Cards')
          .defaultOrdering([
            { field: 'season', direction: 'desc' },
            { field: 'week', direction: 'desc' },
            { field: 'publishedAt', direction: 'desc' },
          ])
      ),
    S.listItem()
      .title('Teams')
      .schemaType('tag')
      .child(
        S.documentTypeList('tag')
          .title('Team Tags')
          .defaultOrdering([{ field: 'title', direction: 'asc' }])
      ),
    S.listItem()
      .title('Canonical Tags')
      .schemaType('advancedTag')
      .child(
        S.documentTypeList('advancedTag')
          .title('Canonical Tags')
          .defaultOrdering([{ field: 'title', direction: 'asc' }])
      ),
    S.listItem()
      .title('Categories')
      .schemaType('category')
      .child(
        S.documentTypeList('category')
          .title('Categories')
          .defaultOrdering([
            { field: 'priority', direction: 'asc' },
            { field: 'title', direction: 'asc' },
          ])
      ),
    S.listItem()
      .title('Topic Hubs')
      .schemaType('topicHub')
      .child(
        S.documentTypeList('topicHub')
          .title('Topic Hubs')
          .defaultOrdering([
            { field: 'priority', direction: 'asc' },
            { field: 'title', direction: 'asc' },
          ])
      ),
    S.listItem()
      .title('Players')
      .schemaType('player')
      .child(
        S.documentTypeList('player')
          .title('Players')
          .defaultOrdering([{ field: 'name', direction: 'asc' }])
      ),
    S.listItem()
      .title('Authors')
      .schemaType('author')
      .child(
        S.documentTypeList('author')
          .title('Authors')
          .defaultOrdering([{ field: 'name', direction: 'asc' }])
      ),
  ]

  const alreadyHandled = new Set([
    'deepBallReport',
    'headline',
    'fantasyFootball',
    'article',
    'powerRanking',
    'powerRankingWeek',
    'gameCenterSettings',
    'snapCard',
    'playOfWeek',
    'rankings',
    'tag',
    'advancedTag',
    'category',
    'topicHub',
    'player',
    'author',
  ])

  return S.list()
    .title('Content')
    .items([
      // Singletons
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
      S.listItem()
        .title('Homepage Settings')
        .id('homepageSettings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('homepageSettings')
            .documentId('homepageSettings')
        ),
      S.listItem()
        .title('Ad Placements')
        .id('adPlacements')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('adPlacements')
            .documentId('adPlacements')
        ),
      // Removed GameCenter Settings from nav per request; type remains available if referenced elsewhere
      S.divider(),
      ...customOrdered,
      S.divider(),
      // Remaining document types (default behavior)
      ...S.documentTypeListItems().filter((li) => {
        const id = li.getId() || ''
        return !hiddenDocTypes.has(id) && !alreadyHandled.has(id)
      })
    ])
}
