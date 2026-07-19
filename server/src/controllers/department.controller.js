import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { recordAudit } from "../services/auditLog.service.js";

const departmentSchema = z.object({
  name: z.string().min(1),
  headEmployeeId: z.string().uuid().nullable().optional().or(z.literal("")),
  role: z.string().nullable().optional(),
});

function normalizeHead(data) {
  if (!("headEmployeeId" in data)) return data;
  return { ...data, headEmployeeId: data.headEmployeeId === "" ? null : data.headEmployeeId };
}

// The form no longer collects a code from HR — derive one from the name (e.g.
// "Engineering" -> "ENG") and disambiguate on collision, since `code` is still a
// required unique column other records (designations, leave policies) reference.
async function generateDepartmentCode(name) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (name.trim().includes(" ") ? word[0] : word.slice(0, 3)))
    .join("")
    .slice(0, 6) || "DEPT";

  let code = base;
  let suffix = 1;
  while (await prisma.department.findUnique({ where: { code } })) {
    suffix += 1;
    code = `${base}${suffix}`;
  }
  return code;
}

export async function index(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: { include: { user: { select: { role: true } }, designation: true } },
        _count: { select: { employees: true } },
      },
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
      include: {
        head: { include: { user: { select: { role: true } }, designation: true } },
        designations: true,
        _count: { select: { employees: true } },
      },
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
    const code = await generateDepartmentCode(data.name);
    const department = await prisma.department.create({ data: { ...data, code } });
    await recordAudit({
      userId: req.user.id,
      action: "department.create",
      entityType: "Department",
      entityId: department.id,
      summary: `Created department "${department.name}" (${department.code})`,
    });
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
    await recordAudit({
      userId: req.user.id,
      action: "department.update",
      entityType: "Department",
      entityId: department.id,
      summary: `Updated department "${department.name}" (fields: ${Object.keys(data).join(", ")})`,
    });
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
    const department = await prisma.department.delete({ where: { id: req.params.id } });
    await recordAudit({
      userId: req.user.id,
      action: "department.delete",
      entityType: "Department",
      entityId: department.id,
      summary: `Deleted department "${department.name}" (${department.code})`,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
