import { createHash, timingSafeEqual } from "node:crypto";

export type BearerAuthorizationResult =
  | { authorized: true }
  | { authorized: false; status: 401 | 503 };

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function constantTimeEqual(candidate: string, expected: string): boolean {
  return timingSafeEqual(digest(candidate), digest(expected));
}

export function getBearerToken(headers: Headers): string | null {
  const authorization = headers.get("authorization");
  if (!authorization) return null;

  const match = /^Bearer[\t ]+([^\s,]+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

/**
 * Authorize an operational route with one of the explicitly configured
 * secrets. An absent configuration is a service error and always fails closed.
 */
export function authorizeBearerRequest(
  headers: Headers,
  configuredSecrets: ReadonlyArray<string | null | undefined>
): BearerAuthorizationResult {
  const secrets = configuredSecrets
    .map((secret) => secret?.trim() ?? "")
    .filter(Boolean);

  if (secrets.length === 0) {
    return { authorized: false, status: 503 };
  }

  const token = getBearerToken(headers);
  if (!token) {
    return { authorized: false, status: 401 };
  }

  return secrets.some((secret) => constantTimeEqual(token, secret))
    ? { authorized: true }
    : { authorized: false, status: 401 };
}

export function bearerErrorHeaders(status: 401 | 503): HeadersInit {
  if (status === 401) {
    return {
      "Cache-Control": "no-store",
      "WWW-Authenticate": 'Bearer realm="The Snap operations"',
    };
  }

  return { "Cache-Control": "no-store" };
}
