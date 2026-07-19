import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  taskName: z.string().min(1),
  category: z.enum(["DOCUMENT", "IT_SETUP", "TRAINING"]),
  assignedRole: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("ADMIN"),
  isMandatory: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

export async function index(req, res, next) {
  try {
    res.json(await prisma.onboardingTaskTemplate.findMany({ orderBy: { taskName: "asc" } }));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const template = await prisma.onboardingTaskTemplate.create({ data });
    res.status(201).json(template);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A task template with this name already exists" });
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const template = await prisma.onboardingTaskTemplate.update({ where: { id: req.params.id }, data });
    res.json(template);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A task template with this name already exists" });
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const inUse = await prisma.onboardingTaskItem.count({ where: { templateId: req.params.id } });
    if (inUse > 0) {
      return res.status(409).json({ error: "Cannot delete a template already assigned to employees' checklists" });
    }
    await prisma.onboardingTaskTemplate.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
