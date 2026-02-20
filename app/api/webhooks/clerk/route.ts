import { NextRequest, NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { AuthProvider, WebhookProvider } from "@prisma/client";
import { Webhook } from "svix";

import { emitMonitoringAlert } from "@/lib/monitoring/alerts";
import {
  beginWebhookEventProcessing,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  markWebhookEventSkipped,
} from "@/lib/security/webhook-events";
import {
  markUserDeletedByAuthIdentity,
  upsertUserFromAuthIdentity,
} from "@/lib/users/service";

export const runtime = "nodejs";

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

type ClerkEmailAddress = {
  id?: string;
  email_address?: string | null;
};

type ClerkWebhookUserData = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
};

function getPrimaryEmail(user: ClerkWebhookUserData): string | null {
  const emails = Array.isArray(user.email_addresses) ? user.email_addresses : [];
  if (emails.length === 0) return null;

  const primary = emails.find(
    (entry) =>
      entry.id &&
      user.primary_email_address_id &&
      entry.id === user.primary_email_address_id
  );

  return (
    primary?.email_address?.trim() ||
    emails[0]?.email_address?.trim() ||
    null
  );
}

export async function POST(request: NextRequest) {
  if (!CLERK_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SIGNING_SECRET" },
      { status: 500 }
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const webhook = new Webhook(CLERK_WEBHOOK_SECRET);

  let event: WebhookEvent;

  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("[api/webhooks/clerk] signature verification failed", error);
    await emitMonitoringAlert({
      source: "clerk-webhook",
      code: "CLERK_WEBHOOK_SIGNATURE_FAILED",
      severity: "warn",
      message: "Clerk webhook signature verification failed",
      context: {
        svixId,
        svixTimestamp,
      },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventIdCandidate = (event as { id?: string }).id;
  const eventId =
    typeof eventIdCandidate === "string" && eventIdCandidate.trim().length > 0
      ? eventIdCandidate.trim()
      : svixId;
  let webhookLogId: string | null = null;

  try {
    const webhookLog = await beginWebhookEventProcessing({
      provider: WebhookProvider.CLERK,
      eventId,
      eventType: event.type,
      payload: event,
    });

    webhookLogId = webhookLog.logId;

    if (webhookLog.isDuplicateProcessed) {
      return NextResponse.json(
        { ok: true, type: event.type, duplicate: true },
        { status: 200 }
      );
    }

    let handled = false;

    if (event.type === "user.created" || event.type === "user.updated") {
      const data = event.data as ClerkWebhookUserData;

      if (!data?.id) {
        if (webhookLogId) {
          await markWebhookEventFailed(webhookLogId, "Missing user id in webhook payload");
        }
        return NextResponse.json(
          { error: "Missing user id in webhook payload" },
          { status: 400 }
        );
      }

      handled = true;

      await upsertUserFromAuthIdentity({
        provider: AuthProvider.CLERK,
        providerUserId: data.id,
        email: getPrimaryEmail(data),
        firstName: data.first_name ?? null,
        lastName: data.last_name ?? null,
        avatarUrl: data.image_url ?? null,
      });
    }

    if (event.type === "user.deleted") {
      const data = event.data as ClerkWebhookUserData;
      if (data?.id) {
        handled = true;
        await markUserDeletedByAuthIdentity(AuthProvider.CLERK, data.id);
      }
    }

    if (webhookLogId) {
      if (handled) {
        await markWebhookEventProcessed(webhookLogId);
      } else {
        await markWebhookEventSkipped(webhookLogId);
      }
    }

    return NextResponse.json({ ok: true, type: event.type }, { status: 200 });
  } catch (error) {
    console.error("[api/webhooks/clerk] failed to sync user", error);

    if (webhookLogId) {
      await markWebhookEventFailed(webhookLogId, error).catch((updateError) => {
        console.error("[api/webhooks/clerk] failed to update webhook event log", updateError);
      });
    }

    await emitMonitoringAlert({
      source: "clerk-webhook",
      code: "CLERK_WEBHOOK_SYNC_FAILED",
      severity: "error",
      message: "Failed to sync Clerk user from webhook event",
      context: {
        eventId,
        eventType: event.type,
        webhookLogId,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
