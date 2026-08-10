#!/usr/bin/env node

import assert from "node:assert/strict";
import { createClient } from "@sanity/client";

import {
  createGscClient,
  getGscClientConfigStatus,
  type GscClient,
  type GscSearchAnalyticsRow,
  type GscSearchDimension,
} from "../lib/gsc-client";

const args = process.argv.slice(2);
const JSON_OUTPUT = args.includes("--json");
const CHECK_CONFIG = args.includes("--check-config");
const SELF_TEST = args.includes("--self-test");
const SITE_URL = (process.env.SITE_URL || "https://thegamesnap.com").replace(/\/+$/, "");
const PROPERTY_URI = process.env.GSC_PROPERTY_URI || "sc-domain:thegamesnap.com";
const READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const WINDOW_DAYS = boundedInteger(process.env.GSC_OPPORTUNITY_WINDOW_DAYS, 28, 14, 90);
const DATA_LAG_DAYS = boundedInteger(process.env.GSC_OPPORTUNITY_DATA_LAG_DAYS, 3, 2, 7);
const ROW_LIMIT = boundedInteger(process.env.GSC_OPPORTUNITY_ROW_LIMIT, 25_000, 1_000, 25_000);
const MAX_QUERY_PAGES = boundedInteger(process.env.GSC_OPPORTUNITY_MAX_QUERY_PAGES, 4, 1, 4);
const MAX_OPPORTUNITIES = boundedInteger(process.env.GSC_OPPORTUNITY_MAX_RESULTS, 8, 1, 15);
const MIN_CURRENT_IMPRESSIONS = 15;
const MIN_BASELINE_IMPRESSIONS = 30;

type OpportunityKind =
  | "striking-distance"
  | "snippet-gap"
  | "emerging"
  | "decay"
  | "authority-intent"
  | "content-gap";

type Confidence = "high" | "medium";

interface DateWindow {
  startDate: string;
  endDate: string;
}

interface Metric {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface ContentDoc {
  _id: string;
  title: string;
  homepageTitle?: string;
  summary?: string;
  format?: string;
  date?: string;
  slug?: { current?: string };
}

interface QueryEvidence {
  query: string;
  current: Metric;
  previous: Metric;
  trailing90: Metric;
}

interface Opportunity {
  rank?: number;
  score: number;
  confidence: Confidence;
  kind: OpportunityKind;
  title: string;
  url: string;
  sanityId?: string;
  format?: string;
  current: Metric;
  previous: Metric;
  trailing90: Metric;
  signals: string[];
  topQueries: QueryEvidence[];
  suggestedAction: string;
  evidenceNeeded: string;
}

interface CannibalizationOpportunity {
  query: string;
  score: number;
  metrics: Metric;
  pages: Array<{ url: string; title: string; impressions: number; position: number }>;
  suggestedAction: string;
}

interface WindowRows {
  property: GscSearchAnalyticsRow[];
  page: GscSearchAnalyticsRow[];
  pageQuery: GscSearchAnalyticsRow[];
  truncated: { property: boolean; page: boolean; pageQuery: boolean };
}

interface OpportunityReport {
  generatedAt: string;
  dataThrough: string;
  directionalDataNote: string;
  windows: {
    current: DateWindow;
    previous: DateWindow;
    trailing90: DateWindow;
  };
  coverage: {
    rowLimit: number;
    current: WindowRows["truncated"];
    previous: WindowRows["truncated"];
    trailing90: WindowRows["truncated"];
  };
  siteTotals: {
    current: Metric;
    previous: Metric;
    trailing90: Metric;
  };
  opportunities: Opportunity[];
  cannibalization: CannibalizationOpportunity[];
}

const UTILITY_ROUTES = new Map([
  ["/", "Homepage"],
  ["/articles", "Articles hub"],
  ["/fantasy", "Fantasy hub"],
  ["/headlines", "Headlines hub"],
  ["/schedule", "NFL schedule"],
  ["/standings", "NFL standings"],
  ["/calendar", "NFL calendar"],
  ["/rankings", "Rankings hub"],
]);

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value, SITE_URL);
    url.protocol = "https:";
    url.hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    url.hash = "";
    url.search = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return value.trim();
  }
}

