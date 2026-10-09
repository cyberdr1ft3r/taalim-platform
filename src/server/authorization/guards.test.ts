import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/server/db/client";
import {
  AuthenticationRequiredError,
  AccountNotProvisionedError,
  AuthorizationDeniedError,
  SecondFactorRequiredError,
} from "./errors";
import {
  canManageOwnAccount,
  hasAnyRole,
  hasRole,
  requireAuthenticatedUser,
  requirePrivilegedUser,
  requireRole,
  requireTaalimAccount,
} from "./guards";
import type { TaalimUser } from "../identity/current-user";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/server/db/client", () => ({ getPrismaClient: vi.fn() }));

const authMock = auth as unknown as Mock;
const prismaMock = {
  userAccount: { findUnique: vi.fn() },
};

function setSession(
  overrides: {
    userId?: string | null;
    sessionClaims?: unknown;
  } = {},
  account: { id: string; clerkSubject: string; roles: UserRole[] } | null = null,
) {
  authMock.mockResolvedValue({
    userId: "user_x",
    sessionId: "sess_1",
    sessionClaims: null,
    factorVerificationAge: null,
    ...overrides,
  });
  prismaMock.userAccount.findUnique.mockResolvedValue(
    account ? { ...account, roles: account.roles.map((role) => ({ role })) } : null,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (getPrismaClient as unknown as Mock).mockReturnValue(prismaMock);
});

describe("guards", () => {
  it("requires an authenticated session", async () => {
    setSession({ userId: null });
    await expect(requireAuthenticatedUser()).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  it("requires a provisioned Taalim account", async () => {
    setSession();
    await expect(requireTaalimAccount()).rejects.toBeInstanceOf(AccountNotProvisionedError);
  });

  it("enforces database roles, not client claims", async () => {
    setSession({}, { id: "acct_1", clerkSubject: "user_x", roles: [UserRole.LEARNER] });
    const user = await requireTaalimAccount();
    expect(hasRole(user, UserRole.LEARNER)).toBe(true);
    expect(hasRole(user, UserRole.ADMIN)).toBe(false);
    await expect(requireRole(UserRole.ADMIN)).rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(requireRole(UserRole.LEARNER)).resolves.toMatchObject({ account: { id: "acct_1" } });
    expect(hasAnyRole(user, [UserRole.TEACHER, UserRole.LEARNER])).toBe(true);
    expect(hasAnyRole(user, [UserRole.TEACHER, UserRole.ADMIN])).toBe(false);
  });

  it("requires a second factor for privileged roles", async () => {
    setSession(
      { sessionClaims: { amr: [{ method: "password" }] } },
      { id: "acct_1", clerkSubject: "user_x", roles: [UserRole.TEACHER] },
    );
    await expect(requirePrivilegedUser([UserRole.TEACHER])).rejects.toBeInstanceOf(
      SecondFactorRequiredError,
    );

    setSession(
      { sessionClaims: { fva: [100, 50] } },
      { id: "acct_1", clerkSubject: "user_x", roles: [UserRole.TEACHER] },
    );
    await expect(requirePrivilegedUser([UserRole.TEACHER])).resolves.toMatchObject({
      secondFactorVerified: true,
    });
  });

  it("does not elevate single-factor sessions into privileged access", async () => {
    setSession(
      { sessionClaims: { amr: [{ method: "password" }] } },
      { id: "acct_1", clerkSubject: "user_x", roles: [UserRole.ADMIN] },
    );
    await expect(requirePrivilegedUser([UserRole.ADMIN])).rejects.toBeInstanceOf(
      SecondFactorRequiredError,
    );
  });

  it("scopes self-management to the caller's own account", () => {
    const user: TaalimUser = {
      clerkSubject: "user_x",
      sessionId: "sess_1",
      secondFactorVerified: false,
      account: { id: "acct_1", clerkSubject: "user_x", roles: [UserRole.LEARNER] },
    };
    expect(canManageOwnAccount(user, "acct_1")).toBe(true);
    expect(canManageOwnAccount(user, "acct_2")).toBe(false);
    expect(canManageOwnAccount({ ...user, account: null }, "acct_1")).toBe(false);
  });
});
