const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const TIKTOK_USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const DECIMAL_ID_PATTERN = /^\d+$/;

function parseExactHttpsUrl(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

function pathSegments(url: URL): string[] {
  return url.pathname.split("/").filter(Boolean);
}

function hasExactHost(url: URL, hosts: readonly string[]): boolean {
  return hosts.includes(url.hostname.toLowerCase());
}

export function extractStrictYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (YOUTUBE_ID_PATTERN.test(raw)) return raw;

  const url = parseExactHttpsUrl(raw);
  if (!url) return null;
  const segments = pathSegments(url);

  if (hasExactHost(url, ["youtu.be"])) {
    return segments.length === 1 && YOUTUBE_ID_PATTERN.test(segments[0] || "")
      ? segments[0]
      : null;
  }

  if (!hasExactHost(url, ["youtube.com", "www.youtube.com", "m.youtube.com"])) {
    return null;
  }

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") || "";
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (
    segments.length === 2 &&
    ["shorts", "embed", "live"].includes(segments[0] || "") &&
    YOUTUBE_ID_PATTERN.test(segments[1] || "")
  ) {
    return segments[1];
  }

  return null;
}

export function normalizeInstagramPostUrl(input?: string | null): string | null {
  if (!input) return null;
  const url = parseExactHttpsUrl(input);
  if (!url || !hasExactHost(url, ["instagram.com", "www.instagram.com"])) return null;

  const segments = pathSegments(url);
  if (
    segments.length !== 2 ||
    !["p", "reel", "tv"].includes(segments[0] || "") ||
    !INSTAGRAM_ID_PATTERN.test(segments[1] || "")
  ) {
    return null;
  }

  return `https://www.instagram.com/${segments[0]}/${segments[1]}/`;
}

export type TikTokVideo = {
  url: string;
  videoId: string;
};

export function parseTikTokVideoUrl(input?: string | null): TikTokVideo | null {
  if (!input) return null;
  const url = parseExactHttpsUrl(input);
  if (!url || !hasExactHost(url, ["tiktok.com", "www.tiktok.com"])) return null;

  const segments = pathSegments(url);
  const username = segments[0]?.startsWith("@") ? segments[0].slice(1) : "";
  const videoId = segments[2] || "";
  if (
    segments.length !== 3 ||
    segments[1] !== "video" ||
    !TIKTOK_USERNAME_PATTERN.test(username) ||
    !DECIMAL_ID_PATTERN.test(videoId)
  ) {
    return null;
  }

  return {
    url: `https://www.tiktok.com/@${username}/video/${videoId}`,
    videoId,
  };
}

export function normalizeTikTokVideoUrl(input?: string | null): string | null {
  return parseTikTokVideoUrl(input)?.url || null;
}

export function normalizeXPostUrl(input?: string | null): string | null {
  if (!input) return null;
  const url = parseExactHttpsUrl(input);
  if (!url || !hasExactHost(url, ["x.com", "www.x.com", "twitter.com", "www.twitter.com"])) {
    return null;
  }

  const segments = pathSegments(url);
  if (
    segments.length !== 3 ||
    segments[1] !== "status" ||
    !/^[A-Za-z0-9_]{1,15}$/.test(segments[0] || "") ||
    !DECIMAL_ID_PATTERN.test(segments[2] || "")
  ) {
    return null;
  }

  return `https://x.com/${segments[0]}/status/${segments[2]}`;
}

function isStrictVimeoVideoUrl(input: string): boolean {
  const url = parseExactHttpsUrl(input);
  if (!url) return false;
  const segments = pathSegments(url);
  if (hasExactHost(url, ["vimeo.com", "www.vimeo.com"])) {
    return segments.length === 1 && DECIMAL_ID_PATTERN.test(segments[0] || "");
  }
  if (hasExactHost(url, ["player.vimeo.com"])) {
    return segments.length === 2 && segments[0] === "video" && DECIMAL_ID_PATTERN.test(segments[1] || "");
  }
  return false;
}

export function isAllowedSocialClipUrl(input?: string | null): boolean {
  if (!input) return false;
  return Boolean(
    extractStrictYouTubeId(input) ||
      normalizeInstagramPostUrl(input) ||
      parseTikTokVideoUrl(input) ||
      normalizeXPostUrl(input) ||
      isStrictVimeoVideoUrl(input)
  );
}

