// Utility helpers to work with strictly validated YouTube URLs/IDs.
import { extractStrictYouTubeId } from './embed-urls';

export function isYouTubeId(str: string): boolean {
  const raw = str.trim();
  return extractStrictYouTubeId(raw) === raw;
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
  return extractStrictYouTubeId(input);
}

export function youtubeWatchUrl(idOrUrl: string): string {
  const id = extractYouTubeId(idOrUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : 'https://www.youtube.com/';
}

export function youtubeEmbedUrl(idOrUrl: string, params: string = 'autoplay=1&rel=0&modestbranding=1'): string {
  const id = extractYouTubeId(idOrUrl);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?${params}` : '';
}

export function youtubeThumbnailUrl(idOrUrl: string): string {
  const id = extractYouTubeId(idOrUrl) || 'invalid';
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}
