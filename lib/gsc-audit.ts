import "server-only";

import crypto from "node:crypto";

import { emitMonitoringAlert } from "@/lib/monitoring/alerts";
import { powerRankingsLatestSnapshotQuery } from "@/lib/queries/power-rankings";
import { SITE_URL, toAbsoluteSiteUrl } from "@/lib/site-config";
import { client } from "@/sanity/lib/client";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_API_BASE = "https://www.googleapis.com";
const URL_INSPECTION_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const DEFAULT_LOOKBACK_DAYS = 14;
const DEFAULT_CONTENT_LIMIT = 6;
const DEFAULT_SITEMAP_STALE_DAYS = 14;
const DEFAULT_SITEMAP_URL = toAbsoluteSiteUrl("/sitemap.xml");

type AuditSeverity = "info" | "warn" | "error";

interface GscSiteEntry {
  siteUrl?: string;
  permissionLevel?: string;
}

interface GscSitesResponse {
  siteEntry?: GscSiteEntry[];
}

interface GscSitemapEntry {
  path?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  warnings?: string | number;
  errors?: string | number;
}

interface GscSitemapsResponse {
  sitemap?: GscSitemapEntry[];
}

interface SearchAnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
}

interface UrlInspectionResponse {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      robotsTxtState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      referringUrls?: string[];
    };
  };
}

interface RecentContentDoc {
  _type: string;
  title?: string;
  slug?: { current?: string };
  format?: string;
  rankingType?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
}

interface PowerRankingsSnapshotRef {
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
}

export interface GscAuditIssue {
  severity: AuditSeverity;
  code: string;
  message: string;
  url?: string;
  context?: Record<string, unknown>;
}

export interface GscAuditPageResult {
  title: string;
  url: string;
  kind: "core" | "content";
  inSitemap: boolean;
  statusCode?: number;
  redirectLocation?: string | null;
  canonicalUrl?: string | null;
  robotsMeta?: string | null;
  inspectionVerdict?: string | null;
  coverageState?: string | null;
  indexingState?: string | null;
  pageFetchState?: string | null;
  lastCrawlTime?: string | null;
  googleCanonical?: string | null;
  userCanonical?: string | null;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  issues: GscAuditIssue[];
}

export interface GscAuditReport {
  generatedAt: string;
  config: {
    configured: boolean;
    missing: string[];
    propertyUri: string;
    sitemapUrl: string;
    contentLimit: number;
    lookbackDays: number;
  };
  property: {
    accessible: boolean;
    permissionLevel?: string | null;
  };
  sitemap: {
    foundInGsc: boolean;
    path?: string | null;
    lastDownloaded?: string | null;
    warnings?: number;
    errors?: number;
    fetchedFromSite: boolean;
    totalUrls?: number;
  };
  summary: {
    checkedPages: number;
    indexedPages: number;
    warnings: number;
    errors: number;
    totalClicks: number;
    totalImpressions: number;
  };
  issues: GscAuditIssue[];
  pages: GscAuditPageResult[];
}

interface GscAuditTarget {
  title: string;
  url: string;
  kind: "core" | "content";
}

interface GscAuditConfig {
  configured: boolean;
  missing: string[];
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  propertyUri: string;
  sitemapUrl: string;
  contentLimit: number;
  lookbackDays: number;
}

interface GscAuditConfigOverrides {
  propertyUri?: string;
  sitemapUrl?: string;
  contentLimit?: number;
  lookbackDays?: number;
}

interface RunGscAuditOptions {
  emitAlerts?: boolean;
  propertyUri?: string;
  sitemapUrl?: string;
  contentLimit?: number;
  lookbackDays?: number;
}

function getPropertyUriFromSiteUrl() {
  try {
    const hostname = new URL(SITE_URL).hostname.replace(/^www\./i, "");
    return `sc-domain:${hostname}`;
  } catch {
    return SITE_URL;
  }
}

