import type { StructureResolver } from 'sanity/structure'

// Custom structure to surface the singleton settings doc & clean grouping
export const structure: StructureResolver = (S) => {
  const hiddenDocTypes = new Set(['homepageSettings'])

  return S.list()
    .title('Content')
    .items([
      // Singleton: Homepage Settings
      S.listItem()
        .title('Homepage Settings')
        .id('homepageSettings')
        .child(
          S.document()
            .schemaType('homepageSettings')
            .documentId('homepageSettings')
        ),
      S.divider(),
      // All other document types
      ...S.documentTypeListItems().filter((li) => !hiddenDocTypes.has(li.getId() || ''))
    ])
}
