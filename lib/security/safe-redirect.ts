/** Resolve a user-provided path without allowing another origin. */
export function resolveSafeRedirectUrl(
  candidate: string | null | undefined,
  baseUrl: string | URL,
  fallbackPath = "/"
): URL {
  const base = new URL(baseUrl);
  const fallback = new URL(fallbackPath, base);
  const value = candidate?.trim();

  // Backslashes are treated as slashes by URL parsers and can turn `/\\host`
  // into a protocol-relative redirect. Only permit conventional absolute paths.
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const resolved = new URL(value, base);
    return resolved.origin === base.origin ? resolved : fallback;
  } catch {
    return fallback;
  }
}