function opportunityLandingPage(value: string) {
  try {
    const candidate = new URL(value);
    const site = new URL(SITE_URL);
    if (candidate.hostname.replace(/^www\./i, "") !== site.hostname.replace(/^www\./i, "")) {
      return false;
    }
    return !/^\/(?:admin|api|account|sign-in|sign-up|privacy-policy|privacypolicy|terms|contact|about)(?:\/|$)/i.test(
      candidate.pathname
    );
  } catch {
    return false;
  }
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function pacificCalendarDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function ageInDays(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    ? Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000))
    : Number.POSITIVE_INFINITY;
}

function buildWindows() {
  const dataThrough = shiftDays(pacificCalendarDate(), -DATA_LAG_DAYS);
  const current = {
    startDate: isoDate(shiftDays(dataThrough, -(WINDOW_DAYS - 1))),
    endDate: isoDate(dataThrough),
  };
  const previousEnd = shiftDays(new Date(`${current.startDate}T00:00:00Z`), -1);
  const previous = {
    startDate: isoDate(shiftDays(previousEnd, -(WINDOW_DAYS - 1))),
    endDate: isoDate(previousEnd),
  };
  const trailing90 = {
    startDate: isoDate(shiftDays(dataThrough, -89)),
    endDate: isoDate(dataThrough),
  };
  return { dataThrough: isoDate(dataThrough), current, previous, trailing90 };
}

function metricFromRow(row?: GscSearchAnalyticsRow): Metric {
  return {
    clicks: row?.clicks || 0,
    impressions: row?.impressions || 0,
    ctr: row?.ctr || 0,
    position: row?.position || 0,
  };
}

function combineMetrics(metrics: Metric[]): Metric {
  const clicks = metrics.reduce((sum, metric) => sum + metric.clicks, 0);
  const impressions = metrics.reduce((sum, metric) => sum + metric.impressions, 0);
  const weightedPosition = metrics.reduce(
    (sum, metric) => sum + metric.position * metric.impressions,
    0
  );
  return {
    clicks,
    impressions,
    ctr: impressions ? clicks / impressions : 0,
    position: impressions ? weightedPosition / impressions : 0,
  };
}

function pageMetricMap(rows: GscSearchAnalyticsRow[]) {
  const map = new Map<string, Metric>();
  for (const row of rows) {
    const page = row.keys?.[0];
    if (!page) continue;
    const normalizedPage = normalizeUrl(page);
    const metric = metricFromRow(row);
    map.set(
      normalizedPage,
      map.has(normalizedPage) ? combineMetrics([map.get(normalizedPage)!, metric]) : metric
    );
  }
  return map;
}

function pageQueryMap(rows: GscSearchAnalyticsRow[]) {
  const map = new Map<string, Map<string, Metric>>();
  for (const row of rows) {
    const page = row.keys?.[0];
    const query = row.keys?.[1]?.trim().toLowerCase();
    if (!page || !query) continue;
    const normalizedPage = normalizeUrl(page);
    const queries = map.get(normalizedPage) || new Map<string, Metric>();
    const metric = metricFromRow(row);
    queries.set(
      query,
      queries.has(query) ? combineMetrics([queries.get(query)!, metric]) : metric
    );
    map.set(normalizedPage, queries);
  }
  return map;
}

