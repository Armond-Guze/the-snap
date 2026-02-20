CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "AuthProvider" AS ENUM ('CLERK', 'APPLE', 'GOOGLE', 'EMAIL_PASSWORD');
CREATE TYPE "ThemePreference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');
CREATE TYPE "FollowTargetType" AS ENUM ('TEAM', 'TOPIC', 'AUTHOR');
CREATE TYPE "SubscriptionChannel" AS ENUM ('EMAIL', 'PUSH', 'IN_APP');
CREATE TYPE "SubscriptionTopic" AS ENUM ('BREAKING_NEWS', 'DAILY_DIGEST', 'TEAM_UPDATES', 'FANTASY_UPDATES', 'DRAFT_UPDATES');

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "displayName" VARCHAR(120),
  "primaryEmail" VARCHAR(320),
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAuthIdentity" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "providerUserId" VARCHAR(191) NOT NULL,
  "email" VARCHAR(320),
  "isPrimary" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserAuthIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPreference" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "favoriteTeam" VARCHAR(3),
  "themePreference" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserFollow" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "targetType" "FollowTargetType" NOT NULL,
  "targetKey" VARCHAR(120) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSubscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "channel" "SubscriptionChannel" NOT NULL,
  "topic" "SubscriptionTopic" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAuthIdentity_provider_providerUserId_key"
  ON "UserAuthIdentity"("provider", "providerUserId");

CREATE UNIQUE INDEX "UserAuthIdentity_userId_provider_key"
  ON "UserAuthIdentity"("userId", "provider");

CREATE INDEX "UserAuthIdentity_userId_idx"
  ON "UserAuthIdentity"("userId");

CREATE UNIQUE INDEX "UserPreference_userId_key"
  ON "UserPreference"("userId");

CREATE UNIQUE INDEX "UserFollow_userId_targetType_targetKey_key"
  ON "UserFollow"("userId", "targetType", "targetKey");

CREATE INDEX "UserFollow_targetType_targetKey_idx"
  ON "UserFollow"("targetType", "targetKey");

CREATE INDEX "UserFollow_userId_idx"
  ON "UserFollow"("userId");

CREATE UNIQUE INDEX "UserSubscription_userId_channel_topic_key"
  ON "UserSubscription"("userId", "channel", "topic");

CREATE INDEX "UserSubscription_userId_idx"
  ON "UserSubscription"("userId");

CREATE INDEX "User_createdAt_idx"
  ON "User"("createdAt");

CREATE INDEX "User_deletedAt_idx"
  ON "User"("deletedAt");

ALTER TABLE "UserAuthIdentity"
  ADD CONSTRAINT "UserAuthIdentity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPreference"
  ADD CONSTRAINT "UserPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFollow"
  ADD CONSTRAINT "UserFollow_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSubscription"
  ADD CONSTRAINT "UserSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
