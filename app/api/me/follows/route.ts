import { AuthProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getOrCreateCurrentUserProfile } from "@/app/api/me/_auth";
import { AUTH_RATE_LIMIT_POLICIES } from "@/lib/security/auth-rate-limit-policies";
import {
  checkAuthRateLimit,
  getRateLimitHeaders,
  getRateLimitIdentifier,
} from "@/lib/security/auth-rate-limit";
import type { ReplaceFollowsInput } from "@/lib/users/contracts";
import { replaceFollowsByAuthIdentity } from "@/lib/users/service";

export const runtime = "nodejs";

type PutBody = {
  follows?: ReplaceFollowsInput["follows"];
};

export async function GET(request: NextRequest) {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkAuthRateLimit({
      ...AUTH_RATE_LIMIT_POLICIES.FOLLOWS_READ,
      identifier: getRateLimitIdentifier(request.headers, result.clerkUserId),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many follow requests. Try again shortly." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      { follows: result.profile.follows, profile: result.profile },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("[api/me/follows][GET]", error);
    return NextResponse.json({ error: "Failed to load follows" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkAuthRateLimit({
      ...AUTH_RATE_LIMIT_POLICIES.FOLLOWS_WRITE,
      identifier: getRateLimitIdentifier(request.headers, result.clerkUserId),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many follow updates. Try again shortly." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json().catch(() => null)) as PutBody | null;
    if (!body || !Array.isArray(body.follows)) {
      return NextResponse.json({ error: "Invalid follows payload" }, { status: 400 });
    }

    const payload: ReplaceFollowsInput = {
      follows: body.follows,
    };

    const profile = await replaceFollowsByAuthIdentity(
      AuthProvider.CLERK,
      result.clerkUserId,
      payload
    );

    return NextResponse.json(
      { profile, follows: profile.follows },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("[api/me/follows][PUT]", error);
    return NextResponse.json({ error: "Failed to update follows" }, { status: 500 });
  }
}
