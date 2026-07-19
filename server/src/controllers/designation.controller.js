import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const designationSchema = z.object({
  title: z.string().min(1),
  departmentId: z.string().uuid(),
});

export async function index(req, res, next) {
  try {
    const { departmentId } = req.query;
    const designations = await prisma.designation.findMany({
      where: departmentId ? { departmentId } : undefined,
      orderBy: { title: "asc" },
    });
    res.json(designations);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = designationSchema.parse(req.body);
    const designation = await prisma.designation.create({ data });
    res.status(201).json(designation);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = designationSchema.pick({ title: true }).parse(req.body);
    const designation = await prisma.designation.update({ where: { id: req.params.id }, data });
    res.json(designation);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const inUse = await prisma.employee.count({ where: { designationId: req.params.id } });
    if (inUse > 0) {
      return res.status(409).json({ error: "Cannot delete a designation assigned to employees" });
    }
    await prisma.designation.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
