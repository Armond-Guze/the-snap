'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex w-full min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[11px] text-gray-500 ${className}`}
    >
      {/* Home Link */}
      <Link
        href="/"
        className="flex items-center hover:text-gray-300 transition-colors"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5 shrink-0" />
      </Link>

      {items.map((item, index) => (
        <div
          key={index}
          className={`flex items-center gap-1 ${index === items.length - 1 ? 'min-w-0 flex-1' : 'shrink-0'}`}
        >
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          {item.href ? (
            <Link
              href={item.href}
              className={`hover:text-gray-300 transition-colors ${index === items.length - 1 ? 'truncate' : ''}`}
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="truncate font-medium text-gray-400"
              aria-current="page"
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
