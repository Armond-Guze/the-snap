import "server-only";

import { db } from "@/lib/db";
import { emitMonitoringAlert } from "@/lib/monitoring/alerts";

export interface AuthRateLimitPolicy {
  scope: string;
  limit: number;
  windowSeconds: number;
  blockSeconds: number;
}

interface AuthRateLimitInput extends AuthRateLimitPolicy {
  identifier: string;
}

export interface AuthRateLimitResult {
  allowed: boolean;
  blocked: boolean;
  limit: number;
  remaining: number;
  currentCount: number;
  resetAt: string;
  retryAfterSeconds: number;
}

function getWindowStart(date: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  const startMs = Math.floor(date.getTime() / windowMs) * windowMs;
  return new Date(startMs);
}

function getWindowEnd(windowStart: Date, windowSeconds: number): Date {
  return new Date(windowStart.getTime() + windowSeconds * 1000);
}

function getSecondsUntil(target: Date, now: Date): number {
  const delta = Math.ceil((target.getTime() - now.getTime()) / 1000);
  return delta > 0 ? delta : 0;
}

export function getRateLimitIdentifier(headers: Headers, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  if (ip) {
    return `ip:${ip}`;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return `ip:${realIp}`;
  }

  return "ip:unknown";
}

export function getRateLimitHeaders(result: AuthRateLimitResult): Record<string, string> {
  const resetEpochSeconds = Math.floor(new Date(result.resetAt).getTime() / 1000);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(resetEpochSeconds),
  };

  if (result.blocked) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export async function checkAuthRateLimit(input: AuthRateLimitInput): Promise<AuthRateLimitResult> {
  const now = new Date();
  const windowStart = getWindowStart(now, input.windowSeconds);
  const windowEnd = getWindowEnd(windowStart, input.windowSeconds);
  const blockEnd = new Date(now.getTime() + input.blockSeconds * 1000);
  let state:
    | {
        allowed: boolean;
        blocked: boolean;
        currentCount: number;
        resetAt: Date;
        retryAfterSeconds: number;
        newlyBlocked: boolean;
      }
    | null = null;

  try {
    state = await db.$transaction(async (tx) => {
      const existing = await tx.authRateLimitState.findUnique({
        where: {
          scope_identifier: {
            scope: input.scope,
            identifier: input.identifier,
          },
        },
      });

      if (!existing) {
        await tx.authRateLimitState.create({
          data: {
            scope: input.scope,
            identifier: input.identifier,
            windowStart,
            windowEndsAt: windowEnd,
            requestCount: 1,
          },
        });

        return {
          allowed: true,
          blocked: false,
          currentCount: 1,
          resetAt: windowEnd,
          retryAfterSeconds: 0,
          newlyBlocked: false,
        };
      }

      if (existing.blockedUntil && existing.blockedUntil > now) {
        return {
          allowed: false,
          blocked: true,
          currentCount: existing.requestCount,
          resetAt: existing.blockedUntil,
          retryAfterSeconds: getSecondsUntil(existing.blockedUntil, now),
          newlyBlocked: false,
        };
      }

      const sameWindow = existing.windowStart.getTime() === windowStart.getTime();

      if (!sameWindow) {
        await tx.authRateLimitState.update({
          where: {
            scope_identifier: {
              scope: input.scope,
              identifier: input.identifier,
            },
          },
          data: {
            windowStart,
            windowEndsAt: windowEnd,
            requestCount: 1,
            blockedUntil: null,
          },
        });

        return {
          allowed: true,
          blocked: false,
          currentCount: 1,
          resetAt: windowEnd,
          retryAfterSeconds: 0,
          newlyBlocked: false,
        };
      }

      const nextCount = existing.requestCount + 1;

      if (nextCount > input.limit) {
        await tx.authRateLimitState.update({
          where: {
            scope_identifier: {
              scope: input.scope,
              identifier: input.identifier,
            },
          },
          data: {
            requestCount: nextCount,
            blockedUntil: blockEnd,
          },
        });

        return {
          allowed: false,
          blocked: true,
          currentCount: nextCount,
          resetAt: blockEnd,
          retryAfterSeconds: getSecondsUntil(blockEnd, now),
          newlyBlocked: true,
        };
      }

      await tx.authRateLimitState.update({
        where: {
          scope_identifier: {
            scope: input.scope,
            identifier: input.identifier,
          },
        },
        data: {
          requestCount: nextCount,
        },
      });

      return {
        allowed: true,
        blocked: false,
        currentCount: nextCount,
        resetAt: existing.windowEndsAt,
        retryAfterSeconds: 0,
        newlyBlocked: false,
      };
    });
  } catch (error) {
    await emitMonitoringAlert({
      source: "auth-rate-limit",
      code: "AUTH_RATE_LIMIT_CHECK_FAILED",
      severity: "error",
      message: "Rate limit check failed; allowing request",
      context: {
        scope: input.scope,
        identifier: input.identifier,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      allowed: true,
      blocked: false,
      limit: input.limit,
      remaining: input.limit,
      currentCount: 0,
      resetAt: windowEnd.toISOString(),
      retryAfterSeconds: 0,
    };
  }

  if (!state) {
    return {
      allowed: true,
      blocked: false,
      limit: input.limit,
      remaining: input.limit,
      currentCount: 0,
      resetAt: windowEnd.toISOString(),
      retryAfterSeconds: 0,
    };
  }

  if (state.newlyBlocked) {
    await emitMonitoringAlert({
      source: "auth-rate-limit",
      code: "AUTH_RATE_LIMIT_BLOCKED",
      severity: "warn",
      message: `Rate limit blocked for scope ${input.scope}`,
      context: {
        scope: input.scope,
        identifier: input.identifier,
        limit: input.limit,
        windowSeconds: input.windowSeconds,
        blockSeconds: input.blockSeconds,
      },
    });
  }

  return {
    allowed: state.allowed,
    blocked: state.blocked,
    limit: input.limit,
    remaining: Math.max(input.limit - state.currentCount, 0),
    currentCount: state.currentCount,
    resetAt: state.resetAt.toISOString(),
    retryAfterSeconds: state.retryAfterSeconds,
  };
}
