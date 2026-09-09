"use client";

import { useSyncExternalStore } from "react";

export type ConsentChoice = "accepted" | "rejected" | null;
export type ConsentPreferences = {
  version: string;
  analytics: boolean;
  advertising: boolean;
  externalMedia: boolean;
  updatedAt: string;
};

export const CONSENT_POLICY_VERSION = "2026-08-09.2";
export const CONSENT_STORAGE_KEY = "cookie_consent_preferences";
export const CONSENT_ANALYTICS_COOKIE = "cookie_consent";
export const CONSENT_UPDATED_EVENT = "cookie-consent-updated";
export const CONSENT_OPEN_EVENT = "cookie-consent-open";

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
let cachedSnapshotKey = "";
let cachedSnapshot: ConsentPreferences | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!match) return null;
  const raw = match.slice(prefix.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

function normalizePreferences(value: unknown): ConsentPreferences | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    record.version !== CONSENT_POLICY_VERSION ||
    typeof record.analytics !== "boolean" ||
    typeof record.advertising !== "boolean" ||
    typeof record.externalMedia !== "boolean" ||
    typeof record.updatedAt !== "string" ||
    Number.isNaN(Date.parse(record.updatedAt))
  ) {
    return null;
  }
  return {
    version: CONSENT_POLICY_VERSION,
    analytics: record.analytics,
    advertising: record.advertising,
    externalMedia: record.externalMedia,
    updatedAt: record.updatedAt,
  };
}

function parseStoredPreferences(value: string | null): ConsentPreferences | null {
  if (!value) return null;
  try {
    return normalizePreferences(JSON.parse(value));
  } catch {
    return null;
  }
}

function parsePreferenceCookie(value: string | null): ConsentPreferences | null {
  if (!value) return null;
  const [version, bits, timestamp] = value.split("|");
  if (
    version !== CONSENT_POLICY_VERSION ||
    !/^[01]{3}$/.test(bits || "") ||
    !/^\d{10,16}$/.test(timestamp || "")
  ) {
    return null;
  }
  const updatedAt = new Date(Number(timestamp)).toISOString();
  return normalizePreferences({
    version,
    analytics: bits[0] === "1",
    advertising: bits[1] === "1",
    externalMedia: bits[2] === "1",
    updatedAt,
  });
}

function globalPrivacyControlEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function readConsentPreferences(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  let localValue: string | null = null;
  try {
    localValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    // Fall through to the cookie copy.
  }
  const cookieValue = readCookie(CONSENT_STORAGE_KEY);
  const parsed = parseStoredPreferences(localValue) || parsePreferenceCookie(cookieValue);
  const gpc = globalPrivacyControlEnabled();
  const snapshotKey = `${localValue || ""}\0${cookieValue || ""}\0${gpc ? "1" : "0"}`;
  if (snapshotKey === cachedSnapshotKey) return cachedSnapshot;

  cachedSnapshotKey = snapshotKey;
  cachedSnapshot = parsed
    ? {
        ...parsed,
        advertising: gpc ? false : parsed.advertising,
      }
    : null;
  return cachedSnapshot;
}

export function readConsentChoice(): ConsentChoice {
  const preferences = readConsentPreferences();
  if (!preferences) return null;
  return preferences.analytics || preferences.advertising || preferences.externalMedia
    ? "accepted"
    : "rejected";
}

function updateGoogleConsent(preferences: ConsentPreferences) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const adsGranted = ADS_ENABLED && preferences.advertising ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: preferences.analytics ? "granted" : "denied",
    ad_storage: adsGranted,
    ad_user_data: adsGranted,
    ad_personalization: adsGranted,
  });
}

export function writeConsentPreferences(
  choices: Pick<ConsentPreferences, "analytics" | "advertising" | "externalMedia">
) {
  if (typeof window === "undefined") return;
  const preferences: ConsentPreferences = {
    version: CONSENT_POLICY_VERSION,
    analytics: choices.analytics,
    advertising: globalPrivacyControlEnabled() ? false : choices.advertising,
    externalMedia: choices.externalMedia,
    updatedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(preferences);
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  } catch {
    // The cookie remains the cross-page fallback when storage is unavailable.
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = 60 * 60 * 24 * 180;
  const preferenceCookie = `${CONSENT_POLICY_VERSION}|${preferences.analytics ? 1 : 0}${preferences.advertising ? 1 : 0}${preferences.externalMedia ? 1 : 0}|${Date.now()}`;
  document.cookie = `${CONSENT_STORAGE_KEY}=${encodeURIComponent(preferenceCookie)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  // Keep the compact analytics cookie for server-side consent enforcement.
  document.cookie = `${CONSENT_ANALYTICS_COOKIE}=${preferences.analytics ? "accepted" : "rejected"}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  if (preferences.analytics) {
    try {
      window.localStorage.removeItem("va-exclude");
    } catch {
      // The exclusion cookie is still cleared below.
    }
    document.cookie = "va-exclude=; Path=/; Max-Age=0; SameSite=Lax";
    window.dispatchEvent(new Event("analytics-exclusion-updated"));
  }
  cachedSnapshotKey = "";
  updateGoogleConsent(preferences);
  window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: { preferences } }));
}

export function writeConsentChoice(choice: Exclude<ConsentChoice, null>) {
  const enabled = choice === "accepted";
  writeConsentPreferences({
    analytics: enabled,
    advertising: enabled,
    externalMedia: enabled,
  });
}

export function openConsentPreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
  }
}

function subscribeToConsent(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) {
      cachedSnapshotKey = "";
      onStoreChange();
    }
  };
  const onConsentUpdated = () => {
    cachedSnapshotKey = "";
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
  };
}

export function useConsentPreferences() {
  return useSyncExternalStore(subscribeToConsent, readConsentPreferences, () => null);
}

export function useConsentChoice() {
  return useSyncExternalStore(subscribeToConsent, readConsentChoice, () => null);
}
