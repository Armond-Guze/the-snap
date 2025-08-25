"use client";

import { useEffect, useState } from 'react';
import ReadingProgressBar from './ReadingProgressBar';
import SocialShare from './SocialShare';
import TableOfContents, { TOCHeading } from './TableOfContents';

interface ArticleViewWrapperProps {
  children: React.ReactNode;
  headings: TOCHeading[];
  shareUrl: string;
  title: string;
  category?: string;
}

export default function ArticleViewWrapper({ children, headings, shareUrl, title }: ArticleViewWrapperProps) {
  const [showFloatingShare, setShowFloatingShare] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const threshold = window.innerHeight * 0.25;
      setShowFloatingShare(scrolled > threshold);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative">
      <ReadingProgressBar className="h-1 bg-transparent" />
      <div className="px-6 md:px-10 lg:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 xl:col-span-9 min-w-0">
          {children}
        </div>
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 pt-4 space-y-10 sticky top-24 h-max">
          <TableOfContents headings={headings} />
          {/* Placeholder for future modules (related, ads, next up, newsletter) */}
        </aside>
      </div>
      {showFloatingShare && (
        <SocialShare
          url={shareUrl}
            title={title}
          variant="floating"
          className="hidden xl:block"
        />
      )}
    </div>
  );
}