import { prisma } from "../lib/prisma.js";
import { createEmployeeSchema, updateEmployeeSchema } from "../validators/employee.validator.js";
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  suggestNextEmployeeCode,
} from "../services/employee.service.js";

export async function index(req, res, next) {
  try {
    const { page, pageSize, search, departmentId, employmentStatus, includeTerminated } = req.query;
    const result = await listEmployees({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      departmentId,
      employmentStatus,
      includeTerminated: includeTerminated === "true",
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function show(req, res, next) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        designation: true,
        manager: true,
        user: { select: { email: true, role: true } },
        leaveRequests: {
          include: { leavePolicy: true },
          orderBy: { createdAt: "desc" },
        },
        onboardingProcess: {
          include: { taskItems: { include: { template: true } } },
        },
        reviewsAsEmployee: {
          include: { cycle: true, ratings: { include: { category: true } } },
          orderBy: { id: "desc" },
        },
      },
    });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createEmployeeSchema.parse(req.body);
    const { employee, temporaryPassword } = await createEmployee(data);
    res.status(201).json({ employee, temporaryPassword });
  } catch (err) {
    if (err.code === "P2002") {
      const field = err.meta?.target?.includes("email") ? "email" : "employee code";
      return res.status(409).json({ error: `That ${field} is already in use` });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateEmployeeSchema.parse(req.body);
    const employee = await updateEmployee(req.params.id, data);
    res.json(employee);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "That employee code is already in use" });
    next(err);
  }
}

export async function deactivate(req, res, next) {
  try {
    await deactivateEmployee(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function nextEmployeeCode(req, res, next) {
  try {
    res.json({ employeeCode: await suggestNextEmployeeCode() });
  } catch (err) {
    next(err);
  }
}
