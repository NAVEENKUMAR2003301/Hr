import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { withTransactionRetry } from "../lib/withTransactionRetry.js";
import { createOnboardingForEmployee } from "./onboarding.service.js";
import { ensureLeaveBalances } from "./leaveBalance.service.js";

export async function listEmployees({
  page = 1,
  pageSize = 20,
  search = "",
  departmentId,
  employmentStatus,
  includeTerminated = false,
  managerScopeId,
  idCardProvided,
}) {
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
      // MANAGER-role callers only get their own direct reports, not the full company
      // directory — set by the controller from the authenticated user, never client input.
      managerScopeId ? { managerId: managerScopeId } : {},
      idCardProvided === undefined ? {} : { idCardProvided },
    ],
  };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: true, designation: true, user: { select: { role: true } } },
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

// The candidate intake form collects one "Name" field rather than separate First/Last
// inputs — Employee still needs both, so split on the first space. A single-word name
// (rare, but possible) leaves lastName as "".
function splitName(fullName) {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1).trim() };
}

// Creates the User + Employee atomically, so a partially-created employee (e.g. a
// user with no employee row) can never exist. `createOnboarding` defaults to false —
// the full Add Employee form (this function's main caller) is for people who are
// already fully hired, not going through onboarding tracking; only the dedicated
// "New Candidate" intake (createCandidate, below) opts into it, so the Onboarding
// page's list only ever shows people HR is actually onboarding.
export async function createEmployee(data, { createOnboarding = false, onboarding } = {}) {
  const temporaryPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const employee = await withTransactionRetry(async (tx) => {
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

    if (createOnboarding) await createOnboardingForEmployee(tx, employee.id, onboarding);
    await ensureLeaveBalances(tx, employee.id, employee.joiningDate.getFullYear());

    return employee;
  });

  // NOTE: no email service yet — the temp password is surfaced to the admin in the API
  // response so it can be handed to the new hire out-of-band, instead of being silently lost.
  return { employee, temporaryPassword };
}

// Onboarding's "New Candidate" intake — only name/email plus recruitment-pipeline
// fields are asked; everything else createEmployee needs gets a sensible default so
// HR isn't forced through the full employee wizard just to start a candidate's
// onboarding paperwork. Unlike the full form, this always creates the onboarding
// process — that's the whole point of this entry point.
export async function createCandidate(data) {
  const employeeCode = await suggestNextEmployeeCode();
  const { firstName, lastName } = splitName(data.name);
  return createEmployee(
    {
      firstName,
      lastName,
      personalEmail: data.email,
      phoneNumber: data.phoneNumber,
      employeeCode,
      email: data.email,
      role: "EMPLOYEE",
      employmentType: "FULL_TIME",
    },
    {
      createOnboarding: true,
      onboarding: {
        forReference: data.forReference,
        designation: data.designation,
        experienceLevel: data.experienceLevel,
        relevantExperience: data.relevantExperience,
        trainingKt: data.trainingKt,
        technicalRound: data.technicalRound,
        hrRound: data.hrRound,
        currentCtc: data.currentCtc,
        expectedCtc: data.expectedCtc,
        trainingStipend: data.trainingStipend,
        selectionMailSent: data.selectionMailSent,
        docUpdates: data.docUpdates,
        offerGiven: data.offerGiven,
        appointmentLetterGiven: data.appointmentLetterGiven,
        onboardingStatus: data.onboardingStatus,
        trainingStatus: data.trainingStatus,
        liveProject: data.liveProject,
        onboardingDate: data.onboardingDate,
      },
    }
  );
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

  return withTransactionRetry(async (tx) => {
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
