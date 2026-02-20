import { AuthProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getOrCreateCurrentUserProfile } from "@/app/api/me/_auth";
import type { ReplaceFollowsInput } from "@/lib/users/contracts";
import { replaceFollowsByAuthIdentity } from "@/lib/users/service";

export const runtime = "nodejs";

type PutBody = {
  follows?: ReplaceFollowsInput["follows"];
};

export async function GET() {
  try {
    const result = await getOrCreateCurrentUserProfile();
    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { follows: result.profile.follows, profile: result.profile },
      { status: 200 }
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

    return NextResponse.json({ profile, follows: profile.follows }, { status: 200 });
  } catch (error) {
    console.error("[api/me/follows][PUT]", error);
    return NextResponse.json({ error: "Failed to update follows" }, { status: 500 });
  }
}
