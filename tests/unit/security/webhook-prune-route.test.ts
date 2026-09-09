import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  pruneWebhookEventLogs: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../../../lib/security/webhook-events", () => ({
  pruneWebhookEventLogs: mocks.pruneWebhookEventLogs,
}));

import { GET, POST } from "../../../app/api/webhooks/prune/route";

const originalCronSecret = process.env.CRON_SECRET;
const secret = "cron-test-secret-with-enough-entropy";

function request(headers?: Record<string, string>, query = "") {
  return new NextRequest(`https://thegamesnap.com/api/webhooks/prune${query}`, {
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = secret;
  mocks.pruneWebhookEventLogs.mockResolvedValue({
    retentionDays: 30,
    processingLeaseMinutes: 10,
    retentionCutoff: "2026-07-10T15:00:00.000Z",
    inactiveCutoff: "2026-08-09T14:50:00.000Z",
    payloadsCleared: 4,
    eventsDeleted: 7,
  });
});

afterEach(() => {
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
});

describe("webhook-log retention cron", () => {
  it("fails closed when CRON_SECRET is absent", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(mocks.pruneWebhookEventLogs).not.toHaveBeenCalled();
  });

  it("rejects query secrets and requires an exact bearer token", async () => {
    const response = await GET(
      request({ "x-vercel-cron": "1" }, `?secret=${encodeURIComponent(secret)}`)
    );

    expect(response.status).toBe(401);
    expect(mocks.pruneWebhookEventLogs).not.toHaveBeenCalled();
  });

  it("runs for authenticated GET and POST requests", async () => {
    const headers = { authorization: `Bearer ${secret}` };
    const getResponse = await GET(request(headers));
    const postResponse = await POST(request(headers));

    expect(getResponse.status).toBe(200);
    expect(postResponse.status).toBe(200);
    expect(mocks.pruneWebhookEventLogs).toHaveBeenCalledTimes(2);
    expect(await getResponse.json()).toMatchObject({
      success: true,
      result: { payloadsCleared: 4, eventsDeleted: 7 },
    });
  });

  it("returns no-store 503 when pruning fails", async () => {
    mocks.pruneWebhookEventLogs.mockRejectedValue(new Error("database unavailable"));
    const response = await GET(
      request({ authorization: `Bearer ${secret}` })
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