function queryMap(rows: GscSearchAnalyticsRow[]) {
  const grouped = new Map<string, Map<string, Metric>>();
  for (const row of rows) {
    const page = row.keys?.[0];
    const query = row.keys?.[1]?.trim().toLowerCase();
    if (!page || !query) continue;
    const normalizedPage = normalizeUrl(page);
    const pages = grouped.get(query) || new Map<string, Metric>();
    const metric = metricFromRow(row);
    pages.set(
      normalizedPage,
      pages.has(normalizedPage) ? combineMetrics([pages.get(normalizedPage)!, metric]) : metric
    );
    grouped.set(query, pages);
  }
  return new Map(
    [...grouped].map(([query, pages]) => [
      query,
      [...pages].map(([page, metric]) => ({ page, metric })),
    ])
  );
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function positionBucket(position: number) {
  if (position <= 3) return "1-3";
  if (position <= 10) return "4-10";
  if (position <= 20) return "11-20";
  if (position <= 40) return "21-40";
  return "41+";
}

function proximityScore(position: number) {
  if (position >= 4 && position <= 10) return 25;
  if (position > 10 && position <= 20) return 22;
  if (position > 20 && position <= 40) return 12;
  if ((position > 0 && position < 4) || (position > 40 && position <= 60)) return 5;
  return 0;
}

function demandScore(impressions: number) {
  return Math.min(40, 12 * Math.log10(1 + impressions));
}

function confidenceFor(current: Metric, previous: Metric, trailing90: Metric): Confidence | null {
  if (
    trailing90.impressions >= 100 &&
    current.impressions >= 30 &&
    previous.impressions > 0
  ) return "high";
  if (trailing90.impressions >= MIN_BASELINE_IMPRESSIONS || current.impressions >= MIN_CURRENT_IMPRESSIONS) {
    return "medium";
  }
  return null;
}

function titleTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !["the", "and", "nfl", "football"].includes(token))
  );
}

function titleQuerySimilarity(title: string, query: string) {
  const titleSet = titleTokens(title);
  const querySet = titleTokens(query);
  if (!querySet.size) return 0;
  let overlap = 0;
  for (const token of querySet) if (titleSet.has(token)) overlap += 1;
  return overlap / querySet.size;
}

function contentIntentText(doc: ContentDoc) {
  return [
    doc.title,
    doc.homepageTitle,
    doc.summary,
    doc.slug?.current?.replace(/-/g, " "),
  ].filter(Boolean).join(" ");
}

function contentUrl(doc: ContentDoc) {
  const slug = doc.slug?.current?.trim();
  return slug ? normalizeUrl(`/articles/${encodeURIComponent(slug)}`) : "";
}

function topQueryEvidence(
  url: string,
  current: Map<string, Map<string, Metric>>,
  previous: Map<string, Map<string, Metric>>,
  trailing90: Map<string, Map<string, Metric>>
) {
  const currentQueries = current.get(url) || new Map<string, Metric>();
  const previousQueries = previous.get(url) || new Map<string, Metric>();
  const trailingQueries = trailing90.get(url) || new Map<string, Metric>();
  const queries = new Set([
    ...currentQueries.keys(),
    ...previousQueries.keys(),
    ...trailingQueries.keys(),
  ]);
  return [...queries]
    .map((query) => ({
      query,
      current: currentQueries.get(query) || metricFromRow(),
      previous: previousQueries.get(query) || metricFromRow(),
      trailing90: trailingQueries.get(query) || metricFromRow(),
    }))
    .sort(
      (left, right) =>
        right.current.impressions - left.current.impressions ||
        right.trailing90.impressions - left.trailing90.impressions
    )
    .slice(0, 5);
}

function suggestedAction(kind: OpportunityKind) {
  switch (kind) {
    case "snippet-gap":
      return "Preserve the URL; align the title, homepage title, summary, and opening answer to the winning queries, then verify the promise is fully delivered.";
    case "decay":
      return "Preserve the URL; verify what became stale, refresh only materially outdated sections, add a visible accurate update note, and strengthen internal links.";
    case "emerging":
      return "Expand the existing URL while demand is rising with a sourced comparison, decision aid, or complete table that answers the emerging queries.";
    case "striking-distance":
      return "Preserve the URL; close the intent gap with deeper evidence, a native Data Table where useful, and two contextual internal links.";
    case "authority-intent":
      return "Reassess intent and differentiation before expanding; add original research or consolidate if the page is derivative.";
    case "content-gap":
      return "Review the landing pages for intent overlap; expand the best canonical page or approve one new evergreen URL only after cannibalization review.";
  }
}

function evidenceNeeded(kind: OpportunityKind) {
  if (kind === "snippet-gap") return "SERP/title-intent review plus proof that the article delivers every title promise.";
  if (kind === "decay") return "Current primary sources, changed facts, and the exact sections that need a material update.";
  if (kind === "content-gap") return "Current SERP coverage, existing-site overlap, and one defensible information-gain artifact.";
  return "Primary sources, claim-level statistics with date/sample context, limitations, and one useful evidence artifact.";
}

