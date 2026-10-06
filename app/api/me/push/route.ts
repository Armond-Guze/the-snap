import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushConfig } from "@/lib/push-config";
import { validPushEndpoint, validPushKeys } from "@/lib/push-validation";
import { normalizeTeamCode } from "@/lib/users/constants";
import { readingAuth, smallJson } from "../_reading-auth";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
async function handle(request: NextRequest) {
  try {
    const userId = await readingAuth(request);
    if (typeof userId !== "string") return userId;
    const config = pushConfig();
    if (request.method === "GET")
      return NextResponse.json(
        {
          configured: Boolean(config),
          publicKey: config?.publicKey || null,
          devices: await db.pushDevice.findMany({
            where: { userId },
            select: { id: true, team: true, createdAt: true },
          }),
        },
        { headers },
      );
    const body = await smallJson(request);
    if (request.method === "DELETE") {
      if (typeof body?.id === "string")
        await db.pushDevice.deleteMany({ where: { userId, id: body.id } });
      else if (validPushEndpoint(body?.endpoint))
        await db.pushDevice.deleteMany({
          where: { userId, endpoint: body.endpoint },
        });
      else
        return NextResponse.json(
          { error: "Invalid device" },
          { status: 400, headers },
        );
      return NextResponse.json({ ok: true }, { headers });
    }
    if (!config)
      return NextResponse.json(
        { error: "Team alerts are not available yet." },
        { status: 503, headers },
      );
    const team =
      typeof body?.team === "string" ? normalizeTeamCode(body.team) : null;
    if (
      !team ||
      !validPushEndpoint(body?.endpoint) ||
      !validPushKeys(body?.keys)
    )
      return NextResponse.json(
        { error: "Invalid push subscription" },
        { status: 400, headers },
      );
    const { endpoint, keys } = body;
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId}::uuid FOR UPDATE`;
      const existing = await tx.pushDevice.findUnique({ where: { endpoint } });
      // Never let a different signed-in account overwrite another device registration.
      if (existing && existing.userId !== userId)
        throw new Error("DEVICE_OWNER");
      if (!existing && (await tx.pushDevice.count({ where: { userId } })) >= 10)
        throw new Error("DEVICE_LIMIT");
      await tx.pushDevice.upsert({
        where: { endpoint },
        create: {
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          team,
        },
        update: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          team,
          leaseUntil: null,
          ...(existing?.team !== team ? { checkedAt: new Date() } : {}),
        },
      });
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        error:
          message === "DEVICE_OWNER"
            ? "This browser is registered to another account. Disable its alerts first."
            : message === "DEVICE_LIMIT"
              ? "Remove an alert device before adding another."
              : "Could not update team alerts. Please retry.",
      },
      { status: message.startsWith("DEVICE_") ? 409 : 503, headers },
    );
  }
}
export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
