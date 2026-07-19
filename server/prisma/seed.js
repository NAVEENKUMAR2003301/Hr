import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@stackly.dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

// Casual and Sick accrue 2 paid days/month (24/year cap) instead of a flat annual
// total — see server/src/services/leaveBalance.service.js for how that's applied.
const LEAVE_POLICIES = [
  { leaveType: "ANNUAL", maxDaysPerYear: 20, isPaid: true, accrualPerMonth: null },
  { leaveType: "SICK", maxDaysPerYear: 24, isPaid: true, accrualPerMonth: 2 },
  { leaveType: "CASUAL", maxDaysPerYear: 24, isPaid: true, accrualPerMonth: 2 },
  { leaveType: "MATERNITY", maxDaysPerYear: 180, isPaid: true, accrualPerMonth: null },
  { leaveType: "PATERNITY", maxDaysPerYear: 15, isPaid: true, accrualPerMonth: null },
];

const ONBOARDING_TEMPLATES = [
  { taskName: "Submit government ID proof", category: "DOCUMENT", assignedRole: "ADMIN", isMandatory: true },
  { taskName: "Submit education certificates", category: "DOCUMENT", assignedRole: "ADMIN", isMandatory: true },
  { taskName: "Sign offer letter & NDA", category: "DOCUMENT", assignedRole: "ADMIN", isMandatory: true },
  { taskName: "Provision laptop & accessories", category: "IT_SETUP", assignedRole: "ADMIN", isMandatory: true },
  { taskName: "Create email & SSO account", category: "IT_SETUP", assignedRole: "ADMIN", isMandatory: true },
  { taskName: "Grant repo/system access", category: "IT_SETUP", assignedRole: "ADMIN", isMandatory: true },
  { taskName: "Complete company orientation", category: "TRAINING", assignedRole: "ADMIN", isMandatory: true },
  { taskName: "Complete compliance & security training", category: "TRAINING", assignedRole: "ADMIN", isMandatory: true },
];

const FEEDBACK_CATEGORIES = ["Technical Skills", "Communication", "Ownership & Reliability", "Collaboration", "Growth Mindset"];

// 2026 official holiday list, as provided by HR.
const HOLIDAYS_2026 = [
  ["2026-01-01", "New Year's Day"],
  ["2026-01-15", "Pongal/Sankranti"],
  ["2026-01-26", "Republic Day"],
  ["2026-03-19", "Telugu New Year's Day"],
  ["2026-03-21", "Ramzan (Id-ul-Fitr)"],
  ["2026-03-31", "Mahaveer Jayanthi"],
  ["2026-04-03", "Good Friday"],
  ["2026-05-01", "May Day"],
  ["2026-05-28", "Bakrid (Id-ul-Azha)"],
  ["2026-06-26", "Muharram"],
  ["2026-08-15", "Independence Day"],
  ["2026-08-26", "Milad-un-Nabi"],
  ["2026-09-04", "Krishna Jayanthi"],
  ["2026-09-14", "Vinayakar Chaturthi"],
  ["2026-10-02", "Gandhi Jayanthi"],
  ["2026-10-19", "Ayudha Pooja"],
  ["2026-10-20", "Vijaya Dasami"],
  ["2026-11-08", "Deepavali (Diwali)"],
  ["2026-12-25", "Christmas Day"],
];

async function main() {
  for (const policy of LEAVE_POLICIES) {
    await prisma.leavePolicy.upsert({
      where: { leaveType: policy.leaveType },
      update: { maxDaysPerYear: policy.maxDaysPerYear, isPaid: policy.isPaid, accrualPerMonth: policy.accrualPerMonth },
      create: policy,
    });
  }

  for (const template of ONBOARDING_TEMPLATES) {
    await prisma.onboardingTaskTemplate.upsert({
      where: { taskName: template.taskName },
      update: {},
      create: template,
    });
  }

  for (const name of FEEDBACK_CATEGORIES) {
    await prisma.feedbackCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const [date, name] of HOLIDAYS_2026) {
    await prisma.holiday.upsert({
      where: { date: new Date(date) },
      update: { name },
      create: { date: new Date(date), name },
    });
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, passwordHash, role: "ADMIN" },
  });

  console.log("Seed complete:", {
    leavePolicies: LEAVE_POLICIES.length,
    onboardingTemplates: ONBOARDING_TEMPLATES.length,
    feedbackCategories: FEEDBACK_CATEGORIES.length,
    holidays: HOLIDAYS_2026.length,
    adminUser: ADMIN_EMAIL,
  });
  console.log(`\nAdmin login -> email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
  console.log("Change ADMIN_PASSWORD (env var) before seeding a real environment.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
