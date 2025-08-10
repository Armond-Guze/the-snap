/**
 * Reusable Badge component for content categorization
 */

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'ranking' | 'breaking' | 'analysis' | 'rumors' | 'injury' | 'draft';
  className?: string;
}

const badgeVariants = {
  default: 'bg-gray-500 text-white',
  ranking: 'bg-yellow-500 text-black',
  breaking: 'bg-red-500 text-white',
  analysis: 'bg-blue-500 text-white',
  rumors: 'bg-purple-500 text-white',
  injury: 'bg-orange-500 text-white',
  draft: 'bg-green-500 text-white',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
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
