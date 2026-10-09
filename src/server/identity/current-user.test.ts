import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/server/db/client";
import { provisionSelfServiceAccount, resolveCurrentUser } from "./current-user";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/server/db/client", () => ({ getPrismaClient: vi.fn() }));

const authMock = auth as unknown as Mock;
const prismaMock = {
  userAccount: { findUnique: vi.fn(), upsert: vi.fn() },
  roleAssignment: { findUnique: vi.fn(), createMany: vi.fn() },
};

function setSession(overrides: {
  userId?: string | null;
  sessionId?: string | null;
  sessionClaims?: unknown;
  factorVerificationAge?: [number, number] | null;
}) {
  authMock.mockResolvedValue({
    userId: null,
    sessionId: null,
    sessionClaims: null,
    factorVerificationAge: null,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (getPrismaClient as unknown as Mock).mockReturnValue(prismaMock);
});

describe("resolveCurrentUser", () => {
  it("reports unauthenticated without a Clerk session", async () => {
    setSession({ userId: null });
    const state = await resolveCurrentUser();
    expect(state.status).toBe("unauthenticated");
  });

  it("reports no_account for a session without a UserAccount row", async () => {
    setSession({ userId: "user_x", sessionId: "sess_1" });
    prismaMock.userAccount.findUnique.mockResolvedValue(null);
    const state = await resolveCurrentUser();
    expect(state.status).toBe("no_account");
    if (state.status !== "unauthenticated") {
      expect(state.user.account).toBeNull();
      expect(state.user.clerkSubject).toBe("user_x");
    }
  });

  it("reports active with roles when the account exists", async () => {
    setSession({
      userId: "user_x",
      sessionId: "sess_1",
      sessionClaims: { amr: [{ method: "password" }] },
    });
    prismaMock.userAccount.findUnique.mockResolvedValue({
      id: "acct_1",
      clerkSubject: "user_x",
      roles: [{ role: UserRole.LEARNER }, { role: UserRole.PAYER }],
    });
    const state = await resolveCurrentUser();
    expect(state.status).toBe("active");
    if (state.status === "active") {
      expect(state.user.account?.id).toBe("acct_1");
      expect(state.user.account?.roles).toEqual([UserRole.LEARNER, UserRole.PAYER]);
      expect(state.user.secondFactorVerified).toBe(false);
    }
  });

  it("computes second-factor verification from session evidence", async () => {
    setSession({
      userId: "user_x",
      sessionId: "sess_1",
      sessionClaims: { fva: [100, 50] },
    });
    prismaMock.userAccount.findUnique.mockResolvedValue({
      id: "acct_1",
      clerkSubject: "user_x",
      roles: [{ role: UserRole.TEACHER }],
    });
    const state = await resolveCurrentUser();
    expect(state.status).toBe("active");
    if (state.status === "active") expect(state.user.secondFactorVerified).toBe(true);
  });
});

describe("provisionSelfServiceAccount", () => {
  it("creates the account and self-service roles idempotently", async () => {
    prismaMock.userAccount.upsert.mockResolvedValue({ id: "acct_1", clerkSubject: "user_x" });
    prismaMock.roleAssignment.createMany.mockResolvedValue({ count: 2 });
    prismaMock.userAccount.findUnique.mockResolvedValue({
      id: "acct_1",
      clerkSubject: "user_x",
      roles: [{ role: UserRole.LEARNER }, { role: UserRole.PAYER }],
    });

    const account = await provisionSelfServiceAccount("user_x");

    expect(prismaMock.userAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clerkSubject: "user_x" }, update: {} }),
    );
    expect(account.roles).toEqual([UserRole.LEARNER, UserRole.PAYER]);
    const createManyArgs = prismaMock.roleAssignment.createMany.mock.calls[0][0] as {
      data: { role: UserRole }[];
      skipDuplicates: boolean;
    };
    expect(createManyArgs.skipDuplicates).toBe(true);
    expect(createManyArgs.data.map((row) => row.role).sort()).toEqual([
      UserRole.LEARNER,
      UserRole.PAYER,
    ]);
  });

  it("never assigns privileged roles through self-service provisioning", async () => {
    prismaMock.userAccount.upsert.mockResolvedValue({ id: "acct_1", clerkSubject: "user_x" });
    prismaMock.roleAssignment.createMany.mockResolvedValue({ count: 1 });
    prismaMock.userAccount.findUnique.mockResolvedValue({
      id: "acct_1",
      clerkSubject: "user_x",
      roles: [{ role: UserRole.LEARNER }],
    });

    await provisionSelfServiceAccount("user_x", [
      UserRole.LEARNER,
      UserRole.TEACHER,
      UserRole.ADMIN,
    ]);

    const createManyArgs = prismaMock.roleAssignment.createMany.mock.calls[0][0] as {
      data: { role: UserRole }[];
    };
    expect(createManyArgs.data.map((row) => row.role)).toEqual([UserRole.LEARNER]);
  });

  it("rejects when no self-service role is requested", async () => {
    await expect(
      provisionSelfServiceAccount("user_x", [UserRole.TEACHER]),
    ).rejects.toThrow(/self-service role/i);
    expect(prismaMock.userAccount.upsert).not.toHaveBeenCalled();
  });
});
