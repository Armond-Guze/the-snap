import "server-only";

import { Prisma, WebhookEventStatus, WebhookProvider } from "@prisma/client";

import { db } from "@/lib/db";

interface BeginWebhookEventInput {
  provider: WebhookProvider;
  eventId: string;
  eventType: string;
  payload?: unknown;
}

export interface BeginWebhookEventResult {
  logId: string;
  isDuplicateProcessed: boolean;
}

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

export async function beginWebhookEventProcessing(
  input: BeginWebhookEventInput
): Promise<BeginWebhookEventResult> {
  const eventId = input.eventId.trim();
  if (!eventId) {
    throw new Error("WEBHOOK_EVENT_ID_REQUIRED");
  }

  const eventType = input.eventType.trim() || "unknown";
  const now = new Date();
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
      logId: created.id,
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
    },
  });

  if (!existing) {
    throw new Error("WEBHOOK_EVENT_LOG_MISSING");
  }

  if (existing.status === WebhookEventStatus.PROCESSED) {
    await db.webhookEventLog.update({
      where: { id: existing.id },
      data: {
        attemptCount: {
          increment: 1,
        },
        lastAttemptAt: now,
      },
    });

    return {
      logId: existing.id,
      isDuplicateProcessed: true,
    };
  }

  await db.webhookEventLog.update({
    where: { id: existing.id },
    data: {
      status: WebhookEventStatus.RECEIVED,
      eventType,
      attemptCount: {
        increment: 1,
      },
      lastAttemptAt: now,
      lastError: null,
      payload: normalizedPayload,
    },
  });

  return {
    logId: existing.id,
    isDuplicateProcessed: false,
  };
}

export async function markWebhookEventProcessed(logId: string): Promise<void> {
  await db.webhookEventLog.update({
    where: { id: logId },
    data: {
      status: WebhookEventStatus.PROCESSED,
      processedAt: new Date(),
      lastError: null,
    },
  });
}

export async function markWebhookEventSkipped(logId: string): Promise<void> {
  await db.webhookEventLog.update({
    where: { id: logId },
    data: {
      status: WebhookEventStatus.SKIPPED,
      processedAt: new Date(),
      lastError: null,
    },
  });
}

export async function markWebhookEventFailed(logId: string, error: unknown): Promise<void> {
  await db.webhookEventLog.update({
    where: { id: logId },
    data: {
      status: WebhookEventStatus.FAILED,
      processedAt: null,
      lastError: toErrorMessage(error),
    },
  });
}
