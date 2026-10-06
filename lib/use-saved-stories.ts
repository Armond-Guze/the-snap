"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useUser } from "@clerk/nextjs";
import {
  parseSavedStories,
  SAVED_STORIES_KEY,
  type SavedStory,
} from "./saved-stories";
const EVENT = "snap-saved-stories";
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(SAVED_STORIES_KEY) || "[]";
  } catch {
    return "[]";
  }
}
async function request(
  method: string,
  story?: { href: string; title?: string },
) {
  const response = await fetch("/api/me/saved-stories", {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...(story ? { body: JSON.stringify(story) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Could not sync stories. Please retry online.",
    );
  return data;
}
export function useSavedStories() {
  const { isLoaded, isSignedIn, user } = useUser();
  const owner = isSignedIn ? user.id : "";
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const local = useMemo(() => parseSavedStories(raw), [raw]);
  const [remote, setRemote] = useState<{
    owner: string;
    stories: SavedStory[];
    error: string;
    ready: boolean;
  }>({ owner: "", stories: [], error: "", ready: false });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!owner) return;
    let cancelled = false;
    let generation = 0;
    async function refresh() {
      const ticket = ++generation;
      try {
        const data = await request("GET");
        if (!cancelled && ticket === generation)
          setRemote({
            owner,
            stories: parseSavedStories(JSON.stringify(data.stories)),
            error: "",
            ready: true,
          });
      } catch (error) {
        if (!cancelled && ticket === generation)
          setRemote((previous) => ({
            owner,
            stories: previous.owner === owner ? previous.stories : [],
            error: (error as Error).message,
            ready: false,
          }));
      }
    }
    void refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [owner]);
  const change = useCallback(
    async (story: { href: string; title: string }, remove: boolean) => {
      if (!isLoaded) throw new Error("Please wait for sign-in to finish.");
      setBusy(true);
      try {
        if (owner) {
          await request(remove ? "DELETE" : "PUT", story);
          const data = await request("GET");
          setRemote({
            owner,
            stories: parseSavedStories(JSON.stringify(data.stories)),
            error: "",
            ready: true,
          });
        } else {
          const current = parseSavedStories(snapshot());
          if (
            !remove &&
            !current.some((s) => s.href === story.href) &&
            current.length >= 200
          )
            throw new Error("Your list is full. Remove a story first.");
          localStorage.setItem(
            SAVED_STORIES_KEY,
            JSON.stringify(
              remove
                ? current.filter((s) => s.href !== story.href)
                : [
                    { ...story, savedAt: new Date().toISOString() },
                    ...current.filter((s) => s.href !== story.href),
                  ],
            ),
          );
        }
        window.dispatchEvent(new Event(EVENT));
      } finally {
        setBusy(false);
      }
    },
    [owner, isLoaded],
  );
  async function importLocal() {
    setBusy(true);
    try {
      if (!owner) throw new Error("Sign in before importing stories.");
      const existing = new Set(
        remote.owner === owner ? remote.stories.map((s) => s.href) : [],
      );
      for (const story of local) {
        if (!existing.has(story.href)) await request("PUT", story);
        // Remove each successfully imported item; retries resume without losing the remainder.
        localStorage.setItem(
          SAVED_STORIES_KEY,
          JSON.stringify(
            parseSavedStories(snapshot()).filter((s) => s.href !== story.href),
          ),
        );
      }
    } finally {
      window.dispatchEvent(new Event(EVENT));
      setBusy(false);
    }
  }
  return {
    stories: owner ? (remote.owner === owner ? remote.stories : []) : local,
    local,
    change,
    importLocal,
    busy,
    loading:
      !isLoaded || Boolean(owner && (remote.owner !== owner || !remote.ready)),
    signedIn: Boolean(owner),
    error: owner && remote.owner === owner ? remote.error : "",
  };
}
