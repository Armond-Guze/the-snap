"use client";

import { useEffect, useState, useCallback } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

export interface TOCHeading {
  id: string;
  text: string;
  level: number; // 2,3,4
}

interface TableOfContentsProps {
  headings: TOCHeading[];
  className?: string;
  collapseAt?: number; // px breakpoint for auto-collapse on small
}

export default function TableOfContents({ headings, className = '', collapseAt = 1024 }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Manage auto collapse based on window size
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsCollapsed(window.innerWidth < collapseAt);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapseAt]);

  const observe = useCallback(() => {
    if (!isClient || !headings.length) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px', // middle-ish of viewport
        threshold: [0, 1],
      }
    );
    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings, isClient]);

  useEffect(() => {
    const cleanup = observe();
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [observe]);

  if (!headings.length) return null;

  return (
    <nav aria-label="Table of contents" className={`text-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-semibold tracking-wide text-gray-200">
          <List className="h-4 w-4" />
          On this page
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(c => !c)}
          className="p-1 rounded hover:bg-white/5 text-gray-400"
          aria-expanded={!isCollapsed ? 'true' : 'false'}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {!isCollapsed && (
        <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          {headings.map(h => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={
                  `block py-1 px-2 rounded transition-colors leading-snug hover:text-white hover:bg-white/5 ${
                    activeId === h.id ? 'bg-white/10 text-white' : 'text-gray-400'
                  } ${h.level === 3 ? 'ml-3' : ''} ${h.level === 4 ? 'ml-6 text-[0.8rem]' : ''}`
                }
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}