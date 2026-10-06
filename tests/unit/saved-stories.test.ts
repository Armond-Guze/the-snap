import { describe, it, expect } from "vitest";
import { parseSavedStories } from "../../lib/saved-stories";
const story = {
  href: "/articles/test-story",
  title: "Test story",
  savedAt: "2026-09-29T12:00:00Z",
};
describe("saved stories", () => {
  it("recovers from corrupted device storage", () => {
    expect(parseSavedStories("broken")).toEqual([]);
    expect(parseSavedStories("{}")).toEqual([]);
  });
  it("rejects external or unsafe links and invalid records", () => {
    expect(
      parseSavedStories(
        JSON.stringify([
          { ...story, href: "javascript:alert(1)" },
          { ...story, href: "//example.com" },
          { ...story, savedAt: "bad" },
          null,
        ]),
      ),
    ).toEqual([]);
  });
  it("preserves order while removing duplicates", () => {
    expect(
      parseSavedStories(
        JSON.stringify([story, story, { ...story, href: "/articles/another" }]),
      ).map((x) => x.href),
    ).toEqual(["/articles/test-story", "/articles/another"]);
  });
  it("bounds the saved list", () => {
    expect(
      parseSavedStories(
        JSON.stringify(
          Array.from({ length: 210 }, (_, i) => ({
            ...story,
            href: "/articles/story-" + i,
          })),
        ),
      ),
    ).toHaveLength(200);
  });
});
