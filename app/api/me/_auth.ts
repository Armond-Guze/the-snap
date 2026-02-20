import { auth, currentUser } from "@clerk/nextjs/server";
import { AuthProvider } from "@prisma/client";

import {
  ensureUserProfileForAuthIdentity,
  getUserProfileByAuthIdentity,
} from "@/lib/users/service";

export interface ClerkSessionContext {
  clerkUserId: string;
}

export async function getClerkSessionContext(): Promise<ClerkSessionContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  return {
    clerkUserId: userId,
  };
}

export async function getOrCreateCurrentUserProfile() {
  const context = await getClerkSessionContext();
  if (!context) {
    return null;
  }

  const existing = await getUserProfileByAuthIdentity(AuthProvider.CLERK, context.clerkUserId);
  if (existing) {
    return {
      clerkUserId: context.clerkUserId,
      profile: existing,
    };
  }

  const clerkUser = await currentUser();

  const created = await ensureUserProfileForAuthIdentity({
    provider: AuthProvider.CLERK,
    providerUserId: context.clerkUserId,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    displayName: clerkUser?.fullName ?? null,
    firstName: clerkUser?.firstName ?? null,
    lastName: clerkUser?.lastName ?? null,
    avatarUrl: clerkUser?.imageUrl ?? null,
  });

  return {
    clerkUserId: context.clerkUserId,
    profile: created,
  };
}
