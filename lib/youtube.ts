// Utility helpers to work with YouTube URLs/IDs

const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function isYouTubeId(str: string): boolean {
  return YT_ID_REGEX.test(str.trim());
}

/**
 * Extracts a YouTube video ID from either a raw ID or a full URL.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEOID
 * - https://youtu.be/VIDEOID
 * - https://www.youtube.com/shorts/VIDEOID
 * - https://www.youtube.com/embed/VIDEOID
 * - https://www.youtube.com/live/VIDEOID
 * - Raw 11-char IDs
 */
export function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (isYouTubeId(raw)) return raw;

  // Try URL parsing
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    // youtu.be/<id>
    if (host.endsWith('youtu.be')) {
      const id = path.split('/').filter(Boolean)[0];
      return isYouTubeId(id || '') ? id! : null;
    }

    // youtube.com/watch?v=<id>
    const vParam = url.searchParams.get('v');
    if (vParam && isYouTubeId(vParam)) return vParam;

    // youtube.com/shorts/<id>, /embed/<id>, /live/<id>
    const match = path.match(/\/(shorts|embed|live)\/([a-zA-Z0-9_-]{11})/);
    if (match && match[2]) return match[2];

    // Fallback: try to find any 11-char id in the whole string
    const anyId = raw.match(/[a-zA-Z0-9_-]{11}/);
    return anyId ? anyId[0] : null;
  } catch {
    // Not a URL; try to fish an ID out of the string as a last resort
    const anyId = raw.match(/[a-zA-Z0-9_-]{11}/);
    return anyId ? anyId[0] : null;
  }
}

export function youtubeWatchUrl(idOrUrl: string): string {
  const id = extractYouTubeId(idOrUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : idOrUrl;
}

export function youtubeEmbedUrl(idOrUrl: string, params: string = 'autoplay=1&rel=0&modestbranding=1'): string {
  const id = extractYouTubeId(idOrUrl);
  return id ? `https://www.youtube.com/embed/${id}?${params}` : '';
}

export function youtubeThumbnailUrl(idOrUrl: string): string {
  const id = extractYouTubeId(idOrUrl) || 'invalid';
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}
