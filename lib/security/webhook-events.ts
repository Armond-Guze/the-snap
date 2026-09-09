import "server-only";

import { Prisma, WebhookEventStatus, WebhookProvider } from "@prisma/client";

import { db } from "@/lib/db";

interface BeginWebhookEventInput {
  provider: WebhookProvider;
  eventId: string;
  eventType: string;
  payload?: unknown;
}

export type WebhookEventClaimState = "claimed" | "in_flight" | "terminal_duplicate";

export interface BeginWebhookEventResult {
  logId: string;
  claimState: WebhookEventClaimState;
  /**
   * Kept for existing webhook callers. A true value means the caller must not
   * process the event because it is already terminal or another request owns
   * the active processing lease.
   */
  isDuplicateProcessed: boolean;
}

export const WEBHOOK_PROCESSING_LEASE_MINUTES = 10;
export const WEBHOOK_EVENT_RETENTION_DAYS = 30;

const WEBHOOK_PROCESSING_LEASE_MS = WEBHOOK_PROCESSING_LEASE_MINUTES * 60 * 1_000;
const WEBHOOK_EVENT_RETENTION_MS = WEBHOOK_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1_000;
const TERMINAL_WEBHOOK_STATUSES = [
  WebhookEventStatus.PROCESSED,
  WebhookEventStatus.SKIPPED,
] as const;

function truncateError(value: string): string {
  const maxLength = 1800;
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return truncateError(error.stack ?? error.message);
  }

  return truncateError(String(error));
}

