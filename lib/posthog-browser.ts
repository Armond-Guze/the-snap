"use client";

type PostHogModule = typeof import("posthog-js");
type PostHogClient = PostHogModule["default"];

declare global {
  interface Window {
    __theSnapPosthogInitialized?: boolean;
  }
}

const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_API_HOST = "/ingest";
const POSTHOG_UI_HOST = "https://us.posthog.com";

let posthogPromise: Promise<PostHogClient | null> | null = null;

function hasCookie(name: string, expectedValue?: string) {
  if (typeof document === "undefined") return false;

  return document.cookie.split(";").some((entry) => {
    const trimmed = entry.trim();
    if (expectedValue === undefined) {
      return trimmed.startsWith(`${name}=`);
    }
    return trimmed === `${name}=${expectedValue}`;
  });
}

function hasLocalStorageValue(key: string, expectedValue?: string) {
  if (typeof window === "undefined") return false;

  try {
    const value = window.localStorage.getItem(key);
    return expectedValue === undefined ? value !== null : value === expectedValue;
  } catch {
    return false;
  }
}

export function hasAnalyticsConsent() {
  return hasCookie("cookie_consent", "1") || hasLocalStorageValue("cookie_consent", "1");
}

export function isAnalyticsExcluded() {
  return hasCookie("va-exclude", "1") || hasLocalStorageValue("va-exclude", "1");
}

function canLoadPostHog() {
  return Boolean(
    typeof window !== "undefined" &&
      POSTHOG_TOKEN &&
      hasAnalyticsConsent() &&
      !isAnalyticsExcluded()
  );
}

async function getPosthogClient() {
  if (!canLoadPostHog()) {
    return null;
  }

  if (!posthogPromise) {
    posthogPromise = import("posthog-js").then(({ default: posthog }) => {
      if (!window.__theSnapPosthogInitialized) {
        posthog.init(POSTHOG_TOKEN!, {
          api_host: POSTHOG_API_HOST,
          ui_host: POSTHOG_UI_HOST,
          defaults: "2026-01-30",
          capture_exceptions: true,
          debug: process.env.NODE_ENV === "development",
        });
        window.__theSnapPosthogInitialized = true;
      }

      return posthog;
    });
  }

  const posthog = await posthogPromise;
  posthog?.opt_in_capturing();
  return posthog;
}

export async function ensurePosthog() {
  return getPosthogClient();
}

export async function disablePosthog() {
  if (typeof window === "undefined" || !window.__theSnapPosthogInitialized) {
    return;
  }

  const { default: posthog } = await import("posthog-js");
  posthog.opt_out_capturing();
}

export async function capturePosthogEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  const posthog = await getPosthogClient();
  posthog?.capture(eventName, properties);
}

export async function capturePosthogException(
  error: Error,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  const posthog = await getPosthogClient();
  posthog?.captureException(error, properties);
}
