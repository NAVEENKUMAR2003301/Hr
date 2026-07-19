import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ensureLeaveBalances } from "../services/leaveBalance.service.js";

const listQuerySchema = z.object({
  employeeId: z.string().uuid(),
  year: z.coerce.number().int().optional(),
});

const updateSchema = z.object({
  totalDays: z.number().int().min(0),
});

// Returns one balance row per active LeavePolicy for the employee/year, creating
// any missing rows on the fly (seeded from the policy's default) so admins always
// see a complete picture instead of "no balance yet" gaps.
export async function index(req, res, next) {
  try {
    const { employeeId, year } = listQuerySchema.parse(req.query);
    const targetYear = year ?? new Date().getFullYear();

    await ensureLeaveBalances(prisma, employeeId, targetYear);

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: targetYear },
      include: { leavePolicy: true },
      orderBy: { leavePolicy: { leaveType: "asc" } },
    });
    res.json(balances);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const balance = await prisma.leaveBalance.findUnique({ where: { id: req.params.id } });
    if (!balance) return res.status(404).json({ error: "Leave balance not found" });

    if (data.totalDays < balance.usedDays + balance.pendingDays) {
      return res.status(400).json({
        error: `Cannot set total below days already used or pending (${balance.usedDays + balance.pendingDays})`,
      });
    }

    const updated = await prisma.leaveBalance.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
