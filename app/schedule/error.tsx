"use client";
import { useEffect } from 'react';

export default function ScheduleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Schedule route error', error);
  }, [error]);
  return (
    <div className="max-w-xl mx-auto py-20 text-center text-neutral-900 px-4">
      <h1 className="text-2xl font-bold mb-4">Schedule Unavailable</h1>
  <p className="text-neutral-600 mb-6">We couldn&apos;t load the schedule right now. This can happen if the live source rate-limits or is temporarily down.</p>
      <button onClick={reset} className="px-4 py-2 rounded-md bg-white text-black font-semibold hover:bg-neutral-50">Try Again</button>
    </div>
  );
}
