import { describe, expect, it } from "vitest";

import {
  authorizeBearerRequest,
  getBearerToken,
} from "@/lib/security/bearer-auth";
import { resolveSafeRedirectUrl } from "@/lib/security/safe-redirect";
import {
  createNewsletterConfirmationToken,
  createNewsletterUnsubscribeToken,
  createNewsletterUnsubscribeUrl,
  getNewsletterConfirmationTokenDigest,
  normalizeNewsletterEmail,
  verifyNewsletterUnsubscribeToken,
} from "@/lib/newsletter/security";

describe("security helpers", () => {
  it("keeps safe redirects on the configured origin", () => {
    const base = "https://thegamesnap.com";

    expect(resolveSafeRedirectUrl("/articles/example?source=test", base).toString()).toBe(
      "https://thegamesnap.com/articles/example?source=test"
    );
    expect(resolveSafeRedirectUrl("//evil.example/path", base).pathname).toBe("/");
    expect(resolveSafeRedirectUrl("/\\evil.example/path", base).pathname).toBe("/");
    expect(resolveSafeRedirectUrl("https://evil.example/path", base).pathname).toBe("/");
  });

  it("fails bearer authorization closed and requires an exact token", () => {
    expect(authorizeBearerRequest(new Headers(), [])).toEqual({
      authorized: false,
      status: 503,
    });
    expect(authorizeBearerRequest(new Headers(), ["expected"])).toEqual({
      authorized: false,
      status: 401,
    });
    expect(
      authorizeBearerRequest(new Headers({ authorization: "Bearer wrong" }), ["expected"])
    ).toEqual({ authorized: false, status: 401 });
    expect(
      authorizeBearerRequest(new Headers({ authorization: "bearer expected" }), ["expected"])
    ).toEqual({ authorized: true });
    expect(getBearerToken(new Headers({ authorization: "Bearer one,two" }))).toBeNull();
  });

  it("normalizes newsletter addresses and rejects malformed addresses", () => {
    expect(normalizeNewsletterEmail(" Fan+News@Example.COM ")).toBe("fan+news@example.com");
    expect(normalizeNewsletterEmail("missing-domain@example")).toBeNull();
    expect(normalizeNewsletterEmail("two..dots@example.com")).toBeNull();
    expect(normalizeNewsletterEmail("header\r\n@example.com")).toBeNull();
  });

  it("creates opaque confirmation challenges", () => {
    const secret = "a-secure-test-secret-that-is-at-least-32-bytes";
    const token = createNewsletterConfirmationToken();
    const digest = getNewsletterConfirmationTokenDigest(token, secret);

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain(token);
    expect(getNewsletterConfirmationTokenDigest(`${token}x`, secret)).toBeNull();
  });

  it("signs unsubscribe tokens and rejects tampering", () => {
    const secret = "a-secure-test-secret-that-is-at-least-32-bytes";
    const subscriberId = "2b080574-31df-4b6f-9b87-40850a137a76";
    const token = createNewsletterUnsubscribeToken(subscriberId, secret);

    expect(verifyNewsletterUnsubscribeToken(token, secret)).toBe(subscriberId);
    expect(verifyNewsletterUnsubscribeToken(`${token.slice(0, -1)}x`, secret)).toBeNull();
    expect(verifyNewsletterUnsubscribeToken(token, `${secret}-different`)).toBeNull();
    expect(token).not.toContain("@");
    expect(
      createNewsletterUnsubscribeUrl(subscriberId, secret, "https://thegamesnap.com").pathname
    ).toBe("/api/newsletter/unsubscribe");
  });
});
