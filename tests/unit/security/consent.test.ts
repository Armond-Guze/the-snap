import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CONSENT_POLICY_VERSION,
  readConsentPreferences,
} from '@/app/components/consent';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('consent storage', () => {
  it('fails closed when a malformed cookie cannot be decoded', () => {
    vi.stubGlobal('window', {
      localStorage: { getItem: () => { throw new Error('blocked'); } },
    });
    vi.stubGlobal('document', { cookie: 'cookie_consent_preferences=%' });
    vi.stubGlobal('navigator', {});

    expect(() => readConsentPreferences()).not.toThrow();
    expect(readConsentPreferences()).toBeNull();
  });

  it('accepts only the current, granular policy version', () => {
    const current = JSON.stringify({
      version: CONSENT_POLICY_VERSION,
      analytics: true,
      advertising: false,
      externalMedia: false,
      updatedAt: '2026-08-09T12:00:00.000Z',
    });
    vi.stubGlobal('window', { localStorage: { getItem: () => current } });
    vi.stubGlobal('document', { cookie: '' });
    vi.stubGlobal('navigator', {});

    expect(readConsentPreferences()).toMatchObject({
      analytics: true,
      advertising: false,
      externalMedia: false,
    });
  });
});
