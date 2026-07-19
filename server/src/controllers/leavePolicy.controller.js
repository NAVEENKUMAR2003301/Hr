import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  leaveType: z.enum(["ANNUAL", "SICK", "CASUAL", "MATERNITY", "PATERNITY"]),
  maxDaysPerYear: z.number().int().min(0),
  isPaid: z.boolean().default(true),
});

const updateSchema = z.object({
  maxDaysPerYear: z.number().int().min(0).optional(),
  isPaid: z.boolean().optional(),
});

export async function index(req, res, next) {
  try {
    res.json(await prisma.leavePolicy.findMany({ orderBy: { leaveType: "asc" } }));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const policy = await prisma.leavePolicy.create({ data });
    res.status(201).json(policy);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A policy for this leave type already exists" });
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const policy = await prisma.leavePolicy.update({ where: { id: req.params.id }, data });
    res.json(policy);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const inUse = await prisma.leaveRequest.count({ where: { leavePolicyId: req.params.id } });
    if (inUse > 0) {
      return res.status(409).json({ error: "Cannot delete a policy with existing leave requests" });
    }
    await prisma.leaveBalance.deleteMany({ where: { leavePolicyId: req.params.id } });
    await prisma.leavePolicy.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
