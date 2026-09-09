import { NextRequest, NextResponse } from "next/server";

import { runGscAudit } from "@/lib/gsc-audit";
import {
  authorizeBearerRequest,
  bearerErrorHeaders,
} from "@/lib/security/bearer-auth";

async function handleAudit(req: NextRequest) {
  const authorization = authorizeBearerRequest(req.headers, [
    process.env.GSC_AUDIT_SECRET,
    process.env.CRON_SECRET,
  ]);
  if (!authorization.authorized) {
    return NextResponse.json(
      {
        ok: false,
        error: authorization.status === 503 ? "Service unavailable" : "Unauthorized",
      },
      {
        status: authorization.status,
        headers: bearerErrorHeaders(authorization.status),
      }
    );
  }

  const report = await runGscAudit({ emitAlerts: true });
  const status = report.config.configured && report.issues.every((issue) => issue.severity !== "error")
    ? 200
    : report.config.configured
      ? 207
      : 503;

  return new Response(JSON.stringify({ ok: status < 400, report }, null, 2), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}

export async function GET(req: NextRequest) {
  return handleAudit(req);
}

export async function POST(req: NextRequest) {
  return handleAudit(req);
}

export const runtime = "nodejs";
export const revalidate = 0;
