import { z } from "zod";

// Mirrors server/src/validators/leave.validator.js so the form can validate
// before hitting the network.
export const leaveRequestSchema = z
  .object({
    leaveType: z.enum(["ANNUAL", "SICK", "CASUAL", "MATERNITY", "PATERNITY"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().min(1, "Reason is required"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  signupCode: z.string().min(1, "Sign-up code is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// Mirrors server/src/validators/employee.validator.js — split per wizard step
// so each step can be validated independently before advancing.
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  personalEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
});

export const employmentInfoSchema = z.object({
  employeeCode: z.string().min(1, "Employee code is required"),
  departmentId: z.string().optional().or(z.literal("")),
  designationId: z.string().optional().or(z.literal("")),
  managerId: z.string().optional().or(z.literal("")),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  joiningDate: z.string().optional(),
});

export const roleAccessSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
});

export const employeeFormSchema = personalInfoSchema.merge(employmentInfoSchema).merge(roleAccessSchema);