function analyzeRows(
  windows: OpportunityReport["windows"],
  rows: { current: WindowRows; previous: WindowRows; trailing90: WindowRows },
  docs: ContentDoc[]
): OpportunityReport {
  const contentByUrl = new Map(
    docs.map((doc) => [contentUrl(doc), doc] as const).filter(([url]) => Boolean(url))
  );
  const utilityByUrl = new Map(
    [...UTILITY_ROUTES].map(([path, title]) => [normalizeUrl(path), title] as const)
  );
  const eligibleUrls = new Set([...contentByUrl.keys(), ...utilityByUrl.keys()]);
  const currentPages = pageMetricMap(rows.current.page);
  const previousPages = pageMetricMap(rows.previous.page);
  const trailingPages = pageMetricMap(rows.trailing90.page);
  const currentPageQueries = pageQueryMap(rows.current.pageQuery);
  const previousPageQueries = pageQueryMap(rows.previous.pageQuery);
  const trailingPageQueries = pageQueryMap(rows.trailing90.pageQuery);

  const ctrBuckets = new Map<string, number[]>();
  for (const [url, metric] of currentPages) {
    if (!eligibleUrls.has(url) || metric.impressions < 5 || metric.position <= 0) continue;
    const bucket = positionBucket(metric.position);
    const values = ctrBuckets.get(bucket) || [];
    values.push(metric.ctr);
    ctrBuckets.set(bucket, values);
  }

  const pageOpportunities: Opportunity[] = [];
  for (const url of eligibleUrls) {
    const doc = contentByUrl.get(url);
    const current = currentPages.get(url) || metricFromRow();
    const previous = previousPages.get(url) || metricFromRow();
    const trailing90 = trailingPages.get(url) || metricFromRow();
    const confidence = confidenceFor(current, previous, trailing90);
    if (!confidence) continue;

    const bucketValues = ctrBuckets.get(positionBucket(current.position)) || [];
    const bucketMedian = bucketValues.length >= 5 ? median(bucketValues) : 0;
    const ctrGap = bucketMedian > 0 ? Math.max(0, (bucketMedian - current.ctr) / bucketMedian) : 0;
    const decay =
      previous.impressions >= 30 &&
      (current.impressions <= previous.impressions * 0.7 || current.position >= previous.position + 5);
    const emerging =
      current.impressions >= 20 &&
      current.impressions >= Math.max(1, previous.impressions) * 1.5 &&
      current.position >= 8 &&
      current.position <= 40;
    const snippetGap =
      current.impressions >= 30 &&
      current.position > 0 &&
      current.position <= 10 &&
      bucketValues.length >= 5 &&
      current.ctr <= bucketMedian * 0.7;
    const strikingDistance =
      trailing90.impressions >= 30 && current.position >= 4 && current.position <= 20;
    const authorityIntent = trailing90.impressions >= 100 && current.position > 20;
    if (doc?.format === "headline" && ageInDays(doc.date) > 21 && !emerging) continue;
    const signals: string[] = [];
    if (decay) signals.push("decay");
    if (emerging) signals.push("emerging demand");
    if (snippetGap) signals.push(`CTR below same-site ${positionBucket(current.position)} median`);
    if (strikingDistance) signals.push("striking distance");
    if (authorityIntent) signals.push("high impressions, weak authority/intent fit");
    if (!signals.length) continue;

    const kind: OpportunityKind = decay
      ? "decay"
      : snippetGap
        ? "snippet-gap"
        : emerging
          ? "emerging"
          : strikingDistance
            ? "striking-distance"
            : "authority-intent";
    const momentum = decay ? 15 : emerging ? 12 : 0;
    const score = Math.round(
      Math.min(
        100,
        demandScore(trailing90.impressions) +
          proximityScore(current.position || trailing90.position) +
          Math.min(20, ctrGap * 20) +
          momentum
      )
    );
    pageOpportunities.push({
      score,
      confidence,
      kind,
      title: doc?.title || utilityByUrl.get(url) || url,
      url,
      sanityId: doc?._id,
      format: doc?.format,
      current,
      previous,
      trailing90,
      signals,
      topQueries: topQueryEvidence(
        url,
        currentPageQueries,
        previousPageQueries,
        trailingPageQueries
      ),
      suggestedAction: suggestedAction(kind),
      evidenceNeeded: evidenceNeeded(kind),
    });
  }

  const currentQueries = queryMap(rows.current.pageQuery);
  const previousQueries = queryMap(rows.previous.pageQuery);
  const trailingQueries = queryMap(rows.trailing90.pageQuery);
  const intentTextByUrl = new Map<string, string>();
  for (const [url, doc] of contentByUrl) intentTextByUrl.set(url, contentIntentText(doc));
  for (const [url, title] of utilityByUrl) {
    intentTextByUrl.set(url, `${title} ${new URL(url).pathname.replace(/[/-]+/g, " ")}`);
  }
  const contentGaps: Opportunity[] = [];
  for (const [query, currentEntries] of currentQueries) {
    if (/\b(?:the snap|thegamesnap)\b/i.test(query)) continue;
    const eligibleCurrentEntries = currentEntries.filter((entry) => opportunityLandingPage(entry.page));
    const eligiblePreviousEntries = (previousQueries.get(query) || []).filter((entry) => opportunityLandingPage(entry.page));
    const eligibleTrailingEntries = (trailingQueries.get(query) || []).filter((entry) => opportunityLandingPage(entry.page));
    const current = combineMetrics(eligibleCurrentEntries.map((entry) => entry.metric));
    const previous = combineMetrics(eligiblePreviousEntries.map((entry) => entry.metric));
    const trailing90 = combineMetrics(eligibleTrailingEntries.map((entry) => entry.metric));
    if (
      current.impressions < 20 ||
      trailing90.impressions < 30 ||
      current.position < 8 ||
      current.position > 40
    ) continue;
    const bestTitleMatch = Math.max(
      0,
      ...[...intentTextByUrl.values()].map((text) => titleQuerySimilarity(text, query))
    );
    const landingIntentMatch = Math.max(
      0,
      ...eligibleCurrentEntries.map((entry) =>
        titleQuerySimilarity(
          intentTextByUrl.get(entry.page) || new URL(entry.page).pathname.replace(/[/-]+/g, " "),
          query
        )
      )
    );
    if (bestTitleMatch >= 0.6 || landingIntentMatch >= 0.4) continue;
    const landingPages = eligibleCurrentEntries
      .sort((left, right) => right.metric.impressions - left.metric.impressions)
      .map((entry) => entry.page);
    const confidence = confidenceFor(current, previous, trailing90);
    if (!confidence) continue;
    const emerging = current.impressions >= Math.max(1, previous.impressions) * 1.5;
    contentGaps.push({
      score: Math.round(
        Math.min(
          100,
          demandScore(trailing90.impressions) + proximityScore(current.position) + (emerging ? 12 : 0)
        )
      ),
      confidence,
      kind: "content-gap",
      title: `Query opportunity: ${query}`,
      url: landingPages[0],
      current,
      previous,
      trailing90,
      signals: ["no close live-title match", ...(emerging ? ["emerging demand"] : [])],
      topQueries: [{ query, current, previous, trailing90 }],
      suggestedAction: suggestedAction("content-gap"),
      evidenceNeeded: evidenceNeeded("content-gap"),
    });
  }

  const cannibalization: CannibalizationOpportunity[] = [];
  for (const [query, entries] of currentQueries) {
    const articleEntries = entries
      .filter((entry) => contentByUrl.has(entry.page) && entry.metric.impressions >= 5)
      .sort((left, right) => right.metric.impressions - left.metric.impressions);
    if (articleEntries.length < 2) continue;
    const metrics = combineMetrics(articleEntries.map((entry) => entry.metric));
    if (metrics.impressions < 50) continue;
    const topShare = articleEntries[0].metric.impressions / metrics.impressions;
    if (topShare >= 0.8) continue;
    cannibalization.push({
      query,
      score: Math.round(Math.min(100, demandScore(metrics.impressions) + 20)),
      metrics,
      pages: articleEntries.slice(0, 4).map((entry) => ({
        url: entry.page,
        title: contentByUrl.get(entry.page)?.title || entry.page,
        impressions: entry.metric.impressions,
        position: entry.metric.position,
      })),
      suggestedAction:
        "Manually compare intent before consolidating. Preserve the strongest canonical URL; do not redirect, noindex, or merge automatically.",
    });
  }

  const opportunities = [...pageOpportunities, ...contentGaps]
    .sort((left, right) => right.score - left.score || right.trailing90.impressions - left.trailing90.impressions)
    .slice(0, MAX_OPPORTUNITIES)
    .map((opportunity, index) => ({ ...opportunity, rank: index + 1 }));

  return {
    generatedAt: new Date().toISOString(),
    dataThrough: windows.current.endDate,
    directionalDataNote:
      "Search Analytics returns top rows and may omit anonymized queries; use this report for prioritization, not exhaustive accounting.",
    windows,
    coverage: {
      rowLimit: ROW_LIMIT,
      current: rows.current.truncated,
      previous: rows.previous.truncated,
      trailing90: rows.trailing90.truncated,
    },
    siteTotals: {
      current: metricFromRow(rows.current.property[0]),
      previous: metricFromRow(rows.previous.property[0]),
      trailing90: metricFromRow(rows.trailing90.property[0]),
    },
    opportunities,
    cannibalization: cannibalization
      .sort((left, right) => right.score - left.score)
      .slice(0, 5),
  };
}

