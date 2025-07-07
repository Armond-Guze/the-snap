// Date utility functions for safe date formatting

/**
 * Safely formats a date string to avoid "Invalid Date" errors
 * @param dateString - The date string to format
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string or fallback text
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
  fallback: string = 'No date'
): string {
  if (!dateString) {
    return fallback;
  }

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
}

/**
 * Formats a date for article displays with consistent styling
 * @param dateString - The date string to format
 * @returns Formatted date string for articles
 */
export function formatArticleDate(dateString: string | null | undefined): string {
  return formatDate(dateString, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date for compact displays (no year if current year)
 * @param dateString - The date string to format
 * @returns Formatted date string for compact displays
 */
export function formatCompactDate(dateString: string | null | undefined): string {
  const currentYear = new Date().getFullYear();
  
  if (!dateString) {
    return 'No date';
  }

  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'No date';
    }
    
    const dateYear = date.getFullYear();
    
    if (dateYear === currentYear) {
      return formatDate(dateString, {
        month: 'short',
        day: 'numeric',
      });
    }
    
    return formatDate(dateString, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.warn('Compact date formatting error:', error);
    return 'No date';
  }
}

/**
 * Formats a date for detailed displays with full month name
 * @param dateString - The date string to format
 * @returns Formatted date string for detailed displays
 */
export function formatDetailedDate(dateString: string | null | undefined): string {
  return formatDate(dateString, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Checks if a date string is valid
 * @param dateString - The date string to validate
 * @returns True if the date is valid, false otherwise
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Gets a relative time string (e.g., "2 days ago")
 * @param dateString - The date string to format
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString || !isValidDate(dateString)) {
    return 'Unknown time';
  }
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}
