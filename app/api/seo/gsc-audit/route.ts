import { NextRequest } from "next/server";

import { runGscAudit } from "@/lib/gsc-audit";

const AUTH_HEADER = "x-gsc-audit-secret";

function verifySecret(req: NextRequest) {
  const isVercelCron = Boolean(req.headers.get("x-vercel-cron"));
  if (isVercelCron) return true;

  const secret =
    process.env.GSC_AUDIT_SECRET?.trim() ||
    process.env.SYNC_CRON_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    "";

  if (!secret) return true;

  const headerSecret =
    req.headers.get(AUTH_HEADER)?.trim() ||
    req.nextUrl.searchParams.get("secret")?.trim() ||
    "";

  return headerSecret === secret;
}

async function handleAudit(req: NextRequest) {
  if (!verifySecret(req)) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const report = await runGscAudit({ emitAlerts: true });
  const status = report.config.configured && report.issues.every((issue) => issue.severity !== "error")
    ? 200
    : report.config.configured
      ? 207
      : 503;

  return new Response(JSON.stringify({ ok: status < 400, report }, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
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
