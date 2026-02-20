import "server-only";

import {
  AuthProvider,
  FollowTargetType,
  Prisma,
  SubscriptionChannel,
  SubscriptionTopic,
  ThemePreference,
} from "@prisma/client";

import { db } from "@/lib/db";
import { normalizeTeamCode } from "@/lib/users/constants";
import type {
  ReplaceFollowsInput,
  UpdateProfileInput,
  UpdateSubscriptionsInput,
  UserProfileDTO,
} from "@/lib/users/contracts";

interface UpsertAuthUserInput {
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  favoriteTeam?: string | null;
}

const userProfileInclude = {
  preferences: true,
  follows: {
    orderBy: [{ targetType: "asc" }, { targetKey: "asc" }],
  },
  subscriptions: {
    orderBy: [{ topic: "asc" }, { channel: "asc" }],
  },
  authIdentities: {
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userProfileInclude;
}>;

type DbLike = Prisma.TransactionClient | typeof db;

function normalizeOptionalText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildDisplayName(input: Pick<UpsertAuthUserInput, "displayName" | "firstName" | "lastName">): string | null | undefined {
  const explicit = normalizeOptionalText(input.displayName);
  if (explicit !== undefined) return explicit;

  const first = normalizeOptionalText(input.firstName);
  const last = normalizeOptionalText(input.lastName);

  if (first === undefined && last === undefined) return undefined;
  const joined = [first, last].filter(Boolean).join(" ").trim();
  return joined.length > 0 ? joined : null;
}

function toThemePreference(value: UpdateProfileInput["themePreference"]): ThemePreference {
  if (value === null || value === undefined || value === "SYSTEM") {
    return ThemePreference.SYSTEM;
  }
  if (value === "LIGHT") return ThemePreference.LIGHT;
  if (value === "DARK") return ThemePreference.DARK;

  throw new Error("INVALID_THEME_PREFERENCE");
}

function toDto(record: UserWithRelations): UserProfileDTO {
  const identity =
    record.authIdentities.find((item) => item.isPrimary) ??
    record.authIdentities[0];

  return {
    id: record.id,
    authProvider: (identity?.provider ?? AuthProvider.CLERK) as UserProfileDTO["authProvider"],
    authProviderUserId: identity?.providerUserId ?? "",
    displayName: record.displayName,
    primaryEmail: record.primaryEmail,
    avatarUrl: record.avatarUrl,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    preferences: {
      favoriteTeam: record.preferences?.favoriteTeam ?? null,
      themePreference: (record.preferences?.themePreference ?? ThemePreference.SYSTEM) as UserProfileDTO["preferences"]["themePreference"],
    },
    follows: record.follows.map((follow) => ({
      targetType: follow.targetType as UserProfileDTO["follows"][number]["targetType"],
      targetKey: follow.targetKey,
      createdAt: follow.createdAt.toISOString(),
    })),
    subscriptions: record.subscriptions.map((subscription) => ({
      channel: subscription.channel as UserProfileDTO["subscriptions"][number]["channel"],
      topic: subscription.topic as UserProfileDTO["subscriptions"][number]["topic"],
      enabled: subscription.enabled,
      updatedAt: subscription.updatedAt.toISOString(),
    })),
  };
}

async function getUserIdByAuthIdentity(client: DbLike, provider: AuthProvider, providerUserId: string): Promise<string | null> {
  const identity = await client.userAuthIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId,
      },
    },
    select: {
      userId: true,
    },
  });

  return identity?.userId ?? null;
}

async function getUserRecordById(client: DbLike, userId: string): Promise<UserWithRelations | null> {
  return client.user.findUnique({
    where: {
      id: userId,
    },
    include: userProfileInclude,
  });
}

function toFollowTargetType(value: string): FollowTargetType | null {
  if (value === FollowTargetType.TEAM) return FollowTargetType.TEAM;
  if (value === FollowTargetType.TOPIC) return FollowTargetType.TOPIC;
  if (value === FollowTargetType.AUTHOR) return FollowTargetType.AUTHOR;
  return null;
}

function toSubscriptionChannel(value: string): SubscriptionChannel | null {
  if (value === SubscriptionChannel.EMAIL) return SubscriptionChannel.EMAIL;
  if (value === SubscriptionChannel.PUSH) return SubscriptionChannel.PUSH;
  if (value === SubscriptionChannel.IN_APP) return SubscriptionChannel.IN_APP;
  return null;
}

