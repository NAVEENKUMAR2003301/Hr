import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createEmployeeSchema, updateEmployeeSchema, candidateIntakeSchema } from "../validators/employee.validator.js";
import {
  listEmployees,
  createEmployee,
  createCandidate,
  updateEmployee,
  deactivateEmployee,
  suggestNextEmployeeCode,
} from "../services/employee.service.js";
import { recordAudit } from "../services/auditLog.service.js";

export async function index(req, res, next) {
  try {
    const { page, pageSize, search, departmentId, employmentStatus, includeTerminated, idCardProvided } = req.query;
    const result = await listEmployees({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      departmentId,
      employmentStatus,
      includeTerminated: includeTerminated === "true",
      // Managers only ever see their own direct reports here — derived from the
      // authenticated session, never from a client-supplied query param.
      managerScopeId: req.user.role === "MANAGER" ? req.user.employeeId : undefined,
      idCardProvided: idCardProvided === undefined ? undefined : idCardProvided === "true",
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
    await recordAudit({
      userId: req.user.id,
      action: "employee.create",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Created employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
    });
    res.status(201).json({ employee, temporaryPassword });
  } catch (err) {
    if (err.code === "P2002") {
      const field = err.meta?.target?.includes("email") ? "email" : "employee code";
      return res.status(409).json({ error: `That ${field} is already in use` });
    }
    next(err);
  }
}

export async function createCandidateIntake(req, res, next) {
  try {
    const data = candidateIntakeSchema.parse(req.body);
    const { employee, temporaryPassword } = await createCandidate(data);
    await recordAudit({
      userId: req.user.id,
      action: "employee.createCandidate",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Added candidate ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) for onboarding`,
    });
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
    await recordAudit({
      userId: req.user.id,
      action: "employee.update",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Updated employee ${employee.firstName} ${employee.lastName} (fields: ${Object.keys(data).join(", ")})`,
    });
    res.json(employee);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "That employee code is already in use" });
    next(err);
  }
}

// A dedicated endpoint rather than routing this through the general update —
// marking an ID card provided/not-provided is a single boolean HR toggles from a
// list of 3000+ rows and shouldn't need to satisfy the full employee-update schema.
export async function setIdCardStatus(req, res, next) {
  try {
    const { provided } = z.object({ provided: z.boolean() }).parse(req.body);
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: { idCardProvided: provided },
    });
    await recordAudit({
      userId: req.user.id,
      action: "employee.idCard",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Marked ${employee.firstName} ${employee.lastName}'s ID card as ${provided ? "provided" : "not provided"}`,
    });
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req, res, next) {
  try {
    const employee = await deactivateEmployee(req.params.id);
    await recordAudit({
      userId: req.user.id,
      action: "employee.deactivate",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Deactivated employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
    });
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
