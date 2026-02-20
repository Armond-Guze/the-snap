import { AuthProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getOrCreateCurrentUserProfile } from "@/app/api/me/_auth";
import type { UpdateSubscriptionsInput } from "@/lib/users/contracts";
import { updateSubscriptionsByAuthIdentity } from "@/lib/users/service";

export const runtime = "nodejs";

type PutBody = {
  subscriptions?: UpdateSubscriptionsInput["subscriptions"];
};

export async function GET() {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { subscriptions: result.profile.subscriptions, profile: result.profile },
      { status: 200 }
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
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/me/subscriptions][PUT]", error);
    return NextResponse.json({ error: "Failed to update subscriptions" }, { status: 500 });
  }
}
