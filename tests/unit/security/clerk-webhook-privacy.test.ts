import { AuthProvider, WebhookProvider } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  begin: vi.fn(),
  markFailed: vi.fn(),
  markProcessed: vi.fn(),
  markSkipped: vi.fn(),
  upsertUser: vi.fn(),
  markDeleted: vi.fn(),
  emitAlert: vi.fn(),
}));

vi.mock("svix", () => ({
  Webhook: class {
    verify(payload: string, headers: Record<string, string>) {
      return mocks.verify(payload, headers);
    }
  },
}));
vi.mock("@/lib/security/webhook-events", () => ({
  beginWebhookEventProcessing: mocks.begin,
  markWebhookEventFailed: mocks.markFailed,
  markWebhookEventProcessed: mocks.markProcessed,
  markWebhookEventSkipped: mocks.markSkipped,
}));
vi.mock("@/lib/users/service", () => ({
  upsertUserFromAuthIdentity: mocks.upsertUser,
  markUserDeletedByAuthIdentity: mocks.markDeleted,
}));
vi.mock("@/lib/monitoring/alerts", () => ({
  emitMonitoringAlert: mocks.emitAlert,
}));

const originalSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test_secret";
  mocks.verify.mockReturnValue({
    id: "evt_clerk_1",
    type: "user.created",
    data: {
      id: "user_123",
      first_name: "Private",
      last_name: "Person",
      image_url: "https://images.example/private.png",
      primary_email_address_id: "email_1",
      email_addresses: [
        { id: "email_1", email_address: "private@example.com" },
      ],
    },
  });
  mocks.begin.mockResolvedValue({
    logId: "log-1",
    claimState: "claimed",
    isDuplicateProcessed: false,
  });
  mocks.upsertUser.mockResolvedValue({});
  mocks.markProcessed.mockResolvedValue(undefined);
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  else process.env.CLERK_WEBHOOK_SIGNING_SECRET = originalSecret;
});

describe("Clerk webhook audit-data minimization", () => {
  it("logs only the event identity and never passes the PII payload to the audit log", async () => {
    const { POST } = await import("../../../app/api/webhooks/clerk/route");
    const request = new NextRequest("https://thegamesnap.com/api/webhooks/clerk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "svix-id": "msg_1",
        "svix-timestamp": "1786287600",
        "svix-signature": "v1,test",
      },
      body: JSON.stringify({ contains: "PII" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.begin).toHaveBeenCalledWith({
      provider: WebhookProvider.CLERK,
      eventId: "evt_clerk_1",
      eventType: "user.created",
    });
    expect(mocks.begin.mock.calls[0][0]).not.toHaveProperty("payload");
    expect(mocks.upsertUser).toHaveBeenCalledWith({
      provider: AuthProvider.CLERK,
      providerUserId: "user_123",
      email: "private@example.com",
      firstName: "Private",
      lastName: "Person",
      avatarUrl: "https://images.example/private.png",
    });
    expect(mocks.markProcessed).toHaveBeenCalledWith("log-1");
  });
});