async function queryRows(
  client: GscClient,
  window: DateWindow,
  dimensions: GscSearchDimension[],
  aggregationType?: "auto" | "byPage" | "byProperty"
) {
  const rows: GscSearchAnalyticsRow[] = [];
  const maxPages = dimensions.length ? MAX_QUERY_PAGES : 1;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const response = await client.querySearchAnalytics({
      ...window,
      dimensions,
      type: "web",
      dataState: "final",
      aggregationType,
      rowLimit: ROW_LIMIT,
      startRow: pageIndex * ROW_LIMIT,
    });
    const nextRows = response.rows || [];
    rows.push(...nextRows);
    if (nextRows.length < ROW_LIMIT) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

async function fetchWindowRows(client: GscClient, window: DateWindow): Promise<WindowRows> {
  const [property, page, pageQuery] = await Promise.all([
    queryRows(client, window, [], "byProperty"),
    queryRows(client, window, ["page"], "byPage"),
    queryRows(client, window, ["page", "query"], "byPage"),
  ]);
  return {
    property: property.rows,
    page: page.rows,
    pageQuery: pageQuery.rows,
    truncated: {
      property: property.truncated,
      page: page.truncated,
      pageQuery: pageQuery.truncated,
    },
  };
}

async function fetchContentDocs() {
  const projectId =
    process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const dataset =
    process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  if (!projectId) throw new Error("Sanity configuration missing: NEXT_PUBLIC_SANITY_PROJECT_ID");
  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.SANITY_API_VERSION || "2024-06-01",
    useCdn: false,
    perspective: "published",
  });
  return client.fetch<ContentDoc[]>(`*[
    _type == "article" &&
    format != "powerRankings" &&
    published == true &&
    defined(slug.current) &&
    (!defined(seo.noIndex) || seo.noIndex == false)
  ]{
    _id,
    title,
    homepageTitle,
    summary,
    format,
    date,
    slug
  }`);
}

