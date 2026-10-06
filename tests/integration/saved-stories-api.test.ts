import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  limit: vi.fn(),
  find: vi.fn(),
  remove: vi.fn(),
  upsert: vi.fn(),
  count: vi.fn(),
  unique: vi.fn(),
  lock: vi.fn(),
}));
vi.mock("@/app/api/me/_auth", () => ({
  getOrCreateCurrentUserProfile: mocks.session,
}));
vi.mock("@/lib/security/auth-rate-limit", () => ({
  checkAuthRateLimit: mocks.limit,
  getRateLimitHeaders: () => ({}),
}));
vi.mock("@/lib/db", () => {
  const tx = {
    savedArticle: {
      findMany: mocks.find,
      deleteMany: mocks.remove,
      upsert: mocks.upsert,
      count: mocks.count,
      findUnique: mocks.unique,
    },
    $queryRaw: mocks.lock,
  };
  return {
    db: {
      ...tx,
      $transaction: (callback: (value: typeof tx) => unknown) => callback(tx),
    },
  };
});
import { GET, PUT, DELETE } from "@/app/api/me/saved-stories/route";
function req(
  method: string,
  body?: unknown,
  origin = "https://thegamesnap.com",
) {
  return new NextRequest("https://thegamesnap.com/api/me/saved-stories", {
    method,
    headers: { origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
describe("account saved stories", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ profile: { id: "account-a" } });
    mocks.limit.mockResolvedValue({ allowed: true });
    mocks.find.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
  });
  it("rejects unsigned users without reading their list", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await GET(req("GET"))).status).toBe(401);
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("rejects cross-origin mutations before auth or database access", async () => {
    expect(
      (
        await PUT(
          req(
            "PUT",
            { href: "/articles/a", title: "A" },
            "https://other.example",
          ),
        )
      ).status,
    ).toBe(403);
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it("reads only the current account and disables response caching", async () => {
    const res = await GET(req("GET"));
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(mocks.find.mock.calls[0][0].where).toEqual({ userId: "account-a" });
  });
  it("ignores caller-supplied ownership during deletion", async () => {
    await DELETE(req("DELETE", { userId: "account-b", href: "/articles/a" }));
    expect(mocks.remove).toHaveBeenCalledWith({
      where: { userId: "account-a", href: "/articles/a" },
    });
  });
  it("rejects external links and oversized requests", async () => {
    expect(
      (await PUT(req("PUT", { href: "https://evil.example", title: "A" })))
        .status,
    ).toBe(400);
    expect(
      (await PUT(req("PUT", { href: "/articles/a", title: "x".repeat(9000) })))
        .status,
    ).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("enforces the account cap under a row lock", async () => {
    mocks.count.mockResolvedValue(200);
    expect(
      (await PUT(req("PUT", { href: "/articles/a", title: "A" }))).status,
    ).toBe(409);
    expect(mocks.lock).toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("allows idempotent saves at the cap", async () => {
    mocks.unique.mockResolvedValue({ href: "/articles/a" });
    mocks.count.mockResolvedValue(200);
    expect(
      (await PUT(req("PUT", { href: "/articles/a", title: "A" }))).status,
    ).toBe(200);
    expect(mocks.upsert.mock.calls[0][0].where.userId_href.userId).toBe(
      "account-a",
    );
  });
});
