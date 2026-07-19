import { prisma } from "../lib/prisma.js";

// Auto-generates an OnboardingProcess + one OnboardingTaskItem per active template
// so no mandatory step is ever missed for a new hire.
export async function createOnboardingForEmployee(tx, employeeId) {
  const templates = await tx.onboardingTaskTemplate.findMany();

  const process = await tx.onboardingProcess.create({
    data: { employeeId, status: "IN_PROGRESS" },
  });

  if (templates.length > 0) {
    await tx.onboardingTaskItem.createMany({
      data: templates.map((t) => ({ processId: process.id, templateId: t.id, status: "PENDING" })),
    });
  }

  return process;
}
