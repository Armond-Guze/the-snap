import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
  emitAlert: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: { $transaction: dbMocks.transaction },
}));
vi.mock("@/lib/monitoring/alerts", () => ({
  emitMonitoringAlert: dbMocks.emitAlert,
}));

import { checkAuthRateLimit } from "../../../lib/security/auth-rate-limit";

const transactionClient = {
  authRateLimitState: {
    findUnique: dbMocks.findUnique,
    create: dbMocks.create,
    update: dbMocks.update,
  },
};

const policy = {
  scope: "account:write",
  identifier: "user:user_123",
  limit: 5,
  windowSeconds: 60,
  blockSeconds: 120,
};

function transactionConflict(code: "P2002" | "P2034") {
  return new Prisma.PrismaClientKnownRequestError("transaction conflict", {
    code,
    clientVersion: "6.19.3",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.create.mockResolvedValue({});
  dbMocks.update.mockResolvedValue({});
  dbMocks.emitAlert.mockResolvedValue(undefined);
  dbMocks.transaction.mockImplementation(
    async (
      callback: (transaction: typeof transactionClient) => Promise<unknown>
    ) => callback(transactionClient)
  );
});

describe("durable auth rate limiting", () => {
  it("uses a serializable transaction and increments an existing counter atomically", async () => {
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    dbMocks.findUnique.mockResolvedValue({
      requestCount: 1,
      windowStart,
      windowEndsAt: new Date(windowStart.getTime() + 60_000),
      blockedUntil: null,
    });

    await expect(checkAuthRateLimit(policy)).resolves.toMatchObject({
      allowed: true,
      blocked: false,
      currentCount: 2,
      remaining: 3,
    });
    expect(dbMocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(dbMocks.update).toHaveBeenCalledWith({
      where: {
        scope_identifier: {
          scope: policy.scope,
          identifier: policy.identifier,
        },
      },
      data: { requestCount: { increment: 1 } },
    });
  });

  it("retries unique and serialization conflicts before allowing a request", async () => {
    dbMocks.transaction
      .mockRejectedValueOnce(transactionConflict("P2002"))
      .mockRejectedValueOnce(transactionConflict("P2034"));
    dbMocks.findUnique.mockResolvedValue(null);

    await expect(checkAuthRateLimit(policy)).resolves.toMatchObject({
      allowed: true,
      currentCount: 1,
      remaining: 4,
    });
    expect(dbMocks.transaction).toHaveBeenCalledTimes(3);
    expect(dbMocks.create).toHaveBeenCalledTimes(1);
  });

  it("fails closed after transaction conflicts exhaust all retries", async () => {
    dbMocks.transaction.mockRejectedValue(transactionConflict("P2034"));

    const result = await checkAuthRateLimit(policy);

    expect(dbMocks.transaction).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      allowed: false,
      blocked: true,
      remaining: 0,
      currentCount: policy.limit,
      retryAfterSeconds: policy.blockSeconds,
    });
    expect(dbMocks.emitAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "AUTH_RATE_LIMIT_CHECK_FAILED",
        severity: "error",
        message: "Rate limit check failed; blocking request",
      })
    );
  });
});
