"use client";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TIMEZONE_CODES } from '@/lib/schedule-format';
import { useState, useTransition, useEffect } from 'react';

export default function TimezoneClient() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initial = (search.get('tz') || 'ET').toUpperCase();
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // keep in sync if nav changes externally
    if (initial !== value) setValue(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tz = e.target.value;
    setValue(tz);
    const params = new URLSearchParams(search.toString());
    if (tz === 'ET') params.delete('tz'); else params.set('tz', tz);
    startTransition(() => {
      router.replace(pathname + (params.size ? `?${params.toString()}` : ''));
      // lightweight cookie for persistence (30d)
      document.cookie = `pref_tz=${tz};path=/;max-age=${60 * 60 * 24 * 30}`;
    });
  }

  return (
    <label className="text-xs text-white/60 flex items-center gap-2 mb-4">
      <span>Timezone:</span>
      <select value={value} onChange={onChange} className="bg-black/40 border border-white/20 rounded px-2 py-1 text-white text-xs">
        {TIMEZONE_CODES.map(code => <option key={code} value={code}>{code}</option>)}
      </select>
    </label>
  );
}
