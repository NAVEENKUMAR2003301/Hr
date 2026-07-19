import { prisma } from "../lib/prisma.js";

// Setting a cycle ACTIVE creates one Review per active employee, reviewer = their manager,
// plus a blank ReviewRating row per active FeedbackCategory so the self/manager rating UI
// has something to render immediately instead of an empty list until a first submission.
// Employees with no manager (e.g. the CEO) are skipped — nothing to review against.
export async function activateReviewCycle(cycleId) {
  return prisma.$transaction(async (tx) => {
    const cycle = await tx.reviewCycle.update({ where: { id: cycleId }, data: { status: "ACTIVE" } });

    const employees = await tx.employee.findMany({
      where: { employmentStatus: "ACTIVE", managerId: { not: null } },
      select: { id: true, managerId: true },
    });

    if (employees.length > 0) {
      await tx.review.createMany({
        data: employees.map((e) => ({
          cycleId,
          employeeId: e.id,
          reviewerId: e.managerId,
          status: "SELF_APPRAISAL_PENDING",
        })),
      });

      const categories = await tx.feedbackCategory.findMany({ select: { id: true } });
      if (categories.length > 0) {
        const createdReviews = await tx.review.findMany({ where: { cycleId }, select: { id: true } });
        await tx.reviewRating.createMany({
          data: createdReviews.flatMap((r) => categories.map((c) => ({ reviewId: r.id, categoryId: c.id }))),
        });
      }
    }

    return cycle;
  });
}

export async function closeReviewCycle(cycleId) {
  return prisma.reviewCycle.update({ where: { id: cycleId }, data: { status: "CLOSED" } });
}
