import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  config: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  upsert: vi.fn(),
  count: vi.fn(),
  fetch: vi.fn(),
  send: vi.fn(),
}));
vi.mock("@/app/api/me/_reading-auth", () => ({
  readingAuth: m.auth,
  smallJson: (r: Request) => r.json(),
}));
vi.mock("@/lib/push-config", () => ({ pushConfig: m.config }));
vi.mock("@/lib/db", () => {
  const tx = {
    pushDevice: {
      findMany: m.findMany,
      findUnique: m.findUnique,
      findFirst: m.findFirst,
      updateMany: m.updateMany,
      deleteMany: m.deleteMany,
      upsert: m.upsert,
      count: m.count,
    },
    $queryRaw: vi.fn(),
  };
  return {
    db: { ...tx, $transaction: (cb: (tx: unknown) => unknown) => cb(tx) },
  };
});
vi.mock("@/sanity/lib/client", () => ({
  client: { withConfig: () => ({ fetch: m.fetch }) },
}));
vi.mock("web-push", () => ({ default: { sendNotification: m.send } }));
import { GET as status, PUT, DELETE } from "@/app/api/me/push/route";
import { GET as deliver } from "@/app/api/notifications/team-updates/route";
const subscription = {
  team: "BAL",
  endpoint: "https://fcm.googleapis.com/subscription",
  keys: { p256dh: "B".repeat(87), auth: "A".repeat(22) },
};
function request(method: string, body?: unknown) {
  return new NextRequest("https://thegamesnap.com/api/me/push", {
    method,
    headers: { origin: "https://thegamesnap.com" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
describe("team alerts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.auth.mockResolvedValue("account-a");
    m.config.mockReturnValue({
      publicKey: "public",
      privateKey: "private",
      subject: "https://thegamesnap.com",
    });
    m.findMany.mockResolvedValue([]);
    m.count.mockResolvedValue(0);
    vi.stubEnv("CRON_SECRET", "test-secret");
  });
  it("never exposes the private key", async () => {
    expect(await (await status(request("GET"))).json()).toEqual({
      configured: true,
      publicKey: "public",
      devices: [],
    });
  });
  it("ignores ownership and endpoint fields nested inside untrusted keys", async () => {
    const result = await PUT(
      request("PUT", {
        ...subscription,
        keys: {
          ...subscription.keys,
          userId: "account-b",
          endpoint: "https://evil.test",
          id: "other-device",
        },
      }),
    );
    expect(result.status).toBe(200);
    expect(m.upsert.mock.calls[0][0].create).toEqual({
      userId: "account-a",
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      team: "BAL",
    });
    expect(m.upsert.mock.calls[0][0].update.userId).toBeUndefined();
  });
  it("does not register devices when delivery is unconfigured", async () => {
    m.config.mockReturnValue(null);
    expect((await PUT(request("PUT", subscription))).status).toBe(503);
    expect(m.upsert).not.toHaveBeenCalled();
  });
  it("refuses another account endpoint and limits each account", async () => {
    m.findUnique.mockResolvedValue({ userId: "account-b" });
    expect((await PUT(request("PUT", subscription))).status).toBe(409);
    m.findUnique.mockResolvedValue(null);
    m.count.mockResolvedValue(10);
    expect((await PUT(request("PUT", subscription))).status).toBe(409);
    expect(m.upsert).not.toHaveBeenCalled();
  });
  it("scopes device removal to the signed-in owner", async () => {
    await DELETE(request("DELETE", { id: "device-b", userId: "account-b" }));
    expect(m.deleteMany).toHaveBeenCalledWith({
      where: { userId: "account-a", id: "device-b" },
    });
  });
  it("rejects cron requests without its secret", async () => {
    expect((await deliver(request("GET"))).status).toBe(401);
    expect(m.findMany).not.toHaveBeenCalled();
  });
  it("does not send when another job owns the device lease", async () => {
    m.findMany.mockResolvedValue([{ id: "device", checkedAt: new Date() }]);
    m.updateMany.mockResolvedValue({ count: 0 });
    await deliver(
      new NextRequest(
        "https://thegamesnap.com/api/notifications/team-updates",
        { headers: { authorization: "Bearer test-secret" } },
      ),
    );
    expect(m.send).not.toHaveBeenCalled();
  });
  it("removes an expired provider subscription", async () => {
    m.findMany.mockResolvedValue([
      {
        id: "device",
        team: "BAL",
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        checkedAt: new Date("2026-09-28"),
      },
    ]);
    m.updateMany.mockResolvedValue({ count: 1 });
    m.findFirst.mockResolvedValue({ id: "device" });
    m.fetch
      .mockResolvedValueOnce({ _id: "ravens" })
      .mockResolvedValueOnce({ title: "Ravens news", slug: "ravens-news" });
    m.send.mockRejectedValue({ statusCode: 410 });
    await deliver(
      new NextRequest(
        "https://thegamesnap.com/api/notifications/team-updates",
        { headers: { authorization: "Bearer test-secret" } },
      ),
    );
    expect(m.deleteMany).toHaveBeenCalledWith({ where: { id: "device" } });
  });
  it("passes through unauthorized account requests", async () => {
    m.auth.mockResolvedValue(
      NextResponse.json({ error: "Sign in" }, { status: 401 }),
    );
    expect((await PUT(request("PUT", subscription))).status).toBe(401);
    expect(m.upsert).not.toHaveBeenCalled();
  });
});