function toSubscriptionTopic(value: string): SubscriptionTopic | null {
  if (value === SubscriptionTopic.BREAKING_NEWS) return SubscriptionTopic.BREAKING_NEWS;
  if (value === SubscriptionTopic.DAILY_DIGEST) return SubscriptionTopic.DAILY_DIGEST;
  if (value === SubscriptionTopic.TEAM_UPDATES) return SubscriptionTopic.TEAM_UPDATES;
  if (value === SubscriptionTopic.FANTASY_UPDATES) return SubscriptionTopic.FANTASY_UPDATES;
  if (value === SubscriptionTopic.DRAFT_UPDATES) return SubscriptionTopic.DRAFT_UPDATES;
  return null;
}

export async function getUserProfileByAuthIdentity(
  provider: AuthProvider,
  providerUserId: string
): Promise<UserProfileDTO | null> {
  const normalizedProviderUserId = providerUserId.trim();
  if (!normalizedProviderUserId) return null;

  const userId = await getUserIdByAuthIdentity(db, provider, normalizedProviderUserId);
  if (!userId) return null;

  const record = await getUserRecordById(db, userId);
  if (!record || record.deletedAt) return null;

  return toDto(record);
}

export async function upsertUserFromAuthIdentity(input: UpsertAuthUserInput): Promise<UserProfileDTO> {
  const providerUserId = input.providerUserId.trim();
  if (!providerUserId) {
    throw new Error("AUTH_IDENTITY_REQUIRED");
  }

  const displayName = buildDisplayName(input);
  const email = normalizeOptionalText(input.email);
  const avatarUrl = normalizeOptionalText(input.avatarUrl);

  let normalizedFavoriteTeam: string | null | undefined;
  if (input.favoriteTeam !== undefined) {
    if (input.favoriteTeam === null) {
      normalizedFavoriteTeam = null;
    } else {
      const teamCode = normalizeTeamCode(input.favoriteTeam);
      if (!teamCode) {
        throw new Error("INVALID_TEAM_CODE");
      }
      normalizedFavoriteTeam = teamCode;
    }
  }

  const record = await db.$transaction(async (tx) => {
    const existingIdentity = await tx.userAuthIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: input.provider,
          providerUserId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!existingIdentity) {
      return tx.user.create({
        data: {
          displayName: displayName ?? null,
          primaryEmail: email ?? null,
          avatarUrl: avatarUrl ?? null,
          authIdentities: {
            create: {
              provider: input.provider,
              providerUserId,
              email: email ?? null,
              isPrimary: true,
            },
          },
          preferences: {
            create: {
              favoriteTeam: normalizedFavoriteTeam ?? null,
            },
          },
        },
        include: userProfileInclude,
      });
    }

    const userUpdate: Prisma.UserUpdateInput = {
      deletedAt: null,
    };

    if (displayName !== undefined) {
      userUpdate.displayName = displayName;
    }

    if (email !== undefined) {
      userUpdate.primaryEmail = email;
    }

    if (avatarUrl !== undefined) {
      userUpdate.avatarUrl = avatarUrl;
    }

    if (normalizedFavoriteTeam !== undefined) {
      userUpdate.preferences = {
        upsert: {
          create: {
            favoriteTeam: normalizedFavoriteTeam,
          },
          update: {
            favoriteTeam: normalizedFavoriteTeam,
          },
        },
      };
    }

    await tx.userAuthIdentity.update({
      where: {
        provider_providerUserId: {
          provider: input.provider,
          providerUserId,
        },
      },
      data: {
        email: email ?? undefined,
        isPrimary: true,
      },
    });

    return tx.user.update({
      where: {
        id: existingIdentity.userId,
      },
      data: userUpdate,
      include: userProfileInclude,
    });
  });

  return toDto(record);
}

export async function ensureUserProfileForAuthIdentity(input: UpsertAuthUserInput): Promise<UserProfileDTO> {
  const existing = await getUserProfileByAuthIdentity(input.provider, input.providerUserId);
  if (existing) return existing;

  return upsertUserFromAuthIdentity(input);
}

