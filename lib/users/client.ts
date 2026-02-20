import type {
  ReplaceFollowsInput,
  UpdateProfileInput,
  UpdateSubscriptionsInput,
  UserProfileDTO,
} from "@/lib/users/contracts";

interface ProfileResponse {
  profile: UserProfileDTO;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error ?? data.message ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function fetchCurrentUserProfile(): Promise<UserProfileDTO | null> {
  const response = await fetch("/api/me/profile", {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as ProfileResponse;
  return data.profile;
}

export async function updateCurrentUserProfile(input: UpdateProfileInput): Promise<UserProfileDTO> {
  const response = await fetch("/api/me/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as ProfileResponse;
  return data.profile;
}

export async function replaceCurrentUserFollows(input: ReplaceFollowsInput): Promise<UserProfileDTO> {
  const response = await fetch("/api/me/follows", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as ProfileResponse;
  return data.profile;
}

export async function updateCurrentUserSubscriptions(
  input: UpdateSubscriptionsInput
): Promise<UserProfileDTO> {
  const response = await fetch("/api/me/subscriptions", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as ProfileResponse;
  return data.profile;
}
