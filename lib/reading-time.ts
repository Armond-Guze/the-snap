/**
 * Calculate estimated reading time for text content
 * Average reading speed: 200-250 words per minute
 * We'll use 225 words per minute as a middle ground
 */

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 225;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  // Minimum 1 minute for any content
  return Math.max(1, minutes);
}

/**
 * Extract text content from Sanity block content
 */
export function extractTextFromBlocks(blocks: unknown[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  
  return blocks
    .filter((block): block is Record<string, unknown> => 
      typeof block === 'object' && block !== null && 
      'children' in block && '_type' in block && block._type === 'block'
    )
    .map(block => {
      const children = block.children;
      if (children && Array.isArray(children)) {
        return children
          .filter((child): child is Record<string, unknown> => 
            typeof child === 'object' && child !== null && 
            'text' in child && '_type' in child && child._type === 'span'
          )
          .map(child => String(child.text))
          .join(' ');
      }
      return '';
    })
    .join(' ');
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}