export async function markUserDeletedByAuthIdentity(provider: AuthProvider, providerUserId: string): Promise<void> {
  const normalizedProviderUserId = providerUserId.trim();
  if (!normalizedProviderUserId) return;

  const userId = await getUserIdByAuthIdentity(db, provider, normalizedProviderUserId);
  if (!userId) return;

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function updatePreferencesByAuthIdentity(
  provider: AuthProvider,
  providerUserId: string,
  input: UpdateProfileInput
): Promise<UserProfileDTO> {
  const normalizedProviderUserId = providerUserId.trim();
  if (!normalizedProviderUserId) {
    throw new Error("AUTH_IDENTITY_REQUIRED");
  }

  const hasFavoriteTeam = Object.prototype.hasOwnProperty.call(input, "favoriteTeam");
  const hasThemePreference = Object.prototype.hasOwnProperty.call(input, "themePreference");

  if (!hasFavoriteTeam && !hasThemePreference) {
    throw new Error("NO_UPDATES");
  }

  let nextFavoriteTeam: string | null | undefined;
  if (hasFavoriteTeam) {
    if (input.favoriteTeam === null || input.favoriteTeam === undefined) {
      nextFavoriteTeam = null;
    } else {
      const normalizedTeamCode = normalizeTeamCode(input.favoriteTeam);
      if (!normalizedTeamCode) {
        throw new Error("INVALID_TEAM_CODE");
      }
      nextFavoriteTeam = normalizedTeamCode;
    }
  }

  const record = await db.$transaction(async (tx) => {
    const userId = await getUserIdByAuthIdentity(tx, provider, normalizedProviderUserId);
    if (!userId) {
      throw new Error("USER_NOT_FOUND");
    }

    const preferenceCreate: Prisma.UserPreferenceCreateWithoutUserInput = {};
    const preferenceUpdate: Prisma.UserPreferenceUpdateWithoutUserInput = {};

    if (hasFavoriteTeam) {
      preferenceCreate.favoriteTeam = nextFavoriteTeam;
      preferenceUpdate.favoriteTeam = nextFavoriteTeam;
    }

    if (hasThemePreference) {
      const themePreference = toThemePreference(input.themePreference);
      preferenceCreate.themePreference = themePreference;
      preferenceUpdate.themePreference = themePreference;
    }

    return tx.user.update({
      where: {
        id: userId,
      },
      data: {
        preferences: {
          upsert: {
            create: preferenceCreate,
            update: preferenceUpdate,
          },
        },
      },
      include: userProfileInclude,
    });
  });

  return toDto(record);
}

export async function replaceFollowsByAuthIdentity(
  provider: AuthProvider,
  providerUserId: string,
  input: ReplaceFollowsInput
): Promise<UserProfileDTO> {
  const normalizedProviderUserId = providerUserId.trim();
  if (!normalizedProviderUserId) {
    throw new Error("AUTH_IDENTITY_REQUIRED");
  }

  const sanitized = input.follows
    .map((item) => {
      const targetType = toFollowTargetType(item.targetType);
      const targetKey = item.targetKey.trim();
      if (!targetType || !targetKey) return null;
      return {
        targetType,
        targetKey,
      };
    })
    .filter((item): item is { targetType: FollowTargetType; targetKey: string } => item !== null);

  const record = await db.$transaction(async (tx) => {
    const userId = await getUserIdByAuthIdentity(tx, provider, normalizedProviderUserId);
    if (!userId) {
      throw new Error("USER_NOT_FOUND");
    }

    await tx.userFollow.deleteMany({
      where: {
        userId,
      },
    });

    if (sanitized.length > 0) {
      await tx.userFollow.createMany({
        data: sanitized.map((item) => ({
          userId,
          targetType: item.targetType,
          targetKey: item.targetKey,
        })),
        skipDuplicates: true,
      });
    }

    const next = await getUserRecordById(tx, userId);
    if (!next) {
      throw new Error("USER_NOT_FOUND");
    }

    return next;
  });

  return toDto(record);
}

export async function updateSubscriptionsByAuthIdentity(
  provider: AuthProvider,
  providerUserId: string,
  input: UpdateSubscriptionsInput
): Promise<UserProfileDTO> {
  const normalizedProviderUserId = providerUserId.trim();
  if (!normalizedProviderUserId) {
    throw new Error("AUTH_IDENTITY_REQUIRED");
  }

  const sanitized = input.subscriptions
    .map((item) => {
      const channel = toSubscriptionChannel(item.channel);
      const topic = toSubscriptionTopic(item.topic);
      if (!channel || !topic) return null;

      return {
        channel,
        topic,
        enabled: Boolean(item.enabled),
      };
    })
    .filter(
      (
        item
      ): item is {
        channel: SubscriptionChannel;
        topic: SubscriptionTopic;
        enabled: boolean;
      } => item !== null
    );

  const record = await db.$transaction(async (tx) => {
    const userId = await getUserIdByAuthIdentity(tx, provider, normalizedProviderUserId);
    if (!userId) {
      throw new Error("USER_NOT_FOUND");
    }

    for (const item of sanitized) {
      await tx.userSubscription.upsert({
        where: {
          userId_channel_topic: {
            userId,
            channel: item.channel,
            topic: item.topic,
          },
        },
        create: {
          userId,
          channel: item.channel,
          topic: item.topic,
          enabled: item.enabled,
        },
        update: {
          enabled: item.enabled,
        },
      });
    }

    const next = await getUserRecordById(tx, userId);
    if (!next) {
      throw new Error("USER_NOT_FOUND");
    }

    return next;
  });

  return toDto(record);
}
