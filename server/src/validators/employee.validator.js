import { z } from "zod";

// An HTML <input type="date"> submits "" when cleared/empty — z.coerce.date() would
// otherwise try to coerce that to `Invalid Date` and fail instead of treating it as
// "not provided". Convert "" to undefined before coercion runs.
const optionalDate = z.preprocess((val) => (val === "" ? undefined : val), z.coerce.date().optional());

// Step 1: Personal Info
const personalInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: optionalDate,
  personalEmail: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
});

// Step 2: Employment Info
const employmentInfoSchema = z.object({
  employeeCode: z.string().min(1),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  designationId: z.string().uuid().optional().or(z.literal("")),
  managerId: z.string().uuid().optional().or(z.literal("")),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).default("FULL_TIME"),
  joiningDate: optionalDate,
});

// Step 3: Role / Access
const roleAccessSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
});

export const createEmployeeSchema = personalInfoSchema.extend(employmentInfoSchema.shape).extend(roleAccessSchema.shape);

export const updateEmployeeSchema = personalInfoSchema
  .extend(employmentInfoSchema.shape)
  .extend({ role: roleAccessSchema.shape.role })
  .partial();

// Lightweight onboarding intake — just the basics a candidate form collects
// (name/phone/email/address). Employee code, role, employment type, and joining
// date are all filled in with sensible defaults server-side (see
// employee.service.js candidateIntakeDefaults) rather than asked on this form.
export const candidateIntakeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  email: z.string().email(),
  address: z.string().optional(),
});
