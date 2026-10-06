import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it, expect, vi } from "vitest";
const source = readFileSync("public/snap-sw.js", "utf8");
function worker() {
  const events: Record<string, (event: unknown) => void> = {};
  const fetch = vi.fn().mockRejectedValue(new Error("offline"));
  const match = vi.fn().mockResolvedValue(new Response("offline library"));
  const self = {
    location: { origin: "https://thegamesnap.com" },
    addEventListener: (name: string, cb: (event: unknown) => void) =>
      (events[name] = cb),
    clients: { claim: vi.fn(), openWindow: vi.fn() },
    registration: { showNotification: vi.fn().mockResolvedValue(undefined) },
  };
  vm.runInNewContext(source, {
    self,
    URL,
    Response,
    fetch,
    caches: { match, open: async () => ({ match }) },
  });
  return { events, fetch, match, self };
}
describe("offline worker boundaries", () => {
  it("does not intercept API reads or authenticated mutations", () => {
    const w = worker();
    for (const request of [
      {
        url: "https://thegamesnap.com/api/me/profile",
        method: "GET",
        mode: "cors",
      },
      {
        url: "https://thegamesnap.com/api/me/profile",
        method: "PATCH",
        mode: "cors",
      },
    ]) {
      const respondWith = vi.fn();
      w.events.fetch({ request, respondWith });
      expect(respondWith).not.toHaveBeenCalled();
    }
  });
  it("falls back to the public reader when navigation is offline", async () => {
    const w = worker();
    let response: Promise<Response> | undefined;
    w.events.fetch({
      request: {
        url: "https://thegamesnap.com/my-snap",
        method: "GET",
        mode: "navigate",
      },
      respondWith: (r: Promise<Response>) => (response = r),
    });
    expect(await (await response!).text()).toBe("offline library");
    expect(w.match).toHaveBeenCalledWith("/offline-reader.html");
  });
  it("blocks notification links to external sites", async () => {
    const w = worker();
    w.events.notificationclick({
      notification: { close: vi.fn(), data: { href: "https://evil.test" } },
      waitUntil: vi.fn(),
    });
    expect(w.self.clients.openWindow).toHaveBeenCalledWith(
      "https://thegamesnap.com/my-snap",
    );
  });
});
