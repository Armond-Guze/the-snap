import { useEffect } from 'react';

export function useViewTracking(articleId: string, title?: string) {
  useEffect(() => {
    // View tracking logic can be implemented here
    // For now, this is a placeholder
    console.log(`Tracking view for article: ${articleId}`, title);
  }, [articleId, title]);
}

export default useViewTracking;