"use client";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { normalizeTimezoneCode, TIMEZONE_CODES } from '@/lib/schedule-format';
import { useTransition } from 'react';

export default function TimezoneClient() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initial = normalizeTimezoneCode(search.get('tz') || undefined);
  const [, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tz = e.target.value;
    const params = new URLSearchParams(search.toString());
    if (tz === 'ET') params.delete('tz'); else params.set('tz', tz);
    startTransition(() => {
      router.replace(pathname + (params.size ? `?${params.toString()}` : ''));
      // lightweight cookie for persistence (30d)
      document.cookie = `pref_tz=${tz};path=/;max-age=${60 * 60 * 24 * 30}`;
    });
  }

  return (
    <label className="text-xs text-neutral-600 flex items-center gap-2 mb-4">
      <span>Timezone:</span>
      <select value={initial} onChange={onChange} className="bg-white border border-neutral-200 rounded px-2 py-1 text-neutral-900 text-xs">
        {TIMEZONE_CODES.map(code => <option key={code} value={code}>{code}</option>)}
      </select>
    </label>
  );
}