function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function metricLine(metric: Metric) {
  return `${metric.clicks.toFixed(0)} clicks, ${metric.impressions.toFixed(0)} impressions, ${percent(metric.ctr)} CTR, position ${metric.position.toFixed(1)}`;
}

function renderMarkdown(report: OpportunityReport) {
  const lines = [
    "# Weekly Search Console content opportunities",
    "",
    `Data through: ${report.dataThrough}`,
    `Current window: ${report.windows.current.startDate} to ${report.windows.current.endDate}`,
    `Previous window: ${report.windows.previous.startDate} to ${report.windows.previous.endDate}`,
    `90-day baseline: ${report.windows.trailing90.startDate} to ${report.windows.trailing90.endDate}`,
    "",
    report.directionalDataNote,
    "",
    "## Site totals",
    "",
    `- Current: ${metricLine(report.siteTotals.current)}`,
    `- Previous: ${metricLine(report.siteTotals.previous)}`,
    `- Trailing 90 days: ${metricLine(report.siteTotals.trailing90)}`,
    "",
    "## Ranked opportunities",
    "",
  ];

  if (!report.opportunities.length) lines.push("No medium- or high-confidence opportunities met the thresholds.", "");
  for (const opportunity of report.opportunities) {
    lines.push(
      `### ${opportunity.rank}. ${opportunity.title}`,
      "",
      `- Type: ${opportunity.kind}`,
      `- Score/confidence: ${opportunity.score}/100 (${opportunity.confidence})`,
      `- URL: ${opportunity.url}`,
      `- Current: ${metricLine(opportunity.current)}`,
      `- Previous: ${metricLine(opportunity.previous)}`,
      `- 90-day: ${metricLine(opportunity.trailing90)}`,
      `- Signals: ${opportunity.signals.join("; ")}`,
      `- Action: ${opportunity.suggestedAction}`,
      `- Evidence needed: ${opportunity.evidenceNeeded}`
    );
    if (opportunity.topQueries.length) {
      lines.push(
        `- Top queries: ${opportunity.topQueries
          .map((item) => `${item.query} (${item.current.impressions.toFixed(0)} impressions, pos. ${item.current.position.toFixed(1)})`)
          .join("; ")}`
      );
    }
    lines.push("");
  }

  lines.push("## Potential cannibalization", "");
  if (!report.cannibalization.length) lines.push("No medium-confidence cannibalization pattern met the threshold.", "");
  for (const item of report.cannibalization) {
    lines.push(
      `- ${item.query}: ${item.metrics.impressions.toFixed(0)} combined impressions across ${item.pages.length} pages (score ${item.score}).`,
      `  Action: ${item.suggestedAction}`,
      ...item.pages.map(
        (page) => `  - ${page.title}: ${page.impressions.toFixed(0)} impressions, position ${page.position.toFixed(1)} — ${page.url}`
      )
    );
  }

  const truncated = Object.values(report.coverage.current).some(Boolean) ||
    Object.values(report.coverage.previous).some(Boolean) ||
    Object.values(report.coverage.trailing90).some(Boolean);
  lines.push("", `Coverage warning: ${truncated ? "At least one query hit the row limit; treat rankings as incomplete." : "No query hit the configured row limit."}`);
  return lines.join("\n");
}

