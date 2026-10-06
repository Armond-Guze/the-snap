import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/db";
import { client } from "@/sanity/lib/client";
import { TEAM_META } from "@/lib/schedule";
import { pushConfig } from "@/lib/push-config";
import { validPushEndpoint } from "@/lib/push-validation";
import { authorizeBearerRequest } from "@/lib/security/bearer-auth";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const access = authorizeBearerRequest(request.headers, [
    process.env.CRON_SECRET,
  ]);
  if (!access.authorized)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: access.status },
    );
  const config = pushConfig();
  if (!config)
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  const now = new Date();
  let sent = 0,
    failed = 0;
  try {
    const devices = await db.pushDevice.findMany({
      where: {
        user: { deletedAt: null },
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
      },
      orderBy: { checkedAt: "asc" },
      take: 100,
    });
    // Small bounded concurrent batches keep the job within the function deadline.
    const cutoff = Date.now() + 45000;
    for (
      let offset = 0;
      offset < devices.length && Date.now() < cutoff;
      offset += 5
    ) {
      await Promise.all(
        devices.slice(offset, offset + 5).map(async (device) => {
          const lease = new Date(Date.now() + 120000);
          const claimed = await db.pushDevice.updateMany({
            where: {
              id: device.id,
              checkedAt: device.checkedAt,
              OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
            },
            data: { leaseUntil: lease },
          });
          if (!claimed.count) return;
          try {
            const team = TEAM_META[device.team];
            if (!team || !validPushEndpoint(device.endpoint))
              throw new Error("Invalid device");
            const slug = team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const tag = await client
              .withConfig({ useCdn: false })
              .fetch<{ _id: string } | null>(
                `*[_type=="tag" && (title==$title || slug.current==$slug || lower(title)==lower($abbr) || $abbr in coalesce(aliases,[]))][0]{_id}`,
                { title: team.name, slug, abbr: device.team },
                { cache: "no-store", timeout: 5000 },
              );
            const article = tag
              ? await client
                  .withConfig({ useCdn: false })
                  .fetch<{ title: string; slug: string } | null>(
                    `*[_type=="article" && published==true && !(_id in path("drafts.**")) && $teamTagId in teams[]._ref && defined(slug.current) && dateTime(coalesce(date,publishedAt,_createdAt)) > dateTime($since) && dateTime(coalesce(date,publishedAt,_createdAt)) <= dateTime($until)] | order(coalesce(date,publishedAt,_createdAt) desc)[0]{title,"slug":slug.current}`,
                    {
                      teamTagId: tag._id,
                      since: device.checkedAt.toISOString(),
                      until: now.toISOString(),
                    },
                    { cache: "no-store", timeout: 5000 },
                  )
              : null;
            if (article && /^[a-zA-Z0-9_-]+$/.test(article.slug)) {
              // Recheck opt-out after fetching content and before delivery.
              const active = await db.pushDevice.findFirst({
                where: {
                  id: device.id,
                  leaseUntil: lease,
                  user: { deletedAt: null },
                },
              });
              if (!active) return;
              await webpush.sendNotification(
                {
                  endpoint: device.endpoint,
                  keys: { p256dh: device.p256dh, auth: device.auth },
                },
                JSON.stringify({
                  title: team.name + " · The Snap",
                  body: article.title.slice(0, 180),
                  href: "/articles/" + article.slug,
                  tag: "snap-team-" + device.team,
                }),
                { vapidDetails: config, TTL: 3600, timeout: 5000 },
              );
              sent++;
            }
            await db.pushDevice.updateMany({
              where: { id: device.id, leaseUntil: lease },
              data: { checkedAt: now, leaseUntil: null },
            });
          } catch (error) {
            const status = (error as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410)
              await db.pushDevice.deleteMany({ where: { id: device.id } });
            else {
              failed++;
              await db.pushDevice.updateMany({
                where: { id: device.id, leaseUntil: lease },
                data: { leaseUntil: null },
              });
            }
          }
        }),
      );
    }
    return NextResponse.json(
      { sent, failed },
      { status: failed ? 207 : 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Team alert delivery unavailable" },
      { status: 503 },
    );
  }
}
