"use client";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { TEAM_ABBRS, TEAM_META } from '@/lib/schedule';
import { useTransition } from 'react';

export default function TeamFilterClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const active = params.get('team')?.toUpperCase() || '';

  function toggle(abbr: string) {
    const next = new URLSearchParams(params.toString());
    if (active === abbr) next.delete('team'); else next.set('team', abbr);
    startTransition(() => {
      router.replace(pathname + (next.toString() ? `?${next.toString()}` : ''));
    });
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 max-h-40 overflow-auto border border-white/10 rounded-lg p-2 bg-white/5">
        {TEAM_ABBRS.map(abbr => {
          const isActive = abbr === active;
          return (
            <button
              key={abbr}
              onClick={() => toggle(abbr)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors border ${isActive ? 'bg-white text-black border-white' : 'bg-white/10 text-white/70 border-white/10 hover:text-white hover:bg-white/15'}`}
            >
              <span className="w-4 h-4 relative inline-block">
                <Image src={TEAM_META[abbr].logo} alt={abbr} fill sizes="16px" className="object-contain" />
              </span>
              {abbr}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] mt-2 text-white/40 flex items-center gap-2">
        {active ? <>
          Filtering by {active}. <button onClick={()=>toggle(active)} className="underline underline-offset-2 hover:text-white">Clear</button>
        </> : 'Click a team to filter this week.'}
        {pending && <span className="text-amber-400 animate-pulse">Updating…</span>}
      </p>
    </div>
  );
}
