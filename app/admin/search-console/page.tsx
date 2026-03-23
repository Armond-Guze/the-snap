import "server-only";

import Link from "next/link";

import { getGscAuditConfig, runGscAudit } from "@/lib/gsc-audit";

export const dynamic = "force-dynamic";

function formatTimestamp(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

function formatPercent(value?: number) {
  if (typeof value !== "number") return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function severityClasses(severity: "info" | "warn" | "error") {
  if (severity === "error") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (severity === "warn") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
  return "border-blue-500/30 bg-blue-500/10 text-blue-200";
}

export default async function SearchConsoleAdminPage() {
  const config = getGscAuditConfig();
  const report = config.configured ? await runGscAudit({ emitAlerts: false }) : null;

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-baseline justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Search Console
            </p>
            <h1 className="text-4xl font-bold">GSC Audit</h1>
            <p className="mt-2 text-sm text-gray-400">
              Property: {config.propertyUri}
            </p>
          </div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">
            ← Admin
          </Link>
        </div>

        {!config.configured && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-2xl font-semibold text-red-100">GSC audit is not configured</h2>
            <p className="mt-3 text-sm text-red-100/85">
              Add the missing environment variables, then reload this page.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {config.missing.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-red-400/30 bg-black/30 px-3 py-1 text-xs font-semibold text-red-100"
                >
                  {key}
                </span>
              ))}
            </div>
            <div className="mt-5 text-sm text-red-100/80">
              The service account email also needs access to the Search Console property in Google.
            </div>
          </div>
        )}

        {report && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">Checked Pages</p>
                <p className="mt-2 text-3xl font-bold">{report.summary.checkedPages}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">Indexed</p>
                <p className="mt-2 text-3xl font-bold">{report.summary.indexedPages}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">Warnings</p>
                <p className="mt-2 text-3xl font-bold text-yellow-300">{report.summary.warnings}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">Errors</p>
                <p className="mt-2 text-3xl font-bold text-red-300">{report.summary.errors}</p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.04] p-6">
                <h2 className="text-xl font-semibold">Property Status</h2>
                <div className="mt-4 space-y-2 text-sm text-gray-300">
                  <p>Accessible: {report.property.accessible ? "Yes" : "No"}</p>
                  <p>Permission: {report.property.permissionLevel || "—"}</p>
                  <p>Generated: {formatTimestamp(report.generatedAt)}</p>
                  <p>Lookback: {report.config.lookbackDays} days</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-6">
                <h2 className="text-xl font-semibold">Sitemap Status</h2>
                <div className="mt-4 space-y-2 text-sm text-gray-300">
                  <p>Registered in GSC: {report.sitemap.foundInGsc ? "Yes" : "No"}</p>
                  <p>Fetched from site: {report.sitemap.fetchedFromSite ? "Yes" : "No"}</p>
                  <p>Last downloaded: {formatTimestamp(report.sitemap.lastDownloaded)}</p>
                  <p>Warnings: {report.sitemap.warnings ?? 0}</p>
                  <p>Errors: {report.sitemap.errors ?? 0}</p>
                  <p>URLs in sitemap.xml: {report.sitemap.totalUrls ?? 0}</p>
                </div>
              </div>
            </div>

            <section className="mb-10">
              <div className="mb-4 flex items-center gap-4">
                <h2 className="text-2xl font-semibold">Issues</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {report.issues.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.04] p-5 text-sm text-gray-400">
                  No issues detected in the current audit run.
                </div>
              ) : (
                <div className="space-y-3">
                  {report.issues.map((issue, index) => (
                    <div
                      key={`${issue.code}-${issue.url || index}`}
                      className={`rounded-2xl border p-4 ${severityClasses(issue.severity)}`}
                    >
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-semibold uppercase tracking-wide">{issue.severity}</span>
                        <span className="font-mono text-xs">{issue.code}</span>
                        {issue.url && <span className="truncate text-xs">{issue.url}</span>}
                      </div>
                      <p className="mt-2 text-sm">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="text-2xl font-semibold">Pages</h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.04] text-gray-300">
                    <tr>
                      <th className="px-3 py-2 text-left">Page</th>
                      <th className="px-3 py-2 text-left">Kind</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Index Verdict</th>
                      <th className="px-3 py-2 text-left">Sitemap</th>
                      <th className="px-3 py-2 text-left">Impr.</th>
                      <th className="px-3 py-2 text-left">Clicks</th>
                      <th className="px-3 py-2 text-left">CTR</th>
                      <th className="px-3 py-2 text-left">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.pages.map((page) => (
                      <tr key={page.url} className="border-t border-white/5 align-top">
                        <td className="px-3 py-3">
                          <div className="max-w-sm">
                            <div className="font-medium text-white">{page.title}</div>
                            <div className="mt-1 break-all text-xs text-gray-500">{page.url}</div>
                            {page.issues.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {page.issues.map((issue) => (
                                  <span
                                    key={`${page.url}-${issue.code}`}
                                    className={`rounded-full border px-2 py-0.5 text-[11px] ${severityClasses(issue.severity)}`}
                                  >
                                    {issue.code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-400">{page.kind}</td>
                        <td className="px-3 py-3 text-gray-400">{page.statusCode ?? "—"}</td>
                        <td className="px-3 py-3 text-gray-400">{page.inspectionVerdict || "—"}</td>
                        <td className="px-3 py-3 text-gray-400">{page.inSitemap ? "Yes" : "No"}</td>
                        <td className="px-3 py-3 text-gray-400">{page.impressions ?? 0}</td>
                        <td className="px-3 py-3 text-gray-400">{page.clicks ?? 0}</td>
                        <td className="px-3 py-3 text-gray-400">{formatPercent(page.ctr)}</td>
                        <td className="px-3 py-3 text-gray-400">
                          {typeof page.position === "number" && page.position > 0
                            ? page.position.toFixed(1)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
