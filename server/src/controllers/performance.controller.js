import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { activateReviewCycle, closeReviewCycle } from "../services/performance.service.js";

const cycleSchema = z.object({
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "PROBATION"]),
});

const ratingSchema = z.object({
  categoryId: z.string().uuid(),
  selfRating: z.number().int().min(1).max(5).optional(),
  managerRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export async function listCycles(req, res, next) {
  try {
    res.json(await prisma.reviewCycle.findMany({ orderBy: { startDate: "desc" } }));
  } catch (err) {
    next(err);
  }
}

export async function createCycle(req, res, next) {
  try {
    const data = cycleSchema.parse(req.body);
    res.status(201).json(await prisma.reviewCycle.create({ data }));
  } catch (err) {
    next(err);
  }
}

export async function updateCycle(req, res, next) {
  try {
    const cycle = await prisma.reviewCycle.findUnique({ where: { id: req.params.id } });
    if (!cycle) return res.status(404).json({ error: "Review cycle not found" });
    if (cycle.status !== "UPCOMING") {
      return res.status(409).json({ error: "Only an upcoming cycle can be edited" });
    }
    const data = cycleSchema.partial().parse(req.body);
    res.json(await prisma.reviewCycle.update({ where: { id: req.params.id }, data }));
  } catch (err) {
    next(err);
  }
}

export async function activateCycle(req, res, next) {
  try {
    res.json(await activateReviewCycle(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function closeCycle(req, res, next) {
  try {
    res.json(await closeReviewCycle(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function removeCycle(req, res, next) {
  try {
    const cycle = await prisma.reviewCycle.findUnique({ where: { id: req.params.id } });
    if (!cycle) return res.status(404).json({ error: "Review cycle not found" });
    if (cycle.status !== "UPCOMING") {
      return res.status(409).json({ error: "Only an upcoming cycle (with no reviews yet) can be deleted" });
    }
    await prisma.reviewCycle.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// Overlap in days between [aStart, aEnd] and [bStart, bEnd], or 0 if they don't overlap —
// used to prorate a leave request that only partially falls inside the review cycle.
function overlapDays(aStart, aEnd, bStart, bEnd) {
  const start = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const end = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
  if (start > end) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

export async function listAllReviews(req, res, next) {
  try {
    const { cycleId, departmentId } = req.query;
    const reviews = await prisma.review.findMany({
      where: {
        cycleId: cycleId || undefined,
        employee: departmentId ? { departmentId } : undefined,
      },
      include: {
        cycle: true,
        employee: true,
        reviewer: true,
        ratings: { include: { category: true } },
      },
      orderBy: { id: "desc" },
    });

    // Surfaced as context for HR/managers doing a leave-based efficiency check —
    // approved leave taken within each review's own cycle date range.
    const employeeIds = [...new Set(reviews.map((r) => r.employeeId))];
    const approvedLeaves = employeeIds.length
      ? await prisma.leaveRequest.findMany({
          where: { employeeId: { in: employeeIds }, status: "APPROVED_BY_HR" },
        })
      : [];

    const reviewsWithLeave = reviews.map((review) => {
      const leaveDaysInCycle = approvedLeaves
        .filter((l) => l.employeeId === review.employeeId)
        .reduce((sum, l) => sum + overlapDays(review.cycle.startDate, review.cycle.endDate, l.startDate, l.endDate), 0);
      return { ...review, leaveDaysInCycle };
    });

    res.json(reviewsWithLeave);
  } catch (err) {
    next(err);
  }
}

export async function myReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      where: { OR: [{ employeeId: req.user.employeeId }, { reviewerId: req.user.employeeId }] },
      include: { cycle: true, ratings: { include: { category: true } } },
      orderBy: { id: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function submitRating(req, res, next) {
  try {
    const { categoryId, selfRating, managerRating, comment } = ratingSchema.parse(req.body);
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

    const isSelf = review.employeeId === req.user.employeeId;
    const isReviewer = review.reviewerId === req.user.employeeId;
    if (!isSelf && !isReviewer) return res.status(403).json({ error: "Forbidden" });

    const rating = await prisma.reviewRating.upsert({
      where: { reviewId_categoryId: { reviewId: review.id, categoryId } },
      update: { selfRating: isSelf ? selfRating : undefined, managerRating: isReviewer ? managerRating : undefined, comment },
      create: { reviewId: review.id, categoryId, selfRating: isSelf ? selfRating : undefined, managerRating: isReviewer ? managerRating : undefined, comment },
    });

    if (isSelf) {
      await prisma.review.update({ where: { id: review.id }, data: { status: "MANAGER_REVIEW_PENDING" } });
    }

    res.json(rating);
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeReview(req, res, next) {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review || review.employeeId !== req.user.employeeId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(await prisma.review.update({ where: { id: review.id }, data: { status: "ACKNOWLEDGED" } }));
  } catch (err) {
    next(err);
  }
}
