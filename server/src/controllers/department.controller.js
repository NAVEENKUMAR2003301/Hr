import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  headEmployeeId: z.string().uuid().nullable().optional().or(z.literal("")),
});

function normalizeHead(data) {
  if (!("headEmployeeId" in data)) return data;
  return { ...data, headEmployeeId: data.headEmployeeId === "" ? null : data.headEmployeeId };
}

export async function index(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      include: { head: true, _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { head: true, designations: true, _count: { select: { employees: true } } },
    });
    if (!department) return res.status(404).json({ error: "Department not found" });
    res.json(department);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = normalizeHead(departmentSchema.parse(req.body));
    const department = await prisma.department.create({ data });
    res.status(201).json(department);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A department with this code already exists" });
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = normalizeHead(departmentSchema.partial().parse(req.body));
    const department = await prisma.department.update({ where: { id: req.params.id }, data });
    res.json(department);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "A department with this code already exists" });
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const [employeeCount, designationCount] = await Promise.all([
      prisma.employee.count({ where: { departmentId: req.params.id } }),
      prisma.designation.count({ where: { departmentId: req.params.id } }),
    ]);
    if (employeeCount > 0) {
      return res.status(409).json({ error: "Cannot delete a department with employees assigned" });
    }
    if (designationCount > 0) {
      return res.status(409).json({ error: "Cannot delete a department with designations — remove them first" });
    }
    await prisma.department.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