function syntheticRow(page: string, query: string | null, metric: Partial<Metric>) {
  return {
    keys: query ? [page, query] : [page],
    clicks: metric.clicks || 0,
    impressions: metric.impressions || 0,
    ctr: metric.ctr || 0,
    position: metric.position || 0,
  } satisfies GscSearchAnalyticsRow;
}

function runSelfTest() {
  const docs = Array.from({ length: 6 }, (_, index) => ({
    _id: `article-${index}`,
    title: index === 0 ? "NFL Strength of Schedule Guide" : `NFL Test Article ${index}`,
    slug: { current: `test-${index}` },
    format: "analysis",
  }));
  const pages = docs.map(contentUrl);
  const currentPage = pages.map((page, index) =>
    syntheticRow(page, null, {
      clicks: index === 0 ? 0 : 4,
      impressions: index === 0 ? 120 : 80,
      ctr: index === 0 ? 0.002 : 0.05,
      position: 7,
    })
  );
  const previousPage = pages.map((page) =>
    syntheticRow(page, null, { clicks: 2, impressions: 60, ctr: 0.033, position: 8 })
  );
  const trailingPage = pages.map((page) =>
    syntheticRow(page, null, { clicks: 5, impressions: 180, ctr: 0.028, position: 8 })
  );
  const sharedQueryRows = [
    syntheticRow(pages[1], "nfl offseason calendar", { impressions: 32, position: 14 }),
    syntheticRow(pages[2], "nfl offseason calendar", { impressions: 28, position: 16 }),
    syntheticRow(normalizeUrl("/fantasy"), "fantasy football playoff schedule", { impressions: 40, position: 18 }),
  ];
  const report = analyzeRows(
    {
      current: { startDate: "2026-07-01", endDate: "2026-07-28" },
      previous: { startDate: "2026-06-03", endDate: "2026-06-30" },
      trailing90: { startDate: "2026-05-01", endDate: "2026-07-28" },
    },
    {
      current: {
        property: [syntheticRow(SITE_URL, null, { clicks: 20, impressions: 600, ctr: 0.033, position: 9 })],
        page: [...currentPage, syntheticRow(normalizeUrl("/fantasy"), null, { impressions: 40, position: 18 })],
        pageQuery: [syntheticRow(pages[0], "nfl strength of schedule", { impressions: 90, position: 7 }), ...sharedQueryRows],
        truncated: { property: false, page: false, pageQuery: false },
      },
      previous: {
        property: [syntheticRow(SITE_URL, null, { clicks: 12, impressions: 400, ctr: 0.03, position: 11 })],
        page: previousPage,
        pageQuery: [syntheticRow(pages[0], "nfl strength of schedule", { impressions: 50, position: 8 })],
        truncated: { property: false, page: false, pageQuery: false },
      },
      trailing90: {
        property: [syntheticRow(SITE_URL, null, { clicks: 50, impressions: 1600, ctr: 0.031, position: 10 })],
        page: trailingPage,
        pageQuery: [
          syntheticRow(pages[0], "nfl strength of schedule", { impressions: 160, position: 8 }),
          syntheticRow(pages[1], "nfl offseason calendar", { impressions: 70, position: 14 }),
          syntheticRow(pages[2], "nfl offseason calendar", { impressions: 60, position: 16 }),
          syntheticRow(normalizeUrl("/fantasy"), "fantasy football playoff schedule", { impressions: 90, position: 18 }),
        ],
        truncated: { property: false, page: false, pageQuery: false },
      },
    },
    docs
  );
  assert.equal(report.siteTotals.current.clicks, 20);
  assert.equal(report.siteTotals.current.impressions, 600);
  assert(report.opportunities.some((item) => item.kind === "snippet-gap"));
  assert(report.opportunities.some((item) => item.kind === "content-gap"));
  assert.equal(report.cannibalization[0]?.query, "nfl offseason calendar");
  console.log("GSC opportunity self-test passed.");
}

