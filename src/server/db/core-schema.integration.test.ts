import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPrismaClient } from "./client";

const enabled = process.env.TAALIM_RUN_DB_TESTS === "1";

describe.skipIf(!enabled)("core business schema", () => {
  const prisma = enabled ? getPrismaClient() : null;

  async function cleanBusinessData() {
    if (!prisma) return;
    await prisma.entitlement.deleteMany();
    await prisma.payoutRecord.deleteMany();
    await prisma.refundRecord.deleteMany();
    await prisma.financialEvent.deleteMany();
    await prisma.paymentEvent.deleteMany();
    await prisma.paymentAttempt.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.classOffering.updateMany({ data: { currentPriceVersionId: null } });
    await prisma.classPriceVersion.deleteMany();
    await prisma.classSession.deleteMany();
    await prisma.classOffering.deleteMany();
    await prisma.verificationDocument.deleteMany();
    await prisma.storedObject.deleteMany();
    await prisma.teacherApprovalScope.deleteMany();
    await prisma.teacherVerificationCase.deleteMany();
    await prisma.teacherProfile.deleteMany();
    await prisma.subjectLevel.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.educationLevel.deleteMany();
    await prisma.curriculum.deleteMany();
    await prisma.guardianLearnerRelationship.deleteMany();
    await prisma.roleAssignment.deleteMany();
    await prisma.userAccount.deleteMany();
    await prisma.commissionVersion.deleteMany();
  }

  beforeEach(cleanBusinessData);

  afterAll(async () => {
    if (!prisma) return;
    await cleanBusinessData();
    await prisma.$disconnect();
  });

  async function createFixture() {
    if (!prisma) throw new Error("postgres tests are disabled");

    const payer = await prisma.userAccount.create({ data: { clerkSubject: "synthetic_payer" } });
    const learner = await prisma.userAccount.create({ data: { clerkSubject: "synthetic_learner" } });
    const teacherUser = await prisma.userAccount.create({ data: { clerkSubject: "synthetic_teacher" } });
    const teacher = await prisma.teacherProfile.create({ data: { userId: teacherUser.id } });
    const curriculum = await prisma.curriculum.create({
      data: { code: "SYN", name: "Synthetic Curriculum" },
    });
    const level = await prisma.educationLevel.create({
      data: { curriculumId: curriculum.id, code: "L1", name: "Synthetic Level" },
    });
    const subject = await prisma.subject.create({
      data: { code: "SUB", name: "Synthetic Subject" },
    });
    await prisma.subjectLevel.create({
      data: { subjectId: subject.id, educationLevelId: level.id },
    });
    const classOffering = await prisma.classOffering.create({
      data: {
        teacherProfileId: teacher.id,
        subjectId: subject.id,
        educationLevelId: level.id,
        capacity: 10,
      },
    });
    const price = await prisma.classPriceVersion.create({
      data: {
        classId: classOffering.id,
        amountMinor: 25000,
        currency: "MAD",
        effectiveFrom: new Date("2026-10-01T00:00:00.000Z"),
      },
    });
    await prisma.classOffering.update({
      where: { id: classOffering.id },
      data: { currentPriceVersionId: price.id },
    });

    return { payer, learner, classOffering, price };
  }

  async function createSubscription(
    fixture: Awaited<ReturnType<typeof createFixture>>,
    input?: { payerUserId?: string; learnerUserId?: string; state?: "PENDING" | "ACTIVE" | "ENDED" },
  ) {
    if (!prisma) throw new Error("postgres tests are disabled");
    return prisma.subscription.create({
      data: {
        payerUserId: input?.payerUserId ?? fixture.payer.id,
        learnerUserId: input?.learnerUserId ?? fixture.learner.id,
        classId: fixture.classOffering.id,
        priceVersionId: fixture.price.id,
        state: input?.state ?? "PENDING",
        agreedAmountMinor: 25000,
        currency: "MAD",
        originalBillingDay: 31,
      },
    });
  }

  it("allows one account to be both payer and learner", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    const subscription = await createSubscription(fixture, {
      payerUserId: fixture.learner.id,
      learnerUserId: fixture.learner.id,
      state: "ACTIVE",
    });
    expect(subscription.payerUserId).toBe(subscription.learnerUserId);
  });

  it("stores an explicit relationship when payer and learner are different users", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    const relationship = await prisma.guardianLearnerRelationship.create({
      data: {
        guardianPayerUserId: fixture.payer.id,
        learnerUserId: fixture.learner.id,
        relationshipType: "PAYER",
        status: "ACTIVE",
      },
    });
    expect(relationship.guardianPayerUserId).toBe(fixture.payer.id);
  });

  it("lets only one concurrent open subscription win for a learner and class", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    const attempts = await Promise.allSettled([
      createSubscription(fixture, { state: "ACTIVE" }),
      createSubscription(fixture, { state: "ACTIVE" }),
    ]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("allows a new subscription after the previous one is ended", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    await createSubscription(fixture, { state: "ENDED" });
    const next = await createSubscription(fixture, { state: "ACTIVE" });
    expect(next.state).toBe("ACTIVE");
  });

  it("deduplicates provider payment events under concurrency", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    const subscription = await createSubscription(fixture);
    const attempt = await prisma.paymentAttempt.create({
      data: {
        subscriptionId: subscription.id,
        provider: "fake",
        amountMinor: 25000,
        currency: "MAD",
        idempotencyKey: "synthetic-attempt-key",
      },
    });

    const results = await Promise.allSettled([
      prisma.paymentEvent.create({
        data: {
          paymentAttemptId: attempt.id,
          provider: "fake",
          providerEventId: "evt_synthetic_1",
          normalizedType: "payment.succeeded",
        },
      }),
      prisma.paymentEvent.create({
        data: {
          paymentAttemptId: attempt.id,
          provider: "fake",
          providerEventId: "evt_synthetic_1",
          normalizedType: "payment.succeeded",
        },
      }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("prevents the same trusted payment event from creating two entitlements", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    const subscription = await createSubscription(fixture, { state: "ACTIVE" });
    const enrollment = await prisma.enrollment.create({
      data: {
        subscriptionId: subscription.id,
        learnerUserId: fixture.learner.id,
        classId: fixture.classOffering.id,
        state: "ACTIVE",
      },
    });
    const paymentEvent = await prisma.paymentEvent.create({
      data: {
        provider: "fake",
        providerEventId: "evt_entitlement_once",
        normalizedType: "payment.succeeded",
      },
    });
    const startsAt = new Date("2026-10-08T00:00:00.000Z");
    const endsAt = new Date("2026-11-08T00:00:00.000Z");
    const results = await Promise.allSettled([
      prisma.entitlement.create({
        data: {
          enrollmentId: enrollment.id,
          sourcePaymentEventId: paymentEvent.id,
          startsAt,
          endsAt,
          state: "ACTIVE",
        },
      }),
      prisma.entitlement.create({
        data: {
          enrollmentId: enrollment.id,
          sourcePaymentEventId: paymentEvent.id,
          startsAt,
          endsAt,
          state: "ACTIVE",
        },
      }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("enforces provider-neutral stored-object identity", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    await prisma.storedObject.create({
      data: {
        provider: "local",
        storageKey: "so_0123456789abcdef0123456789abcdef",
        originalFilename: "synthetic.pdf",
        mimeType: "application/pdf",
        sizeBytes: BigInt(1234),
        createdByUserId: fixture.learner.id,
      },
    });
    await expect(
      prisma.storedObject.create({
        data: {
          provider: "local",
          storageKey: "so_0123456789abcdef0123456789abcdef",
          originalFilename: "other.pdf",
          mimeType: "application/pdf",
          sizeBytes: BigInt(99),
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects an unbalanced financial split", async () => {
    if (!prisma) return;
    const fixture = await createFixture();
    const subscription = await createSubscription(fixture);
    await expect(
      prisma.financialEvent.create({
        data: {
          subscriptionId: subscription.id,
          eventType: "TUITION_COLLECTED",
          sourceType: "synthetic",
          sourceId: "split-mismatch",
          grossMinor: 25000,
          platformCommissionMinor: 5000,
          teacherPayableMinor: 19999,
          currency: "MAD",
        },
      }),
    ).rejects.toThrow();

    const valid = await prisma.financialEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: "TUITION_COLLECTED",
        sourceType: "synthetic",
        sourceId: "split-balanced",
        grossMinor: 25000,
        platformCommissionMinor: 5000,
        teacherPayableMinor: 20000,
        currency: "MAD",
      },
    });
    expect(valid.grossMinor).toBe(25000);
  });
});
