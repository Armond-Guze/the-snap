import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Snap Writer",
  manifest: "/write/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Snap Writer" },
};

export default function WritePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-12 text-neutral-900">
      <div className="w-full max-w-md">
        <p className="text-sm font-semibold text-sky-700">The Snap · Editorial</p>
        <h1 className="mt-4 text-4xl font-bold">Ready to write?</h1>
        <p className="mt-4 leading-relaxed text-neutral-600">
          Start a fresh article or pick up a draft in Studio. Sign in with your
          authorized Sanity account to edit and publish.
        </p>
        <Link prefetch={false} href="/write/new" className="mt-8 flex min-h-12 items-center justify-center rounded-xl bg-sky-800 px-5 py-3 font-semibold text-white">
          Write an article
        </Link>
        <Link prefetch={false} href="/studio" className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 font-semibold">
          Open Studio and drafts
        </Link>
        <p className="mt-8 text-sm leading-relaxed text-neutral-600">
          Add this page to your home screen as Snap Writer. The shortcut opens a
          new article editor when you launch it. On iPhone, use Share → Add to
          Home Screen. On Android, use the browser menu → Add to Home Screen.
        </p>
        <Link prefetch={false} href="/" className="mt-6 inline-block text-sm text-sky-800 underline">Back to the site</Link>
      </div>
    </main>
  );
}

