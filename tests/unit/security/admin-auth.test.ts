import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clerkMocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: clerkMocks.auth }));

import { authorizeAdminRequest } from "../../../lib/security/admin-auth";

const originalAdminUserIds = process.env.ADMIN_USER_IDS;
const originalAllowedRoles = process.env.ADMIN_ALLOWED_ROLES;
const originalAllowedOrgIds = process.env.ADMIN_ALLOWED_ORG_IDS;

function restoreEnvironmentValue(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_USER_IDS;
  delete process.env.ADMIN_ALLOWED_ROLES;
  delete process.env.ADMIN_ALLOWED_ORG_IDS;
});

afterEach(() => {
  restoreEnvironmentValue("ADMIN_USER_IDS", originalAdminUserIds);
  restoreEnvironmentValue("ADMIN_ALLOWED_ROLES", originalAllowedRoles);
  restoreEnvironmentValue("ADMIN_ALLOWED_ORG_IDS", originalAllowedOrgIds);
});

describe("admin authorization", () => {
  it("fails as unconfigured when role access has no organization allow-list", async () => {
    process.env.ADMIN_ALLOWED_ROLES = "org:admin";

    await expect(authorizeAdminRequest()).resolves.toEqual({
      authorized: false,
      reason: "unconfigured",
    });
    expect(clerkMocks.auth).not.toHaveBeenCalled();
  });

  it("keeps explicit user allow-list access independent of organization policy", async () => {
    process.env.ADMIN_USER_IDS = "user_explicit";
    process.env.ADMIN_ALLOWED_ROLES = "org:admin";
    clerkMocks.auth.mockResolvedValue({
      userId: "user_explicit",
      orgId: null,
      orgRole: null,
    });

    await expect(authorizeAdminRequest()).resolves.toEqual({
      authorized: true,
      userId: "user_explicit",
    });
  });

  it("requires both Clerk orgId and orgRole to match their allow-lists", async () => {
    process.env.ADMIN_ALLOWED_ORG_IDS = "org_trusted";
    process.env.ADMIN_ALLOWED_ROLES = "org:admin";
    clerkMocks.auth.mockResolvedValue({
      userId: "user_org_admin",
      orgId: "org_trusted",
      orgRole: "org:admin",
    });

    await expect(authorizeAdminRequest()).resolves.toEqual({
      authorized: true,
      userId: "user_org_admin",
    });
  });

  it("rejects an allowed role from another organization and ignores claim metadata", async () => {
    process.env.ADMIN_ALLOWED_ORG_IDS = "org_trusted";
    process.env.ADMIN_ALLOWED_ROLES = "org:admin";
    clerkMocks.auth.mockResolvedValue({
      userId: "user_other_org",
      orgId: "org_attacker",
      orgRole: "org:admin",
      sessionClaims: {
        role: "org:admin",
        publicMetadata: { role: "org:admin" },
      },
    });

    await expect(authorizeAdminRequest()).resolves.toEqual({
      authorized: false,
      reason: "forbidden",
    });
  });
});
