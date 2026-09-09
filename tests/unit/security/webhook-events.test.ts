import { Prisma, WebhookEventStatus, WebhookProvider } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: {
    webhookEventLog: {
      create: dbMocks.create,
      findUnique: dbMocks.findUnique,
      updateMany: dbMocks.updateMany,
      deleteMany: dbMocks.deleteMany,
    },
  },
}));

import {
  beginWebhookEventProcessing,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  markWebhookEventSkipped,
  pruneWebhookEventLogs,
} from "../../../lib/security/webhook-events";

const NOW = new Date("2026-08-09T15:00:00.000Z");
const eventInput = {
  provider: WebhookProvider.SANITY,
  eventId: "social:abc123",
  eventType: "article.publish.social",
  payload: { documentId: "article-1" },
};

function uniqueConflict() {
  return new Prisma.PrismaClientKnownRequestError("duplicate webhook event", {
    code: "P2002",
    clientVersion: "6.19.3",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.create.mockResolvedValue({ id: "log-1" });
  dbMocks.updateMany.mockResolvedValue({ count: 1 });
  dbMocks.deleteMany.mockResolvedValue({ count: 0 });
});

describe("webhook event processing claims", () => {
  it("claims a newly inserted event", async () => {
    await expect(beginWebhookEventProcessing(eventInput)).resolves.toEqual({
      logId: expect.stringMatching(/^log-1#\d+$/),
      claimState: "claimed",
      isDuplicateProcessed: false,
    });

    expect(dbMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: eventInput.eventId,
          status: WebhookEventStatus.RECEIVED,
          payload: eventInput.payload,
          lastAttemptAt: expect.any(Date),
        }),
      })
    );
  });

  it("does not let a concurrent duplicate share an active lease", async () => {
    dbMocks.create.mockRejectedValue(uniqueConflict());
    dbMocks.findUnique.mockResolvedValue({
      id: "log-1",
      status: WebhookEventStatus.RECEIVED,
      lastAttemptAt: new Date(Date.now() - 60_000),
    });

    await expect(beginWebhookEventProcessing(eventInput)).resolves.toEqual({
      logId: "log-1",
      claimState: "in_flight",
      isDuplicateProcessed: true,
    });
    expect(dbMocks.updateMany).not.toHaveBeenCalled();
  });

  it("reclaims an expired lease with an atomic compare-and-swap", async () => {
    const staleAttempt = new Date(Date.now() - 11 * 60_000);
    dbMocks.create.mockRejectedValue(uniqueConflict());
    dbMocks.findUnique.mockResolvedValue({
      id: "log-1",
      status: WebhookEventStatus.RECEIVED,
      lastAttemptAt: staleAttempt,
    });

    await expect(beginWebhookEventProcessing(eventInput)).resolves.toMatchObject({
      claimState: "claimed",
      isDuplicateProcessed: false,
    });
    expect(dbMocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "log-1",
        status: WebhookEventStatus.RECEIVED,
        lastAttemptAt: staleAttempt,
      },
      data: expect.objectContaining({
        status: WebhookEventStatus.RECEIVED,
        attemptCount: { increment: 1 },
        lastAttemptAt: expect.any(Date),
        processedAt: null,
      }),
    });
  });

  it("makes a compare-and-swap loser skip the side effect", async () => {
    const failedAttempt = new Date(Date.now() - 30_000);
    dbMocks.create.mockRejectedValue(uniqueConflict());
    dbMocks.findUnique.mockResolvedValue({
      id: "log-1",
      status: WebhookEventStatus.FAILED,
      lastAttemptAt: failedAttempt,
    });
    dbMocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(beginWebhookEventProcessing(eventInput)).resolves.toEqual({
      logId: "log-1",
      claimState: "in_flight",
      isDuplicateProcessed: true,
    });
  });

  it.each([WebhookEventStatus.PROCESSED, WebhookEventStatus.SKIPPED])(
    "skips terminal duplicate status %s without extending retention",
    async (status) => {
      dbMocks.create.mockRejectedValue(uniqueConflict());
      dbMocks.findUnique.mockResolvedValue({
        id: "log-1",
        status,
        lastAttemptAt: new Date(Date.now() - 60_000),
      });

      await expect(beginWebhookEventProcessing(eventInput)).resolves.toMatchObject({
        claimState: "terminal_duplicate",
        isDuplicateProcessed: true,
      });
      expect(dbMocks.updateMany).not.toHaveBeenCalled();
    }
  );
});

describe("webhook event data minimization and retention", () => {
  it("clears transient payloads on every terminal transition", async () => {
    await markWebhookEventProcessed("log-1#1786287600000");
    await markWebhookEventSkipped("log-2#1786287600000");
    await markWebhookEventFailed("log-3#1786287600000", new Error("delivery failed"));

    expect(dbMocks.updateMany).toHaveBeenCalledTimes(3);
    for (const call of dbMocks.updateMany.mock.calls) {
      expect(call[0].data.payload).toBe(Prisma.DbNull);
      expect(call[0].where).toMatchObject({
        status: WebhookEventStatus.RECEIVED,
        lastAttemptAt: new Date("2026-08-09T15:00:00.000Z"),
      });
    }
  });

  it("prevents a stale claimant from completing a newer lease", async () => {
    dbMocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      markWebhookEventProcessed("log-1#1786287600000")
    ).rejects.toThrow("WEBHOOK_EVENT_CLAIM_LOST");
  });

  it("sanitizes historical payloads and deletes only old inactive logs", async () => {
    dbMocks.updateMany.mockResolvedValue({ count: 4 });
    dbMocks.deleteMany.mockResolvedValue({ count: 7 });

    await expect(pruneWebhookEventLogs(NOW)).resolves.toEqual({
      retentionDays: 30,
      processingLeaseMinutes: 10,
      retentionCutoff: "2026-07-10T15:00:00.000Z",
      inactiveCutoff: "2026-08-09T14:50:00.000Z",
      payloadsCleared: 4,
      eventsDeleted: 7,
    });

    expect(dbMocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { payload: Prisma.DbNull } })
    );
    expect(dbMocks.deleteMany).toHaveBeenCalledWith({
      where: {
        firstSeenAt: { lt: new Date("2026-07-10T15:00:00.000Z") },
        lastAttemptAt: { lt: new Date("2026-08-09T14:50:00.000Z") },
      },
    });
  });
});
