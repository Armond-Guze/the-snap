import crypto from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_API_BASE = "https://www.googleapis.com";
const URL_INSPECTION_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const DEFAULT_SCOPE = "https://www.googleapis.com/auth/webmasters";

export type GscSearchDimension =
  | "page"
  | "query"
  | "date"
  | "device"
  | "country"
  | "searchAppearance";

export interface GscSearchAnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface GscSearchAnalyticsResponse {
  rows?: GscSearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface GscSearchAnalyticsRequest {
  startDate: string;
  endDate: string;
  dimensions: GscSearchDimension[];
  dataState?: "all" | "final";
  rowLimit?: number;
  startRow?: number;
  aggregationType?: "auto" | "byPage" | "byProperty" | "byNewsShowcasePanel";
  type?: "web" | "image" | "video" | "news" | "discover" | "googleNews";
  dimensionFilterGroups?: Array<Record<string, unknown>>;
}

export interface GscClientConfigStatus {
  configured: boolean;
  missing: string[];
  propertyUri: string;
}

export interface GscClientOptions {
  propertyUri?: string;
  scope?: string;
}

export interface GscClient {
  propertyUri: string;
  request<T>(path: string, init?: RequestInit): Promise<T>;
  querySearchAnalytics(request: GscSearchAnalyticsRequest): Promise<GscSearchAnalyticsResponse>;
  inspectUrl<T = unknown>(url: string): Promise<T>;
}

export function getGscClientConfigStatus(
  options: GscClientOptions = {}
): GscClientConfigStatus {
  const serviceAccountEmail = process.env.GSC_SERVICE_ACCOUNT_EMAIL?.trim() || "";
  const serviceAccountPrivateKey =
    process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() || "";
  const propertyUri =
    options.propertyUri?.trim() || process.env.GSC_PROPERTY_URI?.trim() || "";
  const missing: string[] = [];

  if (!serviceAccountEmail) missing.push("GSC_SERVICE_ACCOUNT_EMAIL");
  if (!serviceAccountPrivateKey) missing.push("GSC_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!propertyUri) missing.push("GSC_PROPERTY_URI");

  return {
    configured: missing.length === 0,
    missing,
    propertyUri,
  };
}

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

async function requestAccessToken(
  serviceAccountEmail: string,
  serviceAccountPrivateKey: string,
  scope: string
) {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  );
  const encodedPayload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(normalizePrivateKey(serviceAccountPrivateKey));
  const assertion = `${signingInput}.${base64UrlEncode(signature)}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get Google access token: ${response.status} ${errorText}`
    );
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Google access token response did not include access_token");
  }
  return payload.access_token;
}

export function createGscClient(options: GscClientOptions = {}): GscClient {
  const status = getGscClientConfigStatus(options);
  if (!status.configured) {
    throw new Error(`GSC configuration missing: ${status.missing.join(", ")}`);
  }

  const serviceAccountEmail = process.env.GSC_SERVICE_ACCOUNT_EMAIL!.trim();
  const serviceAccountPrivateKey =
    process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY!.trim();
  const scope = options.scope?.trim() || DEFAULT_SCOPE;
  let accessTokenPromise: Promise<string> | null = null;

  const getAccessToken = () => {
    accessTokenPromise ||= requestAccessToken(
      serviceAccountEmail,
      serviceAccountPrivateKey,
      scope
    );
    return accessTokenPromise;
  };

  const request = async <T>(path: string, init: RequestInit = {}) => {
    const accessToken = await getAccessToken();
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
      throw new Error(
        `Search Console request failed: ${response.status} ${errorText}`
      );
    }

    const responseText = await response.text();
    return (responseText ? JSON.parse(responseText) : undefined) as T;
  };

  return {
    propertyUri: status.propertyUri,
    request,
    querySearchAnalytics(searchRequest) {
      const encodedProperty = encodeURIComponent(status.propertyUri);
      return request<GscSearchAnalyticsResponse>(
        `/webmasters/v3/sites/${encodedProperty}/searchAnalytics/query`,
        { method: "POST", body: JSON.stringify(searchRequest) }
      );
    },
    async inspectUrl<T = unknown>(url: string) {
      const accessToken = await getAccessToken();
      const response = await fetch(URL_INSPECTION_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl: status.propertyUri,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`URL inspection failed: ${response.status} ${errorText}`);
      }
      return (await response.json()) as T;
    },
  };
}
