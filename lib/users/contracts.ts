export type AuthProviderValue = "CLERK" | "APPLE" | "GOOGLE" | "EMAIL_PASSWORD";
export type ThemePreferenceValue = "SYSTEM" | "LIGHT" | "DARK";
export type FollowTargetTypeValue = "TEAM" | "TOPIC" | "AUTHOR";
export type SubscriptionChannelValue = "EMAIL" | "PUSH" | "IN_APP";
export type SubscriptionTopicValue =
  | "BREAKING_NEWS"
  | "DAILY_DIGEST"
  | "TEAM_UPDATES"
  | "FANTASY_UPDATES"
  | "DRAFT_UPDATES";

export interface UserPreferenceDTO {
  favoriteTeam: string | null;
  themePreference: ThemePreferenceValue;
}

export interface UserFollowDTO {
  targetType: FollowTargetTypeValue;
  targetKey: string;
  createdAt: string;
}

export interface UserSubscriptionDTO {
  channel: SubscriptionChannelValue;
  topic: SubscriptionTopicValue;
  enabled: boolean;
  updatedAt: string;
}

export interface UserProfileDTO {
  id: string;
  authProvider: AuthProviderValue;
  authProviderUserId: string;
  displayName: string | null;
  primaryEmail: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferenceDTO;
  follows: UserFollowDTO[];
  subscriptions: UserSubscriptionDTO[];
}

export interface UpdateProfileInput {
  favoriteTeam?: string | null;
  themePreference?: ThemePreferenceValue | null;
}

export interface ReplaceFollowsInput {
  follows: Array<{
    targetType: FollowTargetTypeValue;
    targetKey: string;
  }>;
}

export interface UpdateSubscriptionsInput {
  subscriptions: Array<{
    channel: SubscriptionChannelValue;
    topic: SubscriptionTopicValue;
    enabled: boolean;
  }>;
}
