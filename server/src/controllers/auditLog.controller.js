import { prisma } from "../lib/prisma.js";

export async function index(req, res, next) {
  try {
    const page = Math.max(1, req.query.page ? Number(req.query.page) : 1);
    // Clamped so an arbitrarily large ?pageSize= can't force an oversized query.
    const pageSize = Math.min(100, Math.max(1, req.query.pageSize ? Number(req.query.pageSize) : 50));

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, email: true, employee: { select: { firstName: true, lastName: true } } } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    next(err);
  }
}
