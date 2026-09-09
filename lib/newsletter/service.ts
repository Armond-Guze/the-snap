import "server-only";

import { randomUUID } from "node:crypto";
import { NewsletterSubscriptionStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  createNewsletterConfirmationToken,
  getNewsletterConfirmationTokenDigest,
} from "@/lib/newsletter/security";

const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1_000;
const CONFIRMATION_RESEND_COOLDOWN_MS = 6 * 60 * 60 * 1_000;

export interface SubscribeNewsletterInput {
  email: string;
  source: string;
  consentAt: Date;
  consentPolicyVersion: string;
  consentIpHash: string | null;
  consentUserAgentHash: string | null;
  signingSecret: string;
}

export type SubscribeNewsletterResult =
  | { subscriberId: string; confirmationRequired: false }
  | {
      subscriberId: string;
      confirmationRequired: true;
      confirmationToken: string;
      confirmationTokenDigest: string;
    };

export async function subscribeNewsletter(
  input: SubscribeNewsletterInput
): Promise<SubscribeNewsletterResult> {
  const now = new Date();
  const confirmationToken = createNewsletterConfirmationToken();
  const confirmationTokenDigest = getNewsletterConfirmationTokenDigest(
    confirmationToken,
    input.signingSecret
  );
  if (!confirmationTokenDigest) {
    throw new Error("Newsletter confirmation token could not be created");
  }

  const pendingData = {
    status: NewsletterSubscriptionStatus.PENDING,
    source: input.source,
    consentAt: input.consentAt,
    consentPolicyVersion: input.consentPolicyVersion,
    consentIpHash: input.consentIpHash,
    consentUserAgentHash: input.consentUserAgentHash,
    confirmationTokenDigest,
    confirmationExpiresAt: new Date(now.getTime() + CONFIRMATION_TTL_MS),
    // Reserve the send atomically with the challenge. This prevents concurrent
    // requests from emailing two links when only one token can remain valid.
    confirmationSentAt: now,
    confirmedAt: null,
    subscribedAt: null,
    unsubscribedAt: null,
  };

  try {
    const created = await db.newsletterSubscriber.create({
      data: {
        id: randomUUID(),
        email: input.email,
        ...pendingData,
      },
      select: { id: true },
    });
    return {
      subscriberId: created.id,
      confirmationRequired: true,
      confirmationToken,
      confirmationTokenDigest,
    };
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  // Active subscribers are a true no-op. Pending or previously unsubscribed
  // addresses receive a fresh, expiring confirmation challenge.
  const updated = await db.newsletterSubscriber.updateMany({
    where: {
      email: input.email,
      status: {
        in: [
          NewsletterSubscriptionStatus.PENDING,
          NewsletterSubscriptionStatus.UNSUBSCRIBED,
        ],
      },
      OR: [
        { confirmationSentAt: null },
        {
          confirmationSentAt: {
            lt: new Date(now.getTime() - CONFIRMATION_RESEND_COOLDOWN_MS),
          },
        },
      ],
    },
    data: pendingData,
  });

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { email: input.email },
    select: { id: true, status: true },
  });
  if (!subscriber) {
    throw new Error("Newsletter subscriber conflict could not be resolved");
  }

  if (updated.count > 0 && subscriber.status === NewsletterSubscriptionStatus.PENDING) {
    return {
      subscriberId: subscriber.id,
      confirmationRequired: true,
      confirmationToken,
      confirmationTokenDigest,
    };
  }

  return { subscriberId: subscriber.id, confirmationRequired: false };
}

export async function releaseNewsletterConfirmationReservation(
  subscriberId: string,
  confirmationTokenDigest: string
): Promise<void> {
  await db.newsletterSubscriber.updateMany({
    where: {
      id: subscriberId,
      status: NewsletterSubscriptionStatus.PENDING,
      confirmationTokenDigest,
    },
    data: {
      confirmationTokenDigest: null,
      confirmationExpiresAt: null,
      confirmationSentAt: null,
    },
  });
}

export async function confirmNewsletter(
  token: unknown,
  signingSecret: string
): Promise<boolean> {
  const confirmationTokenDigest = getNewsletterConfirmationTokenDigest(
    token,
    signingSecret
  );
  if (!confirmationTokenDigest) return false;

  const now = new Date();
  const result = await db.newsletterSubscriber.updateMany({
    where: {
      status: NewsletterSubscriptionStatus.PENDING,
      confirmationTokenDigest,
      confirmationExpiresAt: { gt: now },
    },
    data: {
      status: NewsletterSubscriptionStatus.ACTIVE,
      confirmationTokenDigest: null,
      confirmationExpiresAt: null,
      confirmedAt: now,
      subscribedAt: now,
      unsubscribedAt: null,
    },
  });

  return result.count > 0;
}

export async function unsubscribeNewsletterById(subscriberId: string): Promise<void> {
  await db.newsletterSubscriber.updateMany({
    where: {
      id: subscriberId,
      status: NewsletterSubscriptionStatus.ACTIVE,
    },
    data: {
      status: NewsletterSubscriptionStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    },
  });
}

export async function pruneExpiredNewsletterConfirmations(now = new Date()): Promise<number> {
  const result = await db.newsletterSubscriber.deleteMany({
    where: {
      status: NewsletterSubscriptionStatus.PENDING,
      confirmationExpiresAt: { lt: now },
    },
  });
  return result.count;
}
