-- Newsletter addresses must live in the private PostgreSQL database, not the
-- public Sanity dataset. This migration intentionally does not copy or delete
-- any existing Sanity documents.

CREATE TYPE "NewsletterSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');

CREATE TABLE "NewsletterSubscriber" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "status" "NewsletterSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "source" VARCHAR(80) NOT NULL DEFAULT 'site',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentPolicyVersion" VARCHAR(40) NOT NULL,
    "consentIpHash" VARCHAR(64),
    "consentUserAgentHash" VARCHAR(64),
    "confirmationTokenDigest" VARCHAR(64),
    "confirmationExpiresAt" TIMESTAMP(3),
    "confirmationSentAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "subscribedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "NewsletterSubscriber_email_normalized" CHECK ("email" = lower("email"))
);

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key"
    ON "NewsletterSubscriber"("email");

CREATE UNIQUE INDEX "NewsletterSubscriber_confirmationTokenDigest_key"
    ON "NewsletterSubscriber"("confirmationTokenDigest");

CREATE INDEX "NewsletterSubscriber_status_subscribedAt_idx"
    ON "NewsletterSubscriber"("status", "subscribedAt");
