import { z } from "zod";

export const createLeaveRequestSchema = z
  .object({
    leaveType: z.enum(["ANNUAL", "SICK", "CASUAL", "MATERNITY", "PATERNITY"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().min(1),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

export const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().optional(),
});
