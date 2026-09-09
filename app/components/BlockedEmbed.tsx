"use client";

import {
  normalizeInstagramPostUrl,
  normalizeTikTokVideoUrl,
  normalizeXPostUrl,
} from "@/lib/embed-urls";
import { youtubeWatchUrl, extractYouTubeId } from "@/lib/youtube";
import { openConsentPreferences } from "./consent";

type BlockedEmbedProps = {
  service: string;
  href: string | null;
  className?: string;
  invalid?: boolean;
};

function safeServiceHref(service: string, href: string | null): string | null {
  if (!href) return null;
  if (service === "Instagram") return normalizeInstagramPostUrl(href);
  if (service === "TikTok") return normalizeTikTokVideoUrl(href);
  if (service === "YouTube") return extractYouTubeId(href) ? youtubeWatchUrl(href) : null;
  if (service === "X") return normalizeXPostUrl(href);
  return null;
}

export default function BlockedEmbed({
  service,
  href,
  className = "",
  invalid = false,
}: BlockedEmbedProps) {
  const safeHref = safeServiceHref(service, href);
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center ${className}`}>
      <p className="font-semibold text-white">
        {invalid ? `Invalid ${service} link` : `${service} content is blocked`}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/60">
        {invalid
          ? "This embed URL is not an allowed public post or video URL."
          : "This third-party content can set cookies or receive device information. Enable optional services to load it here."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {!invalid && (
          <button
            type="button"
            onClick={openConsentPreferences}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
          >
            Cookie preferences
          </button>
        )}
        {safeHref && (
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Open on {service}
          </a>
        )}
      </div>
    </div>
  );
}
