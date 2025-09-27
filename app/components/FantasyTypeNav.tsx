"use client";
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

interface FantasyTypeNavProps {
  types: string[]; // raw type values (e.g. "start-sit")
  scrollMarginTop?: number;
  className?: string;
}

const LABEL_MAP: Record<string, string> = {
  "start-sit": "Start / Sit",
  "waiver-wire": "Waiver Wire",
  "week-preview": "Week Preview",
  "player-analysis": "Player Analysis",
  "trade-analysis": "Trade Analysis",
  "injury-report": "Injury Report",
  "draft-strategy": "Draft Strategy",
  "general-tips": "General Tips"
};

export default function FantasyTypeNav({ types, scrollMarginTop = 110, className }: FantasyTypeNavProps) {
  const [active, setActive] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headings = types
      .map(t => document.getElementById(`type-${t}`))
      .filter(Boolean) as HTMLElement[];

    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActive(entry.target.id.replace("type-", ""));
          }
        });
      },
      {
        rootMargin: `-${scrollMarginTop}px 0px -60% 0px`,
        threshold: [0, 0.25, 0.5]
      }
    );

    headings.forEach(h => observerRef.current?.observe(h));
    return () => observerRef.current?.disconnect();
  }, [types, scrollMarginTop]);

  if (!types.length) return null;

  return (
    <nav aria-label="Fantasy Types" className={clsx("sticky top-[68px] z-30 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 rounded-full px-3 py-2 border border-white/10 shadow-lg overflow-x-auto flex gap-1 no-scrollbar", className)}>
      {types.map(type => {
        const label = LABEL_MAP[type] || type.replace(/-/g, " ");
        const isActive = active === type;
        return (
          <a
            key={type}
            href={`#type-${type}`}
            className={clsx(
              "group relative whitespace-nowrap text-[11px] md:text-xs font-semibold tracking-wide px-3 md:px-4 py-1.5 rounded-full transition-colors border",
              isActive
                ? "bg-white text-black border-white shadow-inner"
                : "bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border-white/10"
            )}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
