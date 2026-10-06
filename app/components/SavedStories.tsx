"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Trash2, Download } from "lucide-react";
import { useSavedStories } from "@/lib/use-saved-stories";
import { downloadStory, OFFLINE_CACHE } from "@/lib/offline-reading";
const button =
  "inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-[#032c57] hover:bg-slate-50 disabled:opacity-50";
export function SaveStoryButton({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  const {
    stories,
    change,
    busy,
    loading,
    error: syncError,
  } = useSavedStories();
  const saved = stories.some((s) => s.href === href);
  const [error, setError] = useState("");
  return (
    <div className="my-4">
      <button
        type="button"
        disabled={busy || loading}
        onClick={async () => {
          try {
            await change({ href, title }, saved);
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        aria-pressed={saved}
        className={button}
      >
        {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}{" "}
        {busy ? "Saving…" : saved ? "Saved" : "Save story"}
      </button>
      <span role="status" className="ml-3 text-xs text-neutral-600">
        {error || syncError}
      </span>
    </div>
  );
}
function DownloadStory({ href }: { href: string }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    if ("caches" in window)
      void caches
        .open(OFFLINE_CACHE)
        .then((c) => c.match(href))
        .then((r) => {
          if (active) setReady(Boolean(r));
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [href]);
  return (
    <div className="mt-2">
      <button
        className="text-sm font-medium text-[#032c57] underline underline-offset-4 disabled:opacity-50"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            if (ready) {
              await (await caches.open(OFFLINE_CACHE)).delete(href);
              setReady(false);
              setMessage("Download removed.");
            } else {
              await downloadStory(href);
              setReady(true);
              setMessage("Text saved for offline reading.");
            }
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Working…"
          : ready
            ? "Remove download"
            : "Download text for offline"}
      </button>
      {ready && (
        <a
          className="ml-3 text-sm underline"
          href={"/offline-reader.html?story=" + encodeURIComponent(href)}
        >
          Read offline copy
        </a>
      )}
      <span role="status" className="mt-1 block text-xs text-neutral-600">
        {message}
      </span>
    </div>
  );
}
export default function SavedStories() {
  const {
    stories,
    local,
    change,
    importLocal,
    busy,
    loading,
    signedIn,
    error: syncError,
  } = useSavedStories();
  const [error, setError] = useState("");
  return (
    <section aria-labelledby="saved-heading" className="mt-10">
      <h2 id="saved-heading" className="text-2xl font-bold">
        Saved stories{" "}
        <span className="text-base font-normal text-neutral-500">
          ({stories.length})
        </span>
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        {signedIn
          ? "Your reading list syncs with your account."
          : "Saved on this device. Sign in to sync new saves across devices."}{" "}
        Downloads stay on this device.
      </p>
      <a
        href="/offline-reader.html"
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#032c57] underline"
      >
        <Download size={16} />
        Open offline library
      </a>
      {signedIn && local.length > 0 && (
        <div className="mt-4">
          <button
            className={button}
            disabled={busy || loading}
            onClick={async () => {
              try {
                await importLocal();
                setError("Device saves added to your account.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Add {local.length} device saves to my account
          </button>
        </div>
      )}
      <p role="status" className="mt-3 text-sm text-neutral-600">
        {error || syncError || (loading ? "Loading saved stories…" : "")}
      </p>
      {stories.length ? (
        <ul className="mt-5 divide-y divide-neutral-200">
          {stories.map((story) => (
            <li key={story.href} className="flex items-start gap-3 py-5">
              <div className="min-w-0 flex-1">
                <Link
                  className="font-semibold hover:underline underline-offset-4"
                  href={story.href}
                >
                  {story.title}
                </Link>
                <DownloadStory href={story.href} />
              </div>
              <button
                disabled={busy || loading}
                className="rounded-full p-3 hover:bg-neutral-100"
                aria-label={"Remove " + story.title + " from saved stories"}
                onClick={async () => {
                  try {
                    await change(story, true);
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !loading && (
          <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 p-8">
            <Bookmark className="mb-3 text-[#032c57]" />
            <h3 className="font-semibold">Keep a story for later</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Tap Save story on an article to find it here.
            </p>
            <Link
              className="mt-4 inline-block font-semibold text-[#032c57] underline"
              href="/headlines"
            >
              Explore headlines
            </Link>
          </div>
        )
      )}
    </section>
  );
}
