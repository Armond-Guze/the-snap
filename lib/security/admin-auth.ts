import "server-only";

import { auth } from "@clerk/nextjs/server";

export type AdminAuthorizationResult =
  | { authorized: true; userId: string }
  | {
      authorized: false;
      reason: "unconfigured" | "unauthenticated" | "forbidden" | "unavailable";
    };

function parseCsv(value: string | undefined, normalize = false): Set<string> {
  const entries = (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (normalize ? entry.toLowerCase() : entry));

  return new Set(entries);
}

export async function authorizeAdminRequest(): Promise<AdminAuthorizationResult> {
  const allowedUserIds = parseCsv(process.env.ADMIN_USER_IDS);
  const allowedRoles = parseCsv(process.env.ADMIN_ALLOWED_ROLES, true);
  const allowedOrgIds = parseCsv(process.env.ADMIN_ALLOWED_ORG_IDS);
  const hasOrganizationPolicy = allowedRoles.size > 0 && allowedOrgIds.size > 0;

  if (allowedUserIds.size === 0 && !hasOrganizationPolicy) {
    return { authorized: false, reason: "unconfigured" };
  }

  try {
    const { userId, orgId, orgRole } = await auth();
    if (!userId) {
      return { authorized: false, reason: "unauthenticated" };
    }

    if (allowedUserIds.has(userId)) {
      return { authorized: true, userId };
    }

    if (
      hasOrganizationPolicy &&
      orgId &&
      orgRole &&
      allowedOrgIds.has(orgId) &&
      allowedRoles.has(orgRole.toLowerCase())
    ) {
      return { authorized: true, userId };
    }

    return { authorized: false, reason: "forbidden" };
  } catch {
    return { authorized: false, reason: "unavailable" };
  }
}