async function main() {
  if (SELF_TEST) {
    runSelfTest();
    return;
  }

  const config = getGscClientConfigStatus({ propertyUri: PROPERTY_URI });
  const sanityProjectId =
    process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const missing = [...config.missing];
  if (!sanityProjectId) missing.push("NEXT_PUBLIC_SANITY_PROJECT_ID");

  if (CHECK_CONFIG || missing.length) {
    const result = {
      configured: missing.length === 0,
      propertyUri: PROPERTY_URI,
      missing,
      message: missing.length
        ? "Add the missing values to .env.local and grant the service-account email access to the Search Console property."
        : "Search Console opportunity reporting is configured.",
    };
    console.log(JSON.stringify(result, null, 2));
    if (missing.length) process.exitCode = 2;
    return;
  }

  const windows = buildWindows();
  const gscClient = createGscClient({
    propertyUri: PROPERTY_URI,
    scope: READONLY_SCOPE,
  });
  const [current, previous, trailing90, docs] = await Promise.all([
    fetchWindowRows(gscClient, windows.current),
    fetchWindowRows(gscClient, windows.previous),
    fetchWindowRows(gscClient, windows.trailing90),
    fetchContentDocs(),
  ]);
  const report = analyzeRows(
    {
      current: windows.current,
      previous: windows.previous,
      trailing90: windows.trailing90,
    },
    { current, previous, trailing90 },
    docs
  );
  console.log(JSON_OUTPUT ? JSON.stringify(report, null, 2) : renderMarkdown(report));
}

main().catch((error) => {
  console.error(`GSC opportunity report failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
