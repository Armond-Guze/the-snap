export type SavedStory = { href: string; title: string; savedAt: string };
export const SAVED_STORIES_KEY = "snap.saved-stories.v1";
export function parseSavedStories(raw: string | null): SavedStory[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value
      .filter((item): item is SavedStory => {
        if (
          !item ||
          typeof item.href !== "string" ||
          !/^\/articles\/[a-zA-Z0-9_-]+$/.test(item.href) ||
          typeof item.title !== "string" ||
          !item.title.trim() ||
          item.title.length > 500 ||
          typeof item.savedAt !== "string" ||
          !Number.isFinite(Date.parse(item.savedAt)) ||
          seen.has(item.href)
        )
          return false;
        seen.add(item.href);
        return true;
      })
      .slice(0, 200);
  } catch {
    return [];
  }
}
