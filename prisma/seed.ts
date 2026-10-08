import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for synthetic seed data");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const teacherUser = await prisma.userAccount.upsert({
    where: { clerkSubject: "seed_teacher_synthetic" },
    update: {},
    create: { id: "seed_user_teacher", clerkSubject: "seed_teacher_synthetic" },
  });
  const learnerUser = await prisma.userAccount.upsert({
    where: { clerkSubject: "seed_learner_synthetic" },
    update: {},
    create: { id: "seed_user_learner", clerkSubject: "seed_learner_synthetic" },
  });

  await prisma.roleAssignment.upsert({
    where: { userId_role: { userId: teacherUser.id, role: UserRole.TEACHER } },
    update: {},
    create: { id: "seed_role_teacher", userId: teacherUser.id, role: UserRole.TEACHER },
  });
  await prisma.roleAssignment.upsert({
    where: { userId_role: { userId: learnerUser.id, role: UserRole.LEARNER } },
    update: {},
    create: { id: "seed_role_learner", userId: learnerUser.id, role: UserRole.LEARNER },
  });
  await prisma.roleAssignment.upsert({
    where: { userId_role: { userId: learnerUser.id, role: UserRole.PAYER } },
    update: {},
    create: { id: "seed_role_payer", userId: learnerUser.id, role: UserRole.PAYER },
  });

  const teacher = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { id: "seed_teacher_profile", userId: teacherUser.id },
  });

  const curriculum = await prisma.curriculum.upsert({
    where: { code: "SYNTHETIC" },
    update: {},
    create: { id: "seed_curriculum", code: "SYNTHETIC", name: "Synthetic Curriculum" },
  });
  const level = await prisma.educationLevel.upsert({
    where: { curriculumId_code: { curriculumId: curriculum.id, code: "LEVEL_1" } },
    update: {},
    create: { id: "seed_level", curriculumId: curriculum.id, code: "LEVEL_1", name: "Synthetic Level" },
  });
  const subject = await prisma.subject.upsert({
    where: { code: "SYNTHETIC_SUBJECT" },
    update: {},
    create: { id: "seed_subject", code: "SYNTHETIC_SUBJECT", name: "Synthetic Subject" },
  });

  await prisma.subjectLevel.upsert({
    where: { subjectId_educationLevelId: { subjectId: subject.id, educationLevelId: level.id } },
    update: {},
    create: { id: "seed_subject_level", subjectId: subject.id, educationLevelId: level.id },
  });

  const classOffering = await prisma.classOffering.upsert({
    where: { id: "seed_class" },
    update: {},
    create: {
      id: "seed_class",
      teacherProfileId: teacher.id,
      subjectId: subject.id,
      educationLevelId: level.id,
      capacity: 20,
    },
  });

  const price = await prisma.classPriceVersion.upsert({
    where: { id: "seed_price_v1" },
    update: {},
    create: {
      id: "seed_price_v1",
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

  console.log("Synthetic seed data ready");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
