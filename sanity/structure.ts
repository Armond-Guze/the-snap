import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons'

// Custom structure to surface the singleton settings doc & clean grouping
export const structure: StructureResolver = (S) => {
  const hiddenDocTypes = new Set(['homepageSettings','siteSettings','adPlacements','standings','gameCenterSettings'])

  const customOrdered = [
    S.listItem()
      .title('Headlines')
      .schemaType('headline')
      .child(
        S.documentTypeList('headline')
          .title('Headlines')
          .defaultOrdering([{ field: 'date', direction: 'desc' }])
      ),
    S.listItem()
      .title('Fantasy Football')
      .schemaType('fantasyFootball')
      .child(
        S.documentTypeList('fantasyFootball')
          .title('Fantasy Football')
          .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
      ),
    S.listItem()
      .title('Topic Hubs')
      .schemaType('topicHub')
      .child(
        S.documentTypeList('topicHub')
          .title('Topic Hubs')
          .defaultOrdering([{ field: 'title', direction: 'asc' }])
      ),
    S.listItem()
      .title('Rankings')
      .schemaType('rankings')
      .child(
        S.documentTypeList('rankings')
          .title('Rankings')
          .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
      ),
    // Make Power Rankings doc type explicit in the nav (live current list)
    S.listItem()
      .title('Power Rankings (Live)')
      .schemaType('powerRanking')
      .child(
        S.documentTypeList('powerRanking')
          .title('Power Rankings (Live)')
          .defaultOrdering([{ field: 'rank', direction: 'asc' }])
      ),
    // Weekly historical snapshots
    S.listItem()
      .title('Power Rankings (Week Snapshots)')
      .schemaType('powerRankingWeek')
      .child(
        S.documentTypeList('powerRankingWeek')
          .title('Power Rankings (Week Snapshots)')
          .defaultOrdering([
            { field: 'season', direction: 'desc' },
            { field: 'week', direction: 'desc' },
          ])
      ),
  ]

  const alreadyHandled = new Set(['headline','fantasyFootball','rankings','powerRanking','powerRankingWeek','gameCenterSettings'])

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
      S.listItem()
        .title('GameCenter Settings')
        .schemaType('gameCenterSettings')
        .child(
          S.documentTypeList('gameCenterSettings')
            .title('GameCenter Settings')
            .defaultOrdering([{ field: 'gameId', direction: 'asc' }])
        ),
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
