const FALLBACK_SITE_URL = "https://thegamesnap.com";

function normalizeSiteUrl(url?: string | null): string {
  const candidate = (url || "").trim();
  if (!candidate) return FALLBACK_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  return withProtocol.replace(/\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_BRAND = "The Game Snap";
export const SITE_NAME = "The Snap";
export const SITE_TWITTER = "@thesnapfootball";
export const DEFAULT_OG_IMAGE_PATH = "/images/thesnap-logo-website.png";
export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;

export function toAbsoluteSiteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
