import { describe, it, expect } from "vitest";
import { validPushEndpoint, validPushKeys } from "@/lib/push-validation";
describe("push destination validation", () => {
  it("permits known push services", () => {
    for (const host of [
      "fcm.googleapis.com",
      "updates.push.services.mozilla.com",
      "web.push.apple.com",
    ])
      expect(validPushEndpoint("https://" + host + "/endpoint")).toBe(true);
  });
  it("rejects private hosts, credentials and lookalike domains", () => {
    for (const url of [
      "http://fcm.googleapis.com/x",
      "https://127.0.0.1/x",
      "https://fcm.googleapis.com.evil.test/x",
      "https://user:pass@fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8080/x",
      "file:///etc/passwd",
    ])
      expect(validPushEndpoint(url)).toBe(false);
  });
  it("requires bounded base64url subscription keys", () => {
    expect(
      validPushKeys({ p256dh: "B".repeat(87), auth: "A".repeat(22) }),
    ).toBe(true);
    expect(validPushKeys({ p256dh: "bad", auth: "bad" })).toBe(false);
    expect(validPushKeys(null)).toBe(false);
  });
});
