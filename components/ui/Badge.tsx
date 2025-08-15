/**
 * Reusable Badge component for content categorization
 */

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'ranking' | 'breaking' | 'analysis' | 'rumors' | 'injury' | 'draft';
  className?: string;
}

// Neutral (dark) palette variants – removes bright brand colors for a unified look
const badgeVariants = {
  default: 'bg-gray-800 text-gray-300 border border-gray-700/70',
  ranking: 'bg-gray-800 text-gray-200 border border-gray-600/60',
  breaking: 'bg-gray-800 text-gray-300 border border-gray-700/70',
  analysis: 'bg-gray-800 text-gray-300 border border-gray-700/70',
  rumors: 'bg-gray-800 text-gray-300 border border-gray-700/70',
  injury: 'bg-gray-800 text-gray-300 border border-gray-700/70',
  draft: 'bg-gray-800 text-gray-300 border border-gray-700/70',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Content-specific badge that automatically determines styling
 */
interface ContentBadgeProps {
  contentType: 'article' | 'ranking';
  category?: string;
  week?: number;
  className?: string;
}

export function ContentBadge({ contentType, category, week, className }: ContentBadgeProps) {
  if (contentType === 'ranking') {
    return (
      <Badge variant="ranking" className={className}>
        {week ? `Week ${week} Rankings` : 'Rankings'}
      </Badge>
    );
  }

  // Map category slugs to badge variants
  const categoryVariantMap: Record<string, keyof typeof badgeVariants> = {
    'breaking-news': 'breaking',
    'analysis': 'analysis',
    'rumors': 'rumors',
    'injury-report': 'injury',
    'draft': 'draft',
  };

  const variant = category ? categoryVariantMap[category] || 'default' : 'default';
  const displayText = category ? category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Article';

  return (
    <Badge variant={variant} className={className}>
      {displayText}
    </Badge>
  );
}
