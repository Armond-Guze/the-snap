const FALLBACK_SITE_URL = "https://thegamesnap.com";
const DEPLOYMENT_ASSET_VERSION =
  process.env.NEXT_PUBLIC_ASSET_VERSION?.trim() ||
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
  "";

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
export const BRAND_LOGO_PATH = "/images/thesnap-logo-website.png";
export const BRAND_LOGO_ALT = "The Snap";
export const DEFAULT_OG_IMAGE_PATH = "/images/thesnap-logo-website.orig.png";
export const FAVICON_PATH = "/favicon.svg";

export function versionedAssetPath(path: string): string {
  if (!path || !DEPLOYMENT_ASSET_VERSION) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${DEPLOYMENT_ASSET_VERSION}`;
}

export const DEFAULT_OG_IMAGE_URL = `${SITE_URL}${versionedAssetPath(DEFAULT_OG_IMAGE_PATH)}`;

export function toAbsoluteSiteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
