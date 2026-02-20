import type { AuthRateLimitPolicy } from "@/lib/security/auth-rate-limit";

export const AUTH_RATE_LIMIT_POLICIES: Record<string, AuthRateLimitPolicy> = {
  PROFILE_READ: {
    scope: "auth:profile:read",
    limit: 180,
    windowSeconds: 60,
    blockSeconds: 120,
  },
  PROFILE_WRITE: {
    scope: "auth:profile:write",
    limit: 30,
    windowSeconds: 60,
    blockSeconds: 300,
  },
  FOLLOWS_READ: {
    scope: "auth:follows:read",
    limit: 120,
    windowSeconds: 60,
    blockSeconds: 120,
  },
  FOLLOWS_WRITE: {
    scope: "auth:follows:write",
    limit: 20,
    windowSeconds: 60,
    blockSeconds: 300,
  },
  SUBSCRIPTIONS_READ: {
    scope: "auth:subscriptions:read",
    limit: 120,
    windowSeconds: 60,
    blockSeconds: 120,
  },
  SUBSCRIPTIONS_WRITE: {
    scope: "auth:subscriptions:write",
    limit: 20,
    windowSeconds: 60,
    blockSeconds: 300,
  },
};
