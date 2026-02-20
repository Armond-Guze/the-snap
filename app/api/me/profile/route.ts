import { AuthProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getOrCreateCurrentUserProfile } from "@/app/api/me/_auth";
import { AUTH_RATE_LIMIT_POLICIES } from "@/lib/security/auth-rate-limit-policies";
import {
  checkAuthRateLimit,
  getRateLimitHeaders,
  getRateLimitIdentifier,
} from "@/lib/security/auth-rate-limit";
import type { UpdateProfileInput } from "@/lib/users/contracts";
import { updatePreferencesByAuthIdentity } from "@/lib/users/service";

export const runtime = "nodejs";

function toPatchInput(body: Record<string, unknown>): UpdateProfileInput {
  const input: UpdateProfileInput = {};

  if (Object.prototype.hasOwnProperty.call(body, "favoriteTeam")) {
    const favoriteTeam = body.favoriteTeam;
    if (favoriteTeam !== null && typeof favoriteTeam !== "string") {
      throw new Error("INVALID_TEAM_CODE");
    }
    input.favoriteTeam = favoriteTeam;
  }

  if (Object.prototype.hasOwnProperty.call(body, "themePreference")) {
    const themePreference = body.themePreference;
    if (
      themePreference !== null &&
      themePreference !== "SYSTEM" &&
      themePreference !== "LIGHT" &&
      themePreference !== "DARK"
    ) {
      throw new Error("INVALID_THEME_PREFERENCE");
    }
    input.themePreference = themePreference;
  }

  if (Object.prototype.hasOwnProperty.call(body, "onboardingCompleted")) {
    const onboardingCompleted = body.onboardingCompleted;
    if (typeof onboardingCompleted !== "boolean") {
      throw new Error("INVALID_ONBOARDING_COMPLETED");
    }
    input.onboardingCompleted = onboardingCompleted;
  }

  return input;
}

function hasAnyUpdatableField(input: UpdateProfileInput): boolean {
  return (
    Object.prototype.hasOwnProperty.call(input, "favoriteTeam") ||
    Object.prototype.hasOwnProperty.call(input, "themePreference") ||
    Object.prototype.hasOwnProperty.call(input, "onboardingCompleted")
  );
}

export async function GET(request: NextRequest) {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkAuthRateLimit({
      ...AUTH_RATE_LIMIT_POLICIES.PROFILE_READ,
      identifier: getRateLimitIdentifier(request.headers, result.clerkUserId),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many profile requests. Try again shortly." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      { profile: result.profile },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("[api/me/profile][GET]", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkAuthRateLimit({
      ...AUTH_RATE_LIMIT_POLICIES.PROFILE_WRITE,
      identifier: getRateLimitIdentifier(request.headers, result.clerkUserId),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many profile updates. Try again shortly." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const input = toPatchInput(body);
    if (!hasAnyUpdatableField(input)) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const profile = await updatePreferencesByAuthIdentity(
      AuthProvider.CLERK,
      result.clerkUserId,
      input
    );

    return NextResponse.json(
      { profile },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_TEAM_CODE") {
        return NextResponse.json({ error: "Invalid team code" }, { status: 400 });
      }

      if (error.message === "NO_UPDATES") {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
      }

      if (error.message === "INVALID_THEME_PREFERENCE") {
        return NextResponse.json({ error: "Invalid theme preference" }, { status: 400 });
      }

      if (error.message === "INVALID_ONBOARDING_COMPLETED") {
        return NextResponse.json({ error: "Invalid onboarding value" }, { status: 400 });
      }
    }

    console.error("[api/me/profile][PATCH]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
