import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import { getPrismaClient } from "@/server/db/client";
import { AuthorizationDeniedError } from "@/server/authorization/errors";
import { canManageLearner } from "@/server/authorization/policies/relationships";
import { canAccessClassResource } from "@/server/authorization/policies/class-resource";
import { canAccessTeacherVerification } from "@/server/authorization/policies/teacher-verification";
import {
  createTemporaryAccessForUser,
  readStoredObjectForUser,
  StorageAccessDeniedError,
} from "@/server/authorization/policies/stored-object-access";
import {
  acceptRelationshipInvite,
  createRelationshipInvite,
  listOwnRelationships,
  revokeRelationship,
} from "@/server/relationships/service";
import {
  provisionSelfServiceAccount,
} from "@/server/identity/current-user";
import type { TaalimUser } from "@/server/identity/current-user";
import type { StorageProvider } from "@/server/storage/types";

vi.mock("server-only", () => ({}));

const enabled = process.env.TAALIM_RUN_DB_TESTS === "1";

function userFor(
  account: { id: string; clerkSubject: string },
  roles: UserRole[],
  secondFactorVerified = false,
): TaalimUser {
  return {
    clerkSubject: account.clerkSubject,
    sessionId: `sess_${account.id}`,
    secondFactorVerified,
    account: { id: account.id, clerkSubject: account.clerkSubject, roles },
  };
}

