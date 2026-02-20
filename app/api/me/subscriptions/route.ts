import { AuthProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getOrCreateCurrentUserProfile } from "@/app/api/me/_auth";
import { AUTH_RATE_LIMIT_POLICIES } from "@/lib/security/auth-rate-limit-policies";
import {
  checkAuthRateLimit,
  getRateLimitHeaders,
  getRateLimitIdentifier,
} from "@/lib/security/auth-rate-limit";
import type { UpdateSubscriptionsInput } from "@/lib/users/contracts";
import { updateSubscriptionsByAuthIdentity } from "@/lib/users/service";

export const runtime = "nodejs";

type PutBody = {
  subscriptions?: UpdateSubscriptionsInput["subscriptions"];
};

export async function GET(request: NextRequest) {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkAuthRateLimit({
      ...AUTH_RATE_LIMIT_POLICIES.SUBSCRIPTIONS_READ,
      identifier: getRateLimitIdentifier(request.headers, result.clerkUserId),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many subscription requests. Try again shortly." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      { subscriptions: result.profile.subscriptions, profile: result.profile },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("[api/me/subscriptions][GET]", error);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkAuthRateLimit({
      ...AUTH_RATE_LIMIT_POLICIES.SUBSCRIPTIONS_WRITE,
      identifier: getRateLimitIdentifier(request.headers, result.clerkUserId),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many subscription updates. Try again shortly." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json().catch(() => null)) as PutBody | null;
    if (!body || !Array.isArray(body.subscriptions)) {
      return NextResponse.json({ error: "Invalid subscriptions payload" }, { status: 400 });
    }

    const payload: UpdateSubscriptionsInput = {
      subscriptions: body.subscriptions,
    };

    const profile = await updateSubscriptionsByAuthIdentity(
      AuthProvider.CLERK,
      result.clerkUserId,
      payload
    );

    return NextResponse.json(
      { profile, subscriptions: profile.subscriptions },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("[api/me/subscriptions][PUT]", error);
    return NextResponse.json({ error: "Failed to update subscriptions" }, { status: 500 });
  }
}
