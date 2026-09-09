-- First-party analytics events must survive serverless instance recycling.
-- No raw IP address, user agent, referrer, or client-provided timestamp is stored.

CREATE TYPE "AnalyticsEventType" AS ENUM ('ARTICLE_VIEW', 'ARTICLE_CLICK');

CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "articleId" VARCHAR(128) NOT NULL,
    "articleSlug" VARCHAR(240) NOT NULL,
    "articleTitle" VARCHAR(240),
    "category" VARCHAR(120),
    "author" VARCHAR(120),
    "readingTime" INTEGER,
    "source" VARCHAR(80),
    "position" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AnalyticsEvent_readingTime_range" CHECK (
        "readingTime" IS NULL OR ("readingTime" >= 0 AND "readingTime" <= 1440)
    ),
    CONSTRAINT "AnalyticsEvent_position_range" CHECK (
        "position" IS NULL OR ("position" >= 0 AND "position" <= 10000)
    )
);

-- Analytics uses a dedicated rate-limit table so every identifier in this
-- table is an HMAC digest; it never mixes with legacy raw-IP auth identifiers.
CREATE TABLE "AnalyticsRateLimitState" (
    "id" UUID NOT NULL,
    "scope" VARCHAR(40) NOT NULL,
    "identifier" VARCHAR(80) NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsRateLimitState_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_type_occurredAt_idx"
    ON "AnalyticsEvent"("type", "occurredAt");

CREATE INDEX "AnalyticsEvent_articleId_type_occurredAt_idx"
    ON "AnalyticsEvent"("articleId", "type", "occurredAt");

CREATE INDEX "AnalyticsEvent_category_type_occurredAt_idx"
    ON "AnalyticsEvent"("category", "type", "occurredAt");

CREATE INDEX "AnalyticsEvent_source_type_occurredAt_idx"
    ON "AnalyticsEvent"("source", "type", "occurredAt");

CREATE UNIQUE INDEX "AnalyticsRateLimitState_scope_identifier_key"
    ON "AnalyticsRateLimitState"("scope", "identifier");

CREATE INDEX "AnalyticsRateLimitState_blockedUntil_idx"
    ON "AnalyticsRateLimitState"("blockedUntil");

CREATE INDEX "AnalyticsRateLimitState_windowEndsAt_idx"
    ON "AnalyticsRateLimitState"("windowEndsAt");
