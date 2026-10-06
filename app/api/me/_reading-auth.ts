import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUserProfile } from "./_auth";
import {
  checkAuthRateLimit,
  getRateLimitHeaders,
} from "@/lib/security/auth-rate-limit";

export async function readingAuth(request: NextRequest) {
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !== request.nextUrl.origin
  ) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }
  const context = await getOrCreateCurrentUserProfile();
  if (!context)
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  const limit = await checkAuthRateLimit({
    scope: "auth:reading",
    identifier: context.profile.id,
    limit: 120,
    windowSeconds: 60,
    blockSeconds: 60,
  });
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Please try again shortly" },
      { status: 429, headers: getRateLimitHeaders(limit) },
    );
  return context.profile.id;
}

export async function smallJson(
  request: Request,
): Promise<Record<string, unknown> | null> {
  // Bound memory use even when a caller omits Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return null;
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : null;
  } catch {
    return null;
  }
}
