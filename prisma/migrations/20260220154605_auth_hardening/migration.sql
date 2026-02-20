-- CreateEnum
CREATE TYPE "OnboardingState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('CLERK', 'SANITY');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'SKIPPED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserAuthIdentity" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserFollow" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingState" "OnboardingState" NOT NULL DEFAULT 'NOT_STARTED',
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserSubscription" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "WebhookEventLog" (
    "id" UUID NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "eventId" VARCHAR(191) NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateLimitState" (
    "id" UUID NOT NULL,
    "scope" VARCHAR(80) NOT NULL,
    "identifier" VARCHAR(191) NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimitState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookEventLog_provider_eventType_idx" ON "WebhookEventLog"("provider", "eventType");

-- CreateIndex
CREATE INDEX "WebhookEventLog_status_lastAttemptAt_idx" ON "WebhookEventLog"("status", "lastAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEventLog_provider_eventId_key" ON "WebhookEventLog"("provider", "eventId");

-- CreateIndex
CREATE INDEX "AuthRateLimitState_blockedUntil_idx" ON "AuthRateLimitState"("blockedUntil");

-- CreateIndex
CREATE INDEX "AuthRateLimitState_windowEndsAt_idx" ON "AuthRateLimitState"("windowEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthRateLimitState_scope_identifier_key" ON "AuthRateLimitState"("scope", "identifier");
