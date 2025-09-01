import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons'

// Custom structure to surface the singleton settings doc & clean grouping
export const structure: StructureResolver = (S) => {
  const hiddenDocTypes = new Set(['homepageSettings'])

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
      .title('Rankings')
      .schemaType('rankings')
      .child(
        S.documentTypeList('rankings')
          .title('Rankings')
          .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
      ),
  ]

  const alreadyHandled = new Set(['headline','fantasyFootball','rankings'])

  return S.list()
    .title('Content')
    .items([
      // Singleton: Homepage Settings
      S.listItem()
        .title('Homepage Settings')
        .id('homepageSettings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('homepageSettings')
            .documentId('homepageSettings')
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
