import "server-only";

type AlertSeverity = "info" | "warn" | "error" | "critical";

interface MonitoringAlertInput {
  source: string;
  code: string;
  message: string;
  severity?: AlertSeverity;
  context?: Record<string, unknown>;
}

const ALERT_WEBHOOK_URL =
  process.env.MONITORING_ALERT_WEBHOOK_URL?.trim() ||
  process.env.AUTH_ALERT_WEBHOOK_URL?.trim() ||
  "";

function writeLog(severity: AlertSeverity, payload: Record<string, unknown>) {
  const serialized = JSON.stringify(payload);
  if (severity === "error" || severity === "critical") {
    console.error(serialized);
    return;
  }

  if (severity === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export async function emitMonitoringAlert(input: MonitoringAlertInput): Promise<void> {
  const severity = input.severity ?? "warn";
  const payload = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    source: input.source,
    code: input.code,
    severity,
    message: input.message,
    context: input.context ?? {},
  };

  writeLog(severity, payload);

  if (!ALERT_WEBHOOK_URL) return;
  if (severity !== "error" && severity !== "critical") return;

  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    const fallback = {
      ...payload,
      code: "ALERT_DISPATCH_FAILED",
      message: "Failed to dispatch monitoring alert webhook",
      dispatchError: error instanceof Error ? error.message : String(error),
    };
    console.error(JSON.stringify(fallback));
  }
}