describe.skipIf(!enabled)("issue 5 authorization", () => {
  const prisma = enabled ? getPrismaClient() : null;

  function db() {
    if (!prisma) throw new Error("postgres tests are disabled");
    return prisma;
  }

  async function cleanBusinessData() {
    if (!prisma) return;
    await prisma.entitlement.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.verificationDocument.deleteMany();
    await prisma.storedObject.deleteMany();
    await prisma.classPriceVersion.deleteMany();
    await prisma.classSession.deleteMany();
    await prisma.classOffering.deleteMany();
    await prisma.subjectLevel.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.educationLevel.deleteMany();
    await prisma.curriculum.deleteMany();
    await prisma.verificationDocument.deleteMany();
    await prisma.teacherVerificationCase.deleteMany();
    await prisma.teacherApprovalScope.deleteMany();
    await prisma.teacherProfile.deleteMany();
    await prisma.guardianLearnerRelationship.deleteMany();
    await prisma.roleAssignment.deleteMany();
    await prisma.userAccount.deleteMany();
    await prisma.paymentEvent.deleteMany();
    await prisma.paymentAttempt.deleteMany();
    await prisma.financialEvent.deleteMany();
    await prisma.commissionVersion.deleteMany();
  }

  beforeEach(cleanBusinessData);

  afterAll(async () => {
    if (!prisma) return;
    await cleanBusinessData();
    await prisma.$disconnect();
  });

  interface Fixture {
    payer: { id: string; clerkSubject: string };
    learner: { id: string; clerkSubject: string };
    stranger: { id: string; clerkSubject: string };
    otherLearner: { id: string; clerkSubject: string };
    teacher: { id: string; clerkSubject: string };
    otherTeacher: { id: string; clerkSubject: string };
    admin: { id: string; clerkSubject: string };
    classId: string;
    verificationCaseId: string;
    verificationObjectId: string;
    learnerOwnedObjectId: string;
  }

  async function createFixture(): Promise<Fixture> {
    const client = db();

    const createAccount = async (clerkSubject: string, roles: UserRole[]) => {
      const account = await client.userAccount.create({ data: { clerkSubject } });
      await client.roleAssignment.createMany({
        data: roles.map((role) => ({ userId: account.id, role })),
      });
      return account;
    };

    const payer = await createAccount("syn_issue5_payer", [UserRole.PAYER]);
    const learner = await createAccount("syn_issue5_learner", [UserRole.LEARNER]);
    const stranger = await createAccount("syn_issue5_stranger", [UserRole.LEARNER]);
    const otherLearner = await createAccount("syn_issue5_other_learner", [UserRole.LEARNER]);
    const teacher = await createAccount("syn_issue5_teacher", [UserRole.TEACHER]);
    const otherTeacher = await createAccount("syn_issue5_other_teacher", [UserRole.TEACHER]);
    const admin = await createAccount("syn_issue5_admin", [UserRole.ADMIN]);

    const teacherProfile = await client.teacherProfile.create({
      data: { userId: teacher.id },
    });

    const curriculum = await client.curriculum.create({
      data: { code: "I5", name: "Issue 5 Curriculum" },
    });
    const level = await client.educationLevel.create({
      data: { curriculumId: curriculum.id, code: "L1", name: "Level 1" },
    });
    const subject = await client.subject.create({
      data: { code: "I5SUB", name: "Issue 5 Subject" },
    });
    await client.subjectLevel.create({
      data: { subjectId: subject.id, educationLevelId: level.id },
    });
    const classOffering = await client.classOffering.create({
      data: {
        teacherProfileId: teacherProfile.id,
        subjectId: subject.id,
        educationLevelId: level.id,
        capacity: 5,
      },
    });
    const price = await client.classPriceVersion.create({
      data: {
        classId: classOffering.id,
        amountMinor: 10_000,
        currency: "MAD",
        effectiveFrom: new Date("2026-10-01T00:00:00.000Z"),
      },
    });
    await client.classOffering.update({
      where: { id: classOffering.id },
      data: { currentPriceVersionId: price.id },
    });

    const verificationCase = await client.teacherVerificationCase.create({
      data: { teacherProfileId: teacherProfile.id },
    });
    const verificationObject = await client.storedObject.create({
      data: {
        provider: "local",
        storageKey: "so_0123456789abcdef0123456789abcd00",
        originalFilename: "synthetic-verification.pdf",
        mimeType: "application/pdf",
        sizeBytes: BigInt(4096),
        // In the real upload flow the owning teacher is also the creator;
        // the feature policy must still decide access on its own.
        createdByUserId: teacher.id,
      },
    });
    const learnerOwnedObject = await client.storedObject.create({
      data: {
        provider: "local",
        storageKey: "so_0123456789abcdef0123456789abcd11",
        originalFilename: "synthetic-notes.pdf",
        mimeType: "application/pdf",
        sizeBytes: BigInt(128),
        createdByUserId: learner.id,
      },
    });
    await client.verificationDocument.create({
      data: { verificationCaseId: verificationCase.id, storedObjectId: verificationObject.id },
    });

    return {
      payer,
      learner,
      stranger,
      otherLearner,
      teacher,
      otherTeacher,
      admin,
      classId: classOffering.id,
      verificationCaseId: verificationCase.id,
      verificationObjectId: verificationObject.id,
      learnerOwnedObjectId: learnerOwnedObject.id,
    };
  }

  async function enrollLearnerWithEntitlement(learnerId: string, fixture: Fixture) {
    const client = db();
    const subscription = await client.subscription.create({
      data: {
        payerUserId: fixture.payer.id,
        learnerUserId: learnerId,
        classId: fixture.classId,
        priceVersionId: (
          await client.classPriceVersion.findFirstOrThrow({ where: { classId: fixture.classId } })
        ).id,
        state: "ACTIVE",
        agreedAmountMinor: 10_000,
        currency: "MAD",
        originalBillingDay: 8,
      },
    });
    const enrollment = await client.enrollment.create({
      data: {
        subscriptionId: subscription.id,
        learnerUserId: learnerId,
        classId: fixture.classId,
        state: "ACTIVE",
      },
    });
    await client.entitlement.create({
      data: {
        enrollmentId: enrollment.id,
        startsAt: new Date(Date.now() - 24 * 3600_000),
        endsAt: new Date(Date.now() + 30 * 24 * 3600_000),
        state: "ACTIVE",
      },
    });
    return enrollment;
  }

  function createSpyProvider() {
    return {
      get: vi.fn(async () => {
        const bytes = new TextEncoder().encode("synthetic-secret-bytes");
        return new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        });
      }),
      put: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      metadata: vi.fn(),
      createTemporaryAccess: vi.fn(async () => "https://storage.example.invalid/temporary"),
    } satisfies StorageProvider;
  }

  it("provisions a single account under concurrent first sign-ins", async () => {
    const results = await Promise.allSettled([
      provisionSelfServiceAccount("syn_issue5_concurrent"),
      provisionSelfServiceAccount("syn_issue5_concurrent"),
      provisionSelfServiceAccount("syn_issue5_concurrent"),
    ]);
    const rejections = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => String(result.reason));
    expect(rejections).toEqual([]);

    const accounts = await db().userAccount.findMany({
      where: { clerkSubject: "syn_issue5_concurrent" },
      include: { roles: true },
    });
    expect(accounts).toHaveLength(1);
    expect(accounts[0].roles.map((row) => row.role).sort()).toEqual([
      UserRole.LEARNER,
      UserRole.PAYER,
    ]);
  });

  it("does not self-assign privileged roles during provisioning", async () => {
    const account = await provisionSelfServiceAccount("syn_issue5_privileged_attempt", [
      UserRole.LEARNER,
      UserRole.TEACHER,
      UserRole.ADMIN,
    ]);
    expect(account.roles).toEqual([UserRole.LEARNER]);
    const privileged = await db().roleAssignment.findMany({
      where: { userId: account.id, role: { in: [UserRole.TEACHER, UserRole.ADMIN] } },
    });
    expect(privileged).toHaveLength(0);
  });

  it("runs the invite, accept, and revoke lifecycle with party-only checks", async () => {
    const fixture = await createFixture();
    const payerUser = userFor(fixture.payer, [UserRole.PAYER]);
    const learnerUser = userFor(fixture.learner, [UserRole.LEARNER]);
    const strangerUser = userFor(fixture.stranger, [UserRole.LEARNER]);
    const client = db();

    await expect(
      createRelationshipInvite(client, learnerUser, {
        learnerAccountId: fixture.learner.id,
        relationshipType: "GUARDIAN_AND_PAYER",
      }),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);

    const invite = await createRelationshipInvite(client, payerUser, {
      learnerAccountId: fixture.learner.id,
      relationshipType: "GUARDIAN_AND_PAYER",
    });
    expect(invite.status).toBe("PENDING");

    const duplicate = await createRelationshipInvite(client, payerUser, {
      learnerAccountId: fixture.learner.id,
      relationshipType: "GUARDIAN_AND_PAYER",
    });
    expect(duplicate.id).toBe(invite.id);

    await expect(
      acceptRelationshipInvite(client, strangerUser, invite.id),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(
      acceptRelationshipInvite(client, payerUser, invite.id),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);

    const active = await acceptRelationshipInvite(client, learnerUser, invite.id);
    expect(active.status).toBe("ACTIVE");

    await expect(
      revokeRelationship(client, strangerUser, invite.id),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
    const revoked = await revokeRelationship(client, payerUser, invite.id);
    expect(revoked.status).toBe("REVOKED");

    expect(await canManageLearner(client, payerUser, fixture.learner.id)).toBe(false);
    expect(await listOwnRelationships(client, strangerUser)).toHaveLength(0);
    const ownRows = await listOwnRelationships(client, payerUser);
    expect(ownRows.map((row) => row.id)).toEqual([invite.id]);
  });

  it("rejects self-relationships and targets without the learner role", async () => {
    const fixture = await createFixture();
    const client = db();
    const payerUser = userFor(fixture.payer, [UserRole.PAYER, UserRole.LEARNER]);

    await expect(
      createRelationshipInvite(client, payerUser, {
        learnerAccountId: fixture.payer.id,
        relationshipType: "PAYER",
      }),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);

    await expect(
      createRelationshipInvite(client, payerUser, {
        learnerAccountId: fixture.teacher.id,
        relationshipType: "PAYER",
      }),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("restricts class resources to entitled learners, guardian-capable relationships, and 2FA staff", async () => {
    const fixture = await createFixture();
    const client = db();
    await enrollLearnerWithEntitlement(fixture.learner.id, fixture);

    const learnerUser = userFor(fixture.learner, [UserRole.LEARNER]);
    const strangerUser = userFor(fixture.stranger, [UserRole.LEARNER]);
    expect(await canAccessClassResource(client, learnerUser, fixture.classId)).toBe(true);
    expect(await canAccessClassResource(client, strangerUser, fixture.classId)).toBe(false);

    const teacherSingle = userFor(fixture.teacher, [UserRole.TEACHER], false);
    const teacherMfa = userFor(fixture.teacher, [UserRole.TEACHER], true);
    expect(await canAccessClassResource(client, teacherSingle, fixture.classId)).toBe(false);
    expect(await canAccessClassResource(client, teacherMfa, fixture.classId)).toBe(true);

    const adminSingle = userFor(fixture.admin, [UserRole.ADMIN], false);
    const adminMfa = userFor(fixture.admin, [UserRole.ADMIN], true);
    expect(await canAccessClassResource(client, adminSingle, fixture.classId)).toBe(false);
    expect(await canAccessClassResource(client, adminMfa, fixture.classId)).toBe(true);

    const payerUser = userFor(fixture.payer, [UserRole.PAYER]);
    expect(await canAccessClassResource(client, payerUser, fixture.classId)).toBe(false);

    const payerOnly = await client.guardianLearnerRelationship.create({
      data: {
        guardianPayerUserId: fixture.payer.id,
        learnerUserId: fixture.learner.id,
        relationshipType: "PAYER",
        status: "ACTIVE",
      },
    });
    expect(await canAccessClassResource(client, payerUser, fixture.classId)).toBe(false);

    await client.guardianLearnerRelationship.update({
      where: { id: payerOnly.id },
      data: { relationshipType: "GUARDIAN" },
    });
    expect(await canAccessClassResource(client, payerUser, fixture.classId)).toBe(true);

    await client.guardianLearnerRelationship.update({
      where: { id: payerOnly.id },
      data: { relationshipType: "GUARDIAN_AND_PAYER" },
    });
    expect(await canAccessClassResource(client, payerUser, fixture.classId)).toBe(true);

    await client.guardianLearnerRelationship.update({
      where: { id: payerOnly.id },
      data: { status: "REVOKED" },
    });
    expect(await canAccessClassResource(client, payerUser, fixture.classId)).toBe(false);
  });

  it("restricts teacher verification access to the owning teacher and admins with 2FA", async () => {
    const fixture = await createFixture();
    const client = db();

    const ownerSingle = userFor(fixture.teacher, [UserRole.TEACHER], false);
    const ownerMfa = userFor(fixture.teacher, [UserRole.TEACHER], true);
    expect(await canAccessTeacherVerification(client, ownerSingle, fixture.verificationCaseId)).toBe(
      false,
    );
    expect(await canAccessTeacherVerification(client, ownerMfa, fixture.verificationCaseId)).toBe(
      true,
    );

    const otherMfa = userFor(fixture.otherTeacher, [UserRole.TEACHER], true);
    expect(await canAccessTeacherVerification(client, otherMfa, fixture.verificationCaseId)).toBe(
      false,
    );

    const adminSingle = userFor(fixture.admin, [UserRole.ADMIN], false);
    const adminMfa = userFor(fixture.admin, [UserRole.ADMIN], true);
    expect(await canAccessTeacherVerification(client, adminSingle, fixture.verificationCaseId)).toBe(
      false,
    );
    expect(await canAccessTeacherVerification(client, adminMfa, fixture.verificationCaseId)).toBe(
      true,
    );

    const learnerMfa = userFor(fixture.learner, [UserRole.LEARNER], true);
    expect(
      await canAccessTeacherVerification(client, learnerMfa, fixture.verificationCaseId),
    ).toBe(false);
  });

  it("never invokes the storage provider for denied access", async () => {
    const fixture = await createFixture();
    const client = db();
    const provider = createSpyProvider();

    const strangerUser = userFor(fixture.stranger, [UserRole.LEARNER], true);
    await expect(
      readStoredObjectForUser(client, provider, strangerUser, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).not.toHaveBeenCalled();

    await expect(
      createTemporaryAccessForUser(
        client,
        provider,
        strangerUser,
        fixture.verificationObjectId,
        300,
      ),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.createTemporaryAccess).not.toHaveBeenCalled();

    const ownerSingle = userFor(fixture.teacher, [UserRole.TEACHER], false);
    await expect(
      readStoredObjectForUser(client, provider, ownerSingle, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).not.toHaveBeenCalled();

    const unprovisioned: TaalimUser = {
      clerkSubject: fixture.learner.clerkSubject,
      sessionId: "sess_x",
      secondFactorVerified: true,
      account: null,
    };
    await expect(
      readStoredObjectForUser(client, provider, unprovisioned, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).not.toHaveBeenCalled();

    const missingObjectId = `${fixture.verificationObjectId}_missing`;
    await expect(
      readStoredObjectForUser(client, provider, strangerUser, missingObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).not.toHaveBeenCalled();
  });

  it("streams bytes only after the relationship decision succeeds", async () => {
    const fixture = await createFixture();
    const client = db();
    const provider = createSpyProvider();

    const ownerSingle = userFor(fixture.teacher, [UserRole.TEACHER], false);
    await expect(
      readStoredObjectForUser(client, provider, ownerSingle, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);

    const ownerMfa = userFor(fixture.teacher, [UserRole.TEACHER], true);
    const allowed = await readStoredObjectForUser(
      client,
      provider,
      ownerMfa,
      fixture.verificationObjectId,
    );
    expect(allowed.mimeType).toBe("application/pdf");
    expect(provider.get).toHaveBeenCalledTimes(1);
    expect(provider.get).toHaveBeenCalledWith("so_0123456789abcdef0123456789abcd00");

    const reader = allowed.stream.getReader();
    const chunk = await reader.read();
    expect(new TextDecoder().decode(chunk.value)).toBe("synthetic-secret-bytes");

    await client.storedObject.update({
      where: { id: fixture.verificationObjectId },
      data: { status: "DELETED" },
    });
    await expect(
      readStoredObjectForUser(client, provider, ownerMfa, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).toHaveBeenCalledTimes(1);

    const creator = userFor(fixture.learner, [UserRole.LEARNER], false);
    const ownRead = await readStoredObjectForUser(
      client,
      provider,
      creator,
      fixture.learnerOwnedObjectId,
    );
    expect(ownRead.mimeType).toBe("application/pdf");
    expect(provider.get).toHaveBeenCalledTimes(2);
    expect(provider.get).toHaveBeenLastCalledWith("so_0123456789abcdef0123456789abcd11");
  });

  it("denies verification-document creator access without a second factor", async () => {
    const fixture = await createFixture();
    const client = db();
    const provider = createSpyProvider();

    // The teacher is also createdByUserId; the generic creator path must not
    // bypass the verification-document 2FA policy.
    const creatorSingle = userFor(fixture.teacher, [UserRole.TEACHER], false);
    await expect(
      readStoredObjectForUser(client, provider, creatorSingle, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).not.toHaveBeenCalled();

    await expect(
      createTemporaryAccessForUser(
        client,
        provider,
        creatorSingle,
        fixture.verificationObjectId,
        300,
      ),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.createTemporaryAccess).not.toHaveBeenCalled();

    // A single-factor administrator is also denied on feature-governed objects.
    const adminSingle = userFor(fixture.admin, [UserRole.ADMIN], false);
    await expect(
      readStoredObjectForUser(client, provider, adminSingle, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).not.toHaveBeenCalled();
  });

  it("denies teacher-privileged access after the TEACHER role is removed", async () => {
    const fixture = await createFixture();
    const client = db();
    const provider = createSpyProvider();

    await client.roleAssignment.deleteMany({
      where: { userId: fixture.teacher.id, role: UserRole.TEACHER },
    });
    const formerTeacher: TaalimUser = {
      clerkSubject: fixture.teacher.clerkSubject,
      sessionId: "sess_former",
      secondFactorVerified: true,
      account: { id: fixture.teacher.id, clerkSubject: fixture.teacher.clerkSubject, roles: [] },
    };

    expect(await canAccessClassResource(client, formerTeacher, fixture.classId)).toBe(false);
    expect(
      await canAccessTeacherVerification(client, formerTeacher, fixture.verificationCaseId),
    ).toBe(false);
    await expect(
      readStoredObjectForUser(client, provider, formerTeacher, fixture.verificationObjectId),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.get).not.toHaveBeenCalled();
    await expect(
      createTemporaryAccessForUser(client, provider, formerTeacher, fixture.verificationObjectId, 300),
    ).rejects.toBeInstanceOf(StorageAccessDeniedError);
    expect(provider.createTemporaryAccess).not.toHaveBeenCalled();
  });

  it("requires a second factor for administrator learner management", async () => {
    const fixture = await createFixture();
    const client = db();

    const adminSingle = userFor(fixture.admin, [UserRole.ADMIN], false);
    const adminMfa = userFor(fixture.admin, [UserRole.ADMIN], true);
    expect(await canManageLearner(client, adminSingle, fixture.learner.id)).toBe(false);
    expect(await canManageLearner(client, adminMfa, fixture.learner.id)).toBe(true);
    // Self-management needs neither a role nor a second factor.
    expect(await canManageLearner(client, adminSingle, fixture.admin.id)).toBe(true);
  });

  it("grants learner management only to guardian-capable ACTIVE relationships", async () => {
    const fixture = await createFixture();
    const client = db();
    const payerUser = userFor(fixture.payer, [UserRole.PAYER]);

    const payerOnly = await client.guardianLearnerRelationship.create({
      data: {
        guardianPayerUserId: fixture.payer.id,
        learnerUserId: fixture.learner.id,
        relationshipType: "PAYER",
        status: "ACTIVE",
      },
    });
    expect(await canManageLearner(client, payerUser, fixture.learner.id)).toBe(false);

    await client.guardianLearnerRelationship.update({
      where: { id: payerOnly.id },
      data: { relationshipType: "GUARDIAN" },
    });
    expect(await canManageLearner(client, payerUser, fixture.learner.id)).toBe(true);

    await client.guardianLearnerRelationship.update({
      where: { id: payerOnly.id },
      data: { relationshipType: "GUARDIAN_AND_PAYER" },
    });
    expect(await canManageLearner(client, payerUser, fixture.learner.id)).toBe(true);
  });

  it("does not let a stale accept overwrite a concurrent revoke", async () => {
    const fixture = await createFixture();
    const client = db();
    const payerUser = userFor(fixture.payer, [UserRole.PAYER]);
    const learnerUser = userFor(fixture.learner, [UserRole.LEARNER]);

    const invite = await createRelationshipInvite(client, payerUser, {
      learnerAccountId: fixture.learner.id,
      relationshipType: "GUARDIAN_AND_PAYER",
    });

    // Simulate the exact race: the accept has loaded the PENDING row, the
    // revoke then lands in the real database, and only afterwards does the
    // accept's conditional write execute. The accept must not resurrect the
    // relationship.
    const relationshipDelegate = client.guardianLearnerRelationship;
    let revokeInFlight: Promise<unknown> | null = null;
    const racingDb = {
      guardianLearnerRelationship: {
        findUnique: (args: Parameters<typeof relationshipDelegate.findUnique>[0]) =>
          relationshipDelegate.findUnique(args),
        findFirst: (args: Parameters<typeof relationshipDelegate.findFirst>[0]) =>
          relationshipDelegate.findFirst(args),
        updateMany: async (args: Parameters<typeof relationshipDelegate.updateMany>[0]) => {
          if (!revokeInFlight) {
            revokeInFlight = revokeRelationship(client, payerUser, invite.id);
          }
          await revokeInFlight;
          return relationshipDelegate.updateMany(args);
        },
      },
      userAccount: client.userAccount,
      roleAssignment: client.roleAssignment,
    };

    const accepted = await acceptRelationshipInvite(
      racingDb as unknown as Parameters<typeof acceptRelationshipInvite>[0],
      learnerUser,
      invite.id,
    );
    expect(accepted.status).toBe("REVOKED");

    const row = await client.guardianLearnerRelationship.findUnique({
      where: { id: invite.id },
    });
    expect(row?.status).toBe("REVOKED");
    expect(await canManageLearner(client, payerUser, fixture.learner.id)).toBe(false);

    // The original (non-intercepted) accept path also refuses the revoked row.
    await expect(
      acceptRelationshipInvite(client, learnerUser, invite.id),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
    const after = await client.guardianLearnerRelationship.findUnique({
      where: { id: invite.id },
    });
    expect(after?.status).toBe("REVOKED");
  });
});
