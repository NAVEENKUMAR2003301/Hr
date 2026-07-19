import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const schema = z.object({ name: z.string().min(1) });

export async function index(req, res, next) {
  try {
    res.json(await prisma.feedbackCategory.findMany({ orderBy: { name: "asc" } }));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = schema.parse(req.body);
    const category = await prisma.feedbackCategory.create({ data });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A category with this name already exists" });
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = schema.parse(req.body);
    const category = await prisma.feedbackCategory.update({ where: { id: req.params.id }, data });
    res.json(category);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A category with this name already exists" });
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const inUse = await prisma.reviewRating.count({ where: { categoryId: req.params.id } });
    if (inUse > 0) {
      return res.status(409).json({ error: "Cannot delete a category already used in review ratings" });
    }
    await prisma.feedbackCategory.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
