import { NextRequest } from "next/server";

import { runGscAudit } from "@/lib/gsc-audit";

const AUTH_HEADER = "x-gsc-audit-secret";

function parsePositiveIntParam(rawValue: string | null) {
  if (!rawValue) return undefined;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function verifySecret(req: NextRequest): { ok: boolean; status?: number; error?: string } {
  const isVercelCron = Boolean(req.headers.get("x-vercel-cron"));
  if (isVercelCron) return { ok: true };

  const secret =
    process.env.GSC_AUDIT_SECRET?.trim() ||
    process.env.SYNC_CRON_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    "";

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, status: 500, error: "GSC_AUDIT_SECRET, SYNC_CRON_SECRET, or REVALIDATE_SECRET is not configured" };
    }
    return { ok: true };
  }

  const headerSecret =
    req.headers.get(AUTH_HEADER)?.trim() ||
    req.nextUrl.searchParams.get("secret")?.trim() ||
    "";

  return headerSecret === secret
    ? { ok: true }
    : { ok: false, status: 401, error: "Unauthorized" };
}

async function handleAudit(req: NextRequest) {
  const auth = verifySecret(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), {
      status: auth.status ?? 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contentLimit = parsePositiveIntParam(req.nextUrl.searchParams.get("contentLimit"));
  const lookbackDays = parsePositiveIntParam(req.nextUrl.searchParams.get("lookbackDays"));
  const emitAlerts = req.nextUrl.searchParams.get("emitAlerts") !== "false";

  const report = await runGscAudit({
    emitAlerts,
    contentLimit,
    lookbackDays,
  });
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
