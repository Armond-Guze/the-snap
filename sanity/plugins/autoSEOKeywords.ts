// Sanity Studio plugin for auto-generating SEO keywords
// Place this in your Sanity Studio configuration

import { definePlugin } from 'sanity';
import { generateSEOKeywords } from '../../lib/seo-keywords';

export const autoSEOKeywords = definePlugin({
  name: 'auto-seo-keywords',
  document: {
    actions: (prev, { schemaType }) => {
      if (schemaType !== 'headline') return prev;

      return [
        {
          label: 'Generate SEO Keywords',
          icon: () => '🔍',
          onHandle: async ({ draft, published }) => {
            const doc = draft || published;
            if (!doc) return;

            const { title, tags, category } = doc;
            
            // Get category title if it's a reference
            let categoryTitle = '';
            if (category && category._ref) {
              // In a real implementation, you'd fetch the category title
              // For now, we'll use a placeholder
              categoryTitle = 'Headlines'; // Default category
            }

            const { focusKeyword, additionalKeywords } = generateSEOKeywords(
              tags || [],
              categoryTitle,
              title || ''
            );

            // Update the document with generated keywords
            return {
              type: 'PATCH',
              patch: {
                set: {
                  'seo.focusKeyword': focusKeyword,
                  'seo.additionalKeywords': additionalKeywords
                }
              }
            };
          }
        },
        ...prev
      ];
    }
  }
});

// Alternative: Auto-generate on field changes
export const autoSEOKeywordsHook = {
  // This would be used in the Sanity Studio configuration
  // to auto-generate keywords when tags or category changes
  
  onFieldChange: (fieldName: string, fieldValue: any, document: any) => {
    if (fieldName === 'tags' || fieldName === 'category' || fieldName === 'title') {
      const { title, tags, category } = document;
      
      // Get category title (simplified for example)
      const categoryTitle = category?.title || 'Headlines';
      
      const { focusKeyword, additionalKeywords } = generateSEOKeywords(
        tags || [],
        categoryTitle,
        title || ''
      );
      
      return {
        'seo.focusKeyword': focusKeyword,
        'seo.additionalKeywords': additionalKeywords
      };
    }
    
    return {};
  }
};
