"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface Props {
  currentWeek: number; // 1..18
  className?: string;
  showAutoWeekLink?: boolean; // optionally render an "Auto Week" link beside the dropdown
}

// A small, accessible Week selector mirroring NFL.com's UX using a native <select>.
// Navigates to /schedule/week/[n]. Optionally renders an "Auto Week" link.
export default function WeekDropdown({ currentWeek, className = "", showAutoWeekLink }: Props) {
  const router = useRouter();

  const weeks = useMemo(() => Array.from({ length: 18 }, (_, i) => i + 1), []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const w = Number(e.target.value);
    if (!Number.isFinite(w) || w < 1 || w > 18) return;
    // If we're already on /schedule/week/[n] or /schedule, push to the selected week
    router.push(`/schedule/week/${w}`);
  }

  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      <label htmlFor="week-select" className="text-sm text-white/70">Week</label>
      <select
        id="week-select"
        value={String(currentWeek)}
        onChange={onChange}
        className="min-w-[128px] bg-white text-black text-sm border border-white/20 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20"
      >
        {weeks.map((w) => (
          <option key={w} value={w} className="text-black bg-white">{`WEEK ${w}`}</option>
        ))}
      </select>

      {showAutoWeekLink ? (
        <a
          href="/schedule"
          className="ml-auto text-xs text-white/50 hover:text-white/80 underline-offset-2 hover:underline"
        >
          Auto Week
        </a>
      ) : null}
    </div>
  );
}
