import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const holidaySchema = z.object({
  date: z.coerce.date(),
  name: z.string().min(1),
});

export async function index(req, res, next) {
  try {
    const { year } = req.query;
    const where = year
      ? { date: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } }
      : undefined;
    const holidays = await prisma.holiday.findMany({ where, orderBy: { date: "asc" } });
    res.json(holidays);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = holidaySchema.parse(req.body);
    const holiday = await prisma.holiday.create({ data });
    res.status(201).json(holiday);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A holiday is already set for this date" });
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
