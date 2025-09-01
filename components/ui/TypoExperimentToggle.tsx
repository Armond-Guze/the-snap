"use client";
import { useState, useEffect } from 'react';

/**
 * Simple client component that toggles data-test="typoB" on <body> to enable
 * the experimental tighter typography scale for A/B testing.
 * Persists choice in localStorage for session continuity.
 */
export function TypoExperimentToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('typoB');
    if (stored === '1') {
      setEnabled(true);
      document.documentElement.setAttribute('data-test', (document.documentElement.getAttribute('data-test') || '') + ' typoB');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const current = root.getAttribute('data-test') || '';
    if (enabled) {
      if (!current.includes('typoB')) root.setAttribute('data-test', (current + ' typoB').trim());
      localStorage.setItem('typoB', '1');
    } else {
      if (current.includes('typoB')) root.setAttribute('data-test', current.replace(/\btypoB\b/, '').trim());
      localStorage.removeItem('typoB');
    }
  }, [enabled]);

  return (
    <button
      type="button"
      onClick={() => setEnabled(v => !v)}
      className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-md text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm text-white"
    >
      Typography: {enabled ? 'Variant B' : 'Default'}
    </button>
  );
}
