import { NextRequest, NextResponse } from "next/server";

import { authorizeBearerRequest, bearerErrorHeaders } from "@/lib/security/bearer-auth";
import { pruneWebhookEventLogs } from "@/lib/security/webhook-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function handlePrune(request: NextRequest) {
  const authorization = authorizeBearerRequest(request.headers, [
    process.env.CRON_SECRET,
  ]);
  if (!authorization.authorized) {
    return NextResponse.json(
      {
        success: false,
        error:
          authorization.status === 503
            ? "Webhook retention cron is not configured"
            : "Unauthorized",
      },
      {
        status: authorization.status,
        headers: bearerErrorHeaders(authorization.status),
      }
    );
  }

  try {
    const result = await pruneWebhookEventLogs();
    return NextResponse.json(
      { success: true, result },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[webhooks] retention prune failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { success: false, error: "Webhook retention prune failed" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET(request: NextRequest) {
  return handlePrune(request);
}

export async function POST(request: NextRequest) {
  return handlePrune(request);
}
