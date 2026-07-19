import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { createOnboardingForEmployee } from "./onboarding.service.js";
import { ensureLeaveBalances } from "./leaveBalance.service.js";

export async function listEmployees({ page = 1, pageSize = 20, search = "", departmentId, employmentStatus, includeTerminated = false }) {
  const where = {
    AND: [
      search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { employeeCode: { contains: search, mode: "insensitive" } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {},
      departmentId ? { departmentId } : {},
      // Deactivated employees stay in the DB (for history) but are hidden from the
      // default directory view unless explicitly requested or filtered for.
      employmentStatus ? { employmentStatus } : includeTerminated ? {} : { employmentStatus: { not: "TERMINATED" } },
    ],
  };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: true, designation: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// HTML <select> defaults submit "" for an unselected optional relation; Prisma wants
// undefined on create (omit the field, column default applies) but null on update —
// undefined there means "leave the existing value alone," which would make clearing
// an already-set department/designation/manager/personalEmail impossible.
function orUndefined(value) {
  return value === "" ? undefined : value;
}

function orNull(value) {
  return value === "" ? null : value;
}

// Creates the User + Employee + auto-generated OnboardingProcess atomically,
// so a partially-created employee (e.g. no onboarding) can never exist.
export async function createEmployee(data) {
  const temporaryPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: data.email, passwordHash, role: data.role ?? "EMPLOYEE" },
    });

    const employee = await tx.employee.create({
      data: {
        userId: user.id,
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        personalEmail: orUndefined(data.personalEmail),
        phoneNumber: data.phoneNumber,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        departmentId: orUndefined(data.departmentId),
        designationId: orUndefined(data.designationId),
        managerId: orUndefined(data.managerId),
        employmentType: data.employmentType,
        joiningDate: data.joiningDate ?? new Date(),
      },
    });

    await createOnboardingForEmployee(tx, employee.id);
    await ensureLeaveBalances(tx, employee.id, employee.joiningDate.getFullYear());

    return employee;
  });

  // NOTE: no email service yet — the temp password is surfaced to the admin in the API
  // response so it can be handed to the new hire out-of-band, instead of being silently lost.
  return { employee, temporaryPassword };
}

export function sanitizeEmployeeUpdate(data) {
  return {
    ...data,
    personalEmail: "personalEmail" in data ? orNull(data.personalEmail) : undefined,
    departmentId: "departmentId" in data ? orNull(data.departmentId) : undefined,
    designationId: "designationId" in data ? orNull(data.designationId) : undefined,
    managerId: "managerId" in data ? orNull(data.managerId) : undefined,
  };
}

// `role` lives on User, not Employee, so a role change touches both tables — done as
// one transaction so a role update can never partially apply.
export async function updateEmployee(id, data) {
  const { role, ...employeeData } = sanitizeEmployeeUpdate(data);

  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.update({ where: { id }, data: employeeData });

    if (role) {
      await tx.user.update({ where: { id: employee.userId }, data: { role } });
    }

    return tx.employee.findUnique({
      where: { id },
      include: { department: true, designation: true, manager: true, user: { select: { email: true, role: true } } },
    });
  });
}

// "Delete" is a deactivation, not a row delete — an HR system needs the terminated
// employee's leave/onboarding/review history to stay intact for records. Also revokes
// their session (refreshToken null) and disables login (isActive false) immediately.
export async function deactivateEmployee(id) {
  const employee = await prisma.employee.update({
    where: { id },
    data: { employmentStatus: "TERMINATED" },
  });
  await prisma.user.update({
    where: { id: employee.userId },
    data: { isActive: false, refreshToken: null },
  });
  return employee;
}

// Suggests the next "EMP-0001"-style code so admins don't have to invent one by hand;
// still editable/overridable in the form.
export async function suggestNextEmployeeCode() {
  const employees = await prisma.employee.findMany({
    where: { employeeCode: { startsWith: "EMP-" } },
    select: { employeeCode: true },
  });

  const maxNumber = employees.reduce((max, e) => {
    const match = e.employeeCode.match(/^EMP-(\d+)$/);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `EMP-${String(maxNumber + 1).padStart(4, "0")}`;
}