function parsePositiveInt(rawValue: string | undefined, fallbackValue: number) {
  if (!rawValue) return fallbackValue;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function getPositiveIntOverride(value: number | undefined, fallbackValue: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallbackValue;
}

function getAgeInDays(timestamp?: string | null) {
  if (!timestamp) return null;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  const ageMs = Date.now() - parsed.getTime();
  if (ageMs < 0) return 0;
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

export function getGscAuditConfig(overrides: GscAuditConfigOverrides = {}): GscAuditConfig {
  const serviceAccountEmail = process.env.GSC_SERVICE_ACCOUNT_EMAIL?.trim() || "";
  const serviceAccountPrivateKey = process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() || "";
  const propertyUri =
    overrides.propertyUri?.trim() ||
    process.env.GSC_PROPERTY_URI?.trim() ||
    getPropertyUriFromSiteUrl();
  const sitemapUrl =
    overrides.sitemapUrl?.trim() ||
    process.env.GSC_SITEMAP_URL?.trim() ||
    DEFAULT_SITEMAP_URL;
  const contentLimit = getPositiveIntOverride(
    overrides.contentLimit,
    parsePositiveInt(process.env.GSC_AUDIT_CONTENT_LIMIT, DEFAULT_CONTENT_LIMIT)
  );
  const lookbackDays = getPositiveIntOverride(
    overrides.lookbackDays,
    parsePositiveInt(process.env.GSC_AUDIT_LOOKBACK_DAYS, DEFAULT_LOOKBACK_DAYS)
  );
  const missing: string[] = [];

  if (!serviceAccountEmail) missing.push("GSC_SERVICE_ACCOUNT_EMAIL");
  if (!serviceAccountPrivateKey) missing.push("GSC_SERVICE_ACCOUNT_PRIVATE_KEY");

  return {
    configured: missing.length === 0,
    missing,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    propertyUri,
    sitemapUrl,
    contentLimit,
    lookbackDays,
  };
}

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(config: GscAuditConfig) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: config.serviceAccountEmail,
    scope: SEARCH_CONSOLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(normalizePrivateKey(config.serviceAccountPrivateKey));
  const assertion = `${signingInput}.${base64UrlEncode(signature)}`;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Google access token: ${response.status} ${errorText}`);
  }

  const payloadJson = (await response.json()) as { access_token?: string };
  if (!payloadJson.access_token) {
    throw new Error("Google access token response did not include access_token");
  }

  return payloadJson.access_token;
}

async function searchConsoleRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {}
) {
  const response = await fetch(`${SEARCH_CONSOLE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Search Console request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

async function inspectUrl(
  accessToken: string,
  propertyUri: string,
  url: string
) {
  const response = await fetch(URL_INSPECTION_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl: url,
      siteUrl: propertyUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`URL inspection failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as UrlInspectionResponse;
}

function normalizeComparableUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    parsed.search = "";
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

function resolveRedirectLocation(sourceUrl: string, location: string | null) {
  if (!location) return null;

  try {
    return new URL(location, sourceUrl).toString();
  } catch {
    return location;
  }
}

function resolveMaybeRelativeUrl(sourceUrl: string, candidate: string | null) {
  if (!candidate) return null;

  try {
    return new URL(candidate, sourceUrl).toString();
  } catch {
    return candidate;
  }
}

function parseCanonicalUrl(html: string) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  return match?.[1] || null;
}

function parseRobotsMeta(html: string) {
  const match = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  return match?.[1] || null;
}

function buildPowerRankingsSnapshotUrl(snapshot?: PowerRankingsSnapshotRef | null) {
  if (!snapshot?.seasonYear) return null;

  const weekPart = snapshot.playoffRound
    ? snapshot.playoffRound.toLowerCase()
    : typeof snapshot.weekNumber === "number"
      ? `week-${snapshot.weekNumber}`
      : null;

  if (!weekPart) return null;

  return toAbsoluteSiteUrl(`/articles/power-rankings/${snapshot.seasonYear}/${weekPart}`);
}

function decodeXmlValue(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseSitemapUrls(xml: string) {
  const urls = new Set<string>();
  const locPattern = /<loc>(.*?)<\/loc>/gi;
  let match = locPattern.exec(xml);

  while (match) {
    const candidate = decodeXmlValue(match[1] || "").trim();
    if (candidate) {
      urls.add(normalizeComparableUrl(candidate));
    }
    match = locPattern.exec(xml);
  }

  return urls;
}

function toNumericCount(value: string | number | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function buildContentUrl(doc: RecentContentDoc) {
  const slug = doc.slug?.current?.trim();
  if (!slug) return null;

  if (doc._type === "article" && doc.format === "powerRankings") {
    if (doc.rankingType === "snapshot") {
      return buildPowerRankingsSnapshotUrl(doc);
    }

    return null;
  }

  return toAbsoluteSiteUrl(`/articles/${slug}`);
}

async function fetchRecentTargets(limit: number): Promise<GscAuditTarget[]> {
  const docs = await client.fetch<RecentContentDoc[]>(
    `*[
      (_type in ["article", "headline", "rankings"]) &&
      published == true &&
      defined(slug.current) &&
      (!defined(seo.noIndex) || seo.noIndex == false)
    ]
      | order(coalesce(date, publishedAt, _updatedAt, _createdAt) desc)[0...$limit] {
        _type,
        title,
        slug,
        format,
        rankingType,
        seasonYear,
        weekNumber,
        playoffRound
      }`,
    { limit }
  );
  const includesLivePowerRankings = docs.some(
    (doc) => doc._type === "article" && doc.format === "powerRankings" && doc.rankingType === "live"
  );
  const latestPowerRankingsSnapshot = includesLivePowerRankings
    ? await client.fetch<PowerRankingsSnapshotRef | null>(powerRankingsLatestSnapshotQuery)
    : null;

  const coreTargets: GscAuditTarget[] = [
    { title: "Homepage", url: toAbsoluteSiteUrl("/"), kind: "core" },
    { title: "Articles", url: toAbsoluteSiteUrl("/articles"), kind: "core" },
    { title: "Headlines", url: toAbsoluteSiteUrl("/headlines"), kind: "core" },
    { title: "Fantasy", url: toAbsoluteSiteUrl("/fantasy"), kind: "core" },
    { title: "Standings", url: toAbsoluteSiteUrl("/standings"), kind: "core" },
    { title: "Schedule", url: toAbsoluteSiteUrl("/schedule"), kind: "core" },
  ];

  const mappedContentTargets = docs.map((doc) => {
    const url =
      doc._type === "article" && doc.format === "powerRankings" && doc.rankingType === "live"
        ? buildPowerRankingsSnapshotUrl(latestPowerRankingsSnapshot)
        : buildContentUrl(doc);
    if (!url) return null;
    return {
      title: doc.title?.trim() || url,
      url,
      kind: "content" as const,
    };
  });

  const contentTargets = mappedContentTargets.filter(
    (target) => target !== null
  ) as GscAuditTarget[];

  const deduped = new Map<string, GscAuditTarget>();
  for (const target of [...coreTargets, ...contentTargets]) {
    const normalizedUrl = normalizeComparableUrl(target.url);
    if (!deduped.has(normalizedUrl)) {
      deduped.set(normalizedUrl, { ...target, url: normalizedUrl });
    }
  }

  return Array.from(deduped.values());
}

async function fetchSitemapSnapshot(sitemapUrl: string) {
  const response = await fetch(sitemapUrl, {
    headers: { "user-agent": "TheSnap-GSCAudit/1.0" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap.xml: ${response.status}`);
  }

  const xml = await response.text();
  const urls = parseSitemapUrls(xml);

  return {
    fetchedFromSite: true,
    urls,
  };
}

async function fetchPerformanceMap(
  accessToken: string,
  propertyUri: string,
  lookbackDays: number
) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setUTCDate(endDate.getUTCDate() - lookbackDays);

  const body = {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    dimensions: ["page"],
    rowLimit: 250,
    dataState: "all",
  };

  const encodedProperty = encodeURIComponent(propertyUri);
  const response = await searchConsoleRequest<SearchAnalyticsResponse>(
    accessToken,
    `/webmasters/v3/sites/${encodedProperty}/searchAnalytics/query`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  const performanceMap = new Map<
    string,
    { clicks: number; impressions: number; ctr: number; position: number }
  >();

  for (const row of response.rows || []) {
    const pageKey = row.keys?.[0];
    if (!pageKey) continue;
    performanceMap.set(normalizeComparableUrl(pageKey), {
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    });
  }

  return performanceMap;
}

async function auditPage(
  accessToken: string,
  propertyUri: string,
  target: GscAuditTarget,
  sitemapUrls: Set<string>,
  performanceMap: Map<string, { clicks: number; impressions: number; ctr: number; position: number }>
) {
  const issues: GscAuditIssue[] = [];
  const normalizedUrl = normalizeComparableUrl(target.url);
  const inSitemap = sitemapUrls.has(normalizedUrl);

  if (!inSitemap) {
    issues.push({
      severity: "warn",
      code: "SITEMAP_MISSING_URL",
      message: "URL was not found in sitemap.xml",
      url: normalizedUrl,
    });
  }

  let statusCode: number | undefined;
  let redirectLocation: string | null = null;
  let canonicalUrl: string | null = null;
  let robotsMeta: string | null = null;

  try {
    const pageResponse = await fetch(normalizedUrl, {
      headers: { "user-agent": "TheSnap-GSCAudit/1.0" },
      redirect: "manual",
      cache: "no-store",
    });

    statusCode = pageResponse.status;
    redirectLocation = resolveRedirectLocation(normalizedUrl, pageResponse.headers.get("location"));

    if (pageResponse.status >= 300 && pageResponse.status < 400) {
      issues.push({
        severity: "error",
        code: "PAGE_REDIRECT",
        message: "Page responds with a redirect instead of a final 200 URL",
        url: normalizedUrl,
        context: { redirectLocation },
      });
    } else if (pageResponse.status !== 200) {
      issues.push({
        severity: "error",
        code: "PAGE_STATUS_NOT_OK",
        message: `Page returned HTTP ${pageResponse.status}`,
        url: normalizedUrl,
      });
    } else {
      const html = await pageResponse.text();
      canonicalUrl = resolveMaybeRelativeUrl(normalizedUrl, parseCanonicalUrl(html));
      robotsMeta = parseRobotsMeta(html);

      if (!canonicalUrl) {
        issues.push({
          severity: "warn",
          code: "CANONICAL_MISSING",
          message: "Canonical tag is missing",
          url: normalizedUrl,
        });
      } else if (normalizeComparableUrl(canonicalUrl) !== normalizedUrl) {
        issues.push({
          severity: "error",
          code: "CANONICAL_MISMATCH",
          message: "Canonical URL does not match the page URL",
          url: normalizedUrl,
          context: { canonicalUrl },
        });
      }

      if (robotsMeta?.toLowerCase().includes("noindex")) {
        issues.push({
          severity: "error",
          code: "ROBOTS_NOINDEX",
          message: "Page has a noindex robots directive",
          url: normalizedUrl,
          context: { robotsMeta },
        });
      }
    }
  } catch (error) {
    issues.push({
      severity: "error",
      code: "PAGE_FETCH_FAILED",
      message: "Could not fetch page HTML during audit",
      url: normalizedUrl,
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  let inspectionVerdict: string | null = null;
  let coverageState: string | null = null;
  let indexingState: string | null = null;
  let pageFetchState: string | null = null;
  let lastCrawlTime: string | null = null;
  let googleCanonical: string | null = null;
  let userCanonical: string | null = null;

  try {
    const inspection = await inspectUrl(accessToken, propertyUri, normalizedUrl);
    const status = inspection.inspectionResult?.indexStatusResult;

    inspectionVerdict = status?.verdict || null;
    coverageState = status?.coverageState || null;
    indexingState = status?.indexingState || null;
    pageFetchState = status?.pageFetchState || null;
    lastCrawlTime = status?.lastCrawlTime || null;
    googleCanonical = status?.googleCanonical || null;
    userCanonical = status?.userCanonical || null;

    if (inspectionVerdict && inspectionVerdict !== "PASS") {
      issues.push({
        severity: "warn",
        code: "URL_INSPECTION_NOT_PASSING",
        message: `URL inspection verdict is ${inspectionVerdict}`,
        url: normalizedUrl,
        context: { coverageState, indexingState },
      });
    }

    if (
      pageFetchState &&
      !["SUCCESS", "SUCCESSFUL", "PAGE_FETCH_STATE_UNSPECIFIED"].includes(pageFetchState)
    ) {
      issues.push({
        severity: "error",
        code: "GOOGLE_FETCH_FAILED",
        message: `Google reports page fetch state ${pageFetchState}`,
        url: normalizedUrl,
      });
    }

    if (googleCanonical && normalizeComparableUrl(googleCanonical) !== normalizedUrl) {
      issues.push({
        severity: "warn",
        code: "GOOGLE_CANONICAL_MISMATCH",
        message: "Google-selected canonical differs from the inspected URL",
        url: normalizedUrl,
        context: { googleCanonical },
      });
    }
  } catch (error) {
    issues.push({
      severity: "warn",
      code: "URL_INSPECTION_FAILED",
      message: "URL inspection API request failed",
      url: normalizedUrl,
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  const performance = performanceMap.get(normalizedUrl);

  return {
    title: target.title,
    url: normalizedUrl,
    kind: target.kind,
    inSitemap,
    statusCode,
    redirectLocation,
    canonicalUrl,
    robotsMeta,
    inspectionVerdict,
    coverageState,
    indexingState,
    pageFetchState,
    lastCrawlTime,
    googleCanonical,
    userCanonical,
    clicks: performance?.clicks || 0,
    impressions: performance?.impressions || 0,
    ctr: performance?.ctr || 0,
    position: performance?.position || 0,
    issues,
  } satisfies GscAuditPageResult;
}

export async function runGscAudit(
  options: RunGscAuditOptions = {}
): Promise<GscAuditReport> {
  const config = getGscAuditConfig(options);
  const generatedAt = new Date().toISOString();
  const topLevelIssues: GscAuditIssue[] = [];

  if (!config.configured) {
    topLevelIssues.push({
      severity: "error",
      code: "GSC_CONFIG_MISSING",
      message: "Google Search Console audit is not fully configured",
      context: { missing: config.missing },
    });

    return {
      generatedAt,
      config: {
        configured: config.configured,
        missing: config.missing,
        propertyUri: config.propertyUri,
        sitemapUrl: config.sitemapUrl,
        contentLimit: config.contentLimit,
        lookbackDays: config.lookbackDays,
      },
      property: {
        accessible: false,
        permissionLevel: null,
      },
      sitemap: {
        foundInGsc: false,
        path: null,
        lastDownloaded: null,
        warnings: 0,
        errors: 0,
        fetchedFromSite: false,
      },
      summary: {
        checkedPages: 0,
        indexedPages: 0,
        warnings: 0,
        errors: 1,
        totalClicks: 0,
        totalImpressions: 0,
      },
      issues: topLevelIssues,
      pages: [],
    };
  }

  try {
    const [accessToken, targets] = await Promise.all([
      getAccessToken(config),
      fetchRecentTargets(config.contentLimit),
    ]);

    const encodedProperty = encodeURIComponent(config.propertyUri);

    const [sitesResponse, sitemapsResponse, sitemapSnapshot, performanceMap] = await Promise.all([
      searchConsoleRequest<GscSitesResponse>(accessToken, "/webmasters/v3/sites"),
      searchConsoleRequest<GscSitemapsResponse>(
        accessToken,
        `/webmasters/v3/sites/${encodedProperty}/sitemaps`
      ),
      fetchSitemapSnapshot(config.sitemapUrl),
      fetchPerformanceMap(accessToken, config.propertyUri, config.lookbackDays),
    ]);

    const matchingSite = (sitesResponse.siteEntry || []).find(
      (entry) => entry.siteUrl === config.propertyUri
    );

    if (!matchingSite) {
      topLevelIssues.push({
        severity: "error",
        code: "PROPERTY_ACCESS_MISSING",
        message: "Service account does not appear to have access to the configured property",
        context: { propertyUri: config.propertyUri },
      });
    }

    const sitemapEntry =
      (sitemapsResponse.sitemap || []).find((entry) => entry.path === config.sitemapUrl) ||
      (sitemapsResponse.sitemap || [])[0] ||
      null;

    if (!sitemapEntry) {
      topLevelIssues.push({
        severity: "warn",
        code: "SITEMAP_NOT_REGISTERED",
        message: "No sitemap entry was found in Search Console for this property",
        context: { sitemapUrl: config.sitemapUrl },
      });
    } else {
      const sitemapAgeDays = getAgeInDays(sitemapEntry.lastDownloaded || null);
      if (typeof sitemapAgeDays === "number" && sitemapAgeDays > DEFAULT_SITEMAP_STALE_DAYS) {
        topLevelIssues.push({
          severity: "warn",
          code: "SITEMAP_STALE_IN_GSC",
          message: `Search Console last downloaded the sitemap ${sitemapAgeDays} day(s) ago`,
          context: {
            sitemapUrl: config.sitemapUrl,
            lastDownloaded: sitemapEntry.lastDownloaded,
            thresholdDays: DEFAULT_SITEMAP_STALE_DAYS,
          },
        });
      }
    }

    const pages = await Promise.all(
      targets.map((target) =>
        auditPage(accessToken, config.propertyUri, target, sitemapSnapshot.urls, performanceMap)
      )
    );

    const flattenedPageIssues = pages.flatMap((page) => page.issues);
    const allIssues = [...topLevelIssues, ...flattenedPageIssues];
    const warnings = allIssues.filter((issue) => issue.severity === "warn").length;
    const errors = allIssues.filter((issue) => issue.severity === "error").length;
    const indexedPages = pages.filter((page) => page.inspectionVerdict === "PASS").length;
    const totalClicks = pages.reduce((sum, page) => sum + (page.clicks || 0), 0);
    const totalImpressions = pages.reduce((sum, page) => sum + (page.impressions || 0), 0);

    const report: GscAuditReport = {
      generatedAt,
      config: {
        configured: config.configured,
        missing: config.missing,
        propertyUri: config.propertyUri,
        sitemapUrl: config.sitemapUrl,
        contentLimit: config.contentLimit,
        lookbackDays: config.lookbackDays,
      },
      property: {
        accessible: Boolean(matchingSite),
        permissionLevel: matchingSite?.permissionLevel || null,
      },
      sitemap: {
        foundInGsc: Boolean(sitemapEntry),
        path: sitemapEntry?.path || null,
        lastDownloaded: sitemapEntry?.lastDownloaded || null,
        warnings: toNumericCount(sitemapEntry?.warnings),
        errors: toNumericCount(sitemapEntry?.errors),
        fetchedFromSite: sitemapSnapshot.fetchedFromSite,
        totalUrls: sitemapSnapshot.urls.size,
      },
      summary: {
        checkedPages: pages.length,
        indexedPages,
        warnings,
        errors,
        totalClicks,
        totalImpressions,
      },
      issues: allIssues,
      pages,
    };

    if (options.emitAlerts !== false && errors > 0) {
      await emitMonitoringAlert({
        source: "gsc-audit",
        code: "GSC_AUDIT_ERRORS_FOUND",
        severity: "error",
        message: `Search Console audit found ${errors} error(s) and ${warnings} warning(s)`,
        context: {
          propertyUri: config.propertyUri,
          checkedPages: pages.length,
        },
      });
    }

    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (options.emitAlerts !== false) {
      await emitMonitoringAlert({
        source: "gsc-audit",
        code: "GSC_AUDIT_FAILED",
        severity: "error",
        message: "Search Console audit failed to complete",
        context: { error: message },
      });
    }

    return {
      generatedAt,
      config: {
        configured: config.configured,
        missing: config.missing,
        propertyUri: config.propertyUri,
        sitemapUrl: config.sitemapUrl,
        contentLimit: config.contentLimit,
        lookbackDays: config.lookbackDays,
      },
      property: {
        accessible: false,
        permissionLevel: null,
      },
      sitemap: {
        foundInGsc: false,
        path: null,
        lastDownloaded: null,
        warnings: 0,
        errors: 0,
        fetchedFromSite: false,
      },
      summary: {
        checkedPages: 0,
        indexedPages: 0,
        warnings: 0,
        errors: 1,
        totalClicks: 0,
        totalImpressions: 0,
      },
      issues: [
        {
          severity: "error",
          code: "GSC_AUDIT_EXCEPTION",
          message: message,
        },
      ],
      pages: [],
    };
  }
}
