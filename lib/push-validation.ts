export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash &&
      [
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
export function validPushKeys(
  keys: unknown,
): keys is { p256dh: string; auth: string } {
  if (!keys || typeof keys !== "object") return false;
  const value = keys as Record<string, unknown>;
  return (
    typeof value.p256dh === "string" &&
    /^[A-Za-z0-9_-]{87}=?$/.test(value.p256dh) &&
    typeof value.auth === "string" &&
    /^[A-Za-z0-9_-]{22}={0,2}$/.test(value.auth)
  );
}