function toJsonValue(payload: unknown): Prisma.InputJsonValue | undefined {
  if (payload === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

function createClaimHandle(logId: string, claimedAt: Date): string {
  return `${logId}#${claimedAt.getTime()}`;
}

function parseClaimHandle(claimHandle: string): { logId: string; claimedAt: Date } {
  const separator = claimHandle.lastIndexOf("#");
  const logId = claimHandle.slice(0, separator);
  const timestamp = claimHandle.slice(separator + 1);
  if (separator <= 0 || !/^\d{10,16}$/.test(timestamp)) {
    throw new Error("WEBHOOK_EVENT_CLAIM_HANDLE_INVALID");
  }

  const claimedAt = new Date(Number(timestamp));
  if (Number.isNaN(claimedAt.getTime())) {
    throw new Error("WEBHOOK_EVENT_CLAIM_HANDLE_INVALID");
  }
  return { logId, claimedAt };
}

async function finishWebhookEvent(
  claimHandle: string,
  data: Prisma.WebhookEventLogUpdateManyMutationInput
): Promise<void> {
  const { logId, claimedAt } = parseClaimHandle(claimHandle);
  const result = await db.webhookEventLog.updateMany({
    where: {
      id: logId,
      status: WebhookEventStatus.RECEIVED,
      lastAttemptAt: claimedAt,
    },
    data: {
      ...data,
      payload: Prisma.DbNull,
    },
  });
  if (result.count === 0) {
    throw new Error("WEBHOOK_EVENT_CLAIM_LOST");
  }
}

export async function beginWebhookEventProcessing(
  input: BeginWebhookEventInput
): Promise<BeginWebhookEventResult> {
  const eventId = input.eventId.trim();
  if (!eventId) {
    throw new Error("WEBHOOK_EVENT_ID_REQUIRED");
  }

  const eventType = input.eventType.trim() || "unknown";
  const now = new Date();
  const leaseCutoff = new Date(now.getTime() - WEBHOOK_PROCESSING_LEASE_MS);
  const normalizedPayload = toJsonValue(input.payload);

  try {
    const created = await db.webhookEventLog.create({
      data: {
        provider: input.provider,
        eventId,
        eventType,
        status: WebhookEventStatus.RECEIVED,
        payload: normalizedPayload,
        firstSeenAt: now,
        lastAttemptAt: now,
      },
      select: {
        id: true,
      },
    });

    return {
      logId: createClaimHandle(created.id, now),
      claimState: "claimed",
      isDuplicateProcessed: false,
    };
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  const existing = await db.webhookEventLog.findUnique({
    where: {
      provider_eventId: {
        provider: input.provider,
        eventId,
      },
    },
    select: {
      id: true,
      status: true,
      lastAttemptAt: true,
    },
  });

  if (!existing) {
    throw new Error("WEBHOOK_EVENT_LOG_MISSING");
  }

  if (TERMINAL_WEBHOOK_STATUSES.includes(
    existing.status as (typeof TERMINAL_WEBHOOK_STATUSES)[number]
  )) {
    return {
      logId: existing.id,
      claimState: "terminal_duplicate",
      isDuplicateProcessed: true,
    };
  }

  const leaseIsAvailable =
    existing.status === WebhookEventStatus.FAILED ||
    (existing.status === WebhookEventStatus.RECEIVED && existing.lastAttemptAt <= leaseCutoff);

  if (!leaseIsAvailable) {
    return {
      logId: existing.id,
      claimState: "in_flight",
      isDuplicateProcessed: true,
    };
  }

  // Compare-and-swap the observed status/timestamp. Only one concurrent retry
  // can advance the lease; every loser observes an update count of zero and
  // must skip the side effect.
  const claimed = await db.webhookEventLog.updateMany({
    where: {
      id: existing.id,
      status: existing.status,
      lastAttemptAt: existing.lastAttemptAt,
    },
    data: {
      status: WebhookEventStatus.RECEIVED,
      eventType,
      attemptCount: {
        increment: 1,
      },
      lastAttemptAt: now,
      lastError: null,
      processedAt: null,
      payload: normalizedPayload === undefined ? Prisma.DbNull : normalizedPayload,
    },
  });

  if (claimed.count === 0) {
    return {
      logId: existing.id,
      claimState: "in_flight",
      isDuplicateProcessed: true,
    };
  }

  return {
    logId: createClaimHandle(existing.id, now),
    claimState: "claimed",
    isDuplicateProcessed: false,
  };
}

export async function markWebhookEventProcessed(claimHandle: string): Promise<void> {
  await finishWebhookEvent(claimHandle, {
      status: WebhookEventStatus.PROCESSED,
      processedAt: new Date(),
      lastError: null,
  });
}

export async function markWebhookEventSkipped(claimHandle: string): Promise<void> {
  await finishWebhookEvent(claimHandle, {
      status: WebhookEventStatus.SKIPPED,
      processedAt: new Date(),
      lastError: null,
  });
}

export async function markWebhookEventFailed(claimHandle: string, error: unknown): Promise<void> {
  await finishWebhookEvent(claimHandle, {
      status: WebhookEventStatus.FAILED,
      processedAt: null,
      lastError: toErrorMessage(error),
  });
}

export async function pruneWebhookEventLogs(now = new Date()) {
  const retentionCutoff = new Date(now.getTime() - WEBHOOK_EVENT_RETENTION_MS);
  const inactiveCutoff = new Date(now.getTime() - WEBHOOK_PROCESSING_LEASE_MS);

  // Remove any historical Clerk payloads written before payload minimization,
  // and clear payloads from terminal rows created by any provider.
  const sanitized = await db.webhookEventLog.updateMany({
    where: {
      AND: [
        {
          OR: [
            { provider: WebhookProvider.CLERK },
            {
              status: {
                in: [
                  WebhookEventStatus.PROCESSED,
                  WebhookEventStatus.SKIPPED,
                  WebhookEventStatus.FAILED,
                ],
              },
            },
          ],
        },
        { payload: { not: Prisma.DbNull } },
      ],
    },
    data: { payload: Prisma.DbNull },
  });

  // Retain the idempotency record for 30 days, but never delete a row with a
  // live processing lease even if its first delivery is older.
  const deleted = await db.webhookEventLog.deleteMany({
    where: {
      firstSeenAt: { lt: retentionCutoff },
      lastAttemptAt: { lt: inactiveCutoff },
    },
  });

  return {
    retentionDays: WEBHOOK_EVENT_RETENTION_DAYS,
    processingLeaseMinutes: WEBHOOK_PROCESSING_LEASE_MINUTES,
    retentionCutoff: retentionCutoff.toISOString(),
    inactiveCutoff: inactiveCutoff.toISOString(),
    payloadsCleared: sanitized.count,
    eventsDeleted: deleted.count,
  };
}
