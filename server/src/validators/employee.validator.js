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

// Onboarding's "New Candidate" intake — tracks the full recruitment pipeline (HR's
// own reference note, designation, experience, interview rounds, CTC, offer/
// appointment letter, onboarding status) rather than full employee details.
// Employee code, role, and employment type all get sensible defaults server-side
// (see employee.service.js createCandidate).
const pipelineFieldsSchema = z.object({
  forReference: z.string().optional(),
  designation: z.string().optional(),
  experienceLevel: z.string().optional(),
  relevantExperience: z.string().optional(),
  trainingKt: z.string().optional(),
  technicalRound: z.string().optional(),
  hrRound: z.string().optional(),
  currentCtc: z.string().optional(),
  expectedCtc: z.string().optional(),
  trainingStipend: z.string().optional(),
  selectionMailSent: z.boolean().default(false),
  docUpdates: z.string().optional(),
  offerGiven: z.boolean().default(false),
  appointmentLetterGiven: z.boolean().default(false),
  onboardingStatus: z.enum(["IN_PROGRESS", "COMPLETED"]).optional(),
  trainingStatus: z.string().optional(),
  liveProject: z.string().optional(),
  onboardingDate: optionalDate,
});

export const candidateIntakeSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().optional(),
  })
  .extend(pipelineFieldsSchema.shape);

// Same pipeline fields, editable later from the Candidate Details modal — every
// field optional since this is a partial update, not a fresh intake.
export const updatePipelineSchema = pipelineFieldsSchema.partial();
