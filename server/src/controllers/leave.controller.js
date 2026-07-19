import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createLeaveRequestSchema, decisionSchema } from "../validators/leave.validator.js";
import { createLeaveRequest, decideLeaveRequest, cancelLeaveRequest, markLeave } from "../services/leave.service.js";
import { recordAudit } from "../services/auditLog.service.js";

async function employeeName(employeeId) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { firstName: true, lastName: true } });
  return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
}

// HR's one-click marking is deliberately limited to same-day, unplanned leave types
// — CASUAL and SICK are the ones people take without advance notice; ANNUAL/
// MATERNITY/PATERNITY still go through the normal apply-and-approve flow since
// those are planned well ahead and warrant the employee's own request record.
const markLeaveSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(["CASUAL", "SICK"]),
  date: z.coerce.date().optional(),
});

export async function myRequests(req, res, next) {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: req.user.employeeId },
      orderBy: { createdAt: "desc" },
      include: { leavePolicy: true },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

export async function apply(req, res, next) {
  try {
    const data = createLeaveRequestSchema.parse(req.body);
    const request = await createLeaveRequest(req.user.employeeId, data);
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

export async function listAll(req, res, next) {
  try {
    const { status, departmentId } = req.query;
    const requests = await prisma.leaveRequest.findMany({
      where: {
        status: status || undefined,
        employee: departmentId ? { departmentId } : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: { employee: true, leavePolicy: true },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

export async function managerDecision(req, res, next) {
  try {
    const { decision, comment } = decisionSchema.parse(req.body);
    const request = await decideLeaveRequest(
      req.params.id,
      { employeeId: req.user.employeeId, role: req.user.role },
      "MANAGER",
      decision,
      comment
    );
    await recordAudit({
      userId: req.user.id,
      action: "leave.managerDecision",
      entityType: "LeaveRequest",
      entityId: req.params.id,
      summary: `${decision === "APPROVE" ? "Approved" : "Rejected"} (manager stage) ${await employeeName(request.employeeId)}'s leave request`,
    });
    res.json(request);
  } catch (err) {
    next(err);
  }
}

export async function hrDecision(req, res, next) {
  try {
    const { decision, comment } = decisionSchema.parse(req.body);
    const request = await decideLeaveRequest(
      req.params.id,
      { employeeId: req.user.employeeId, role: req.user.role },
      "HR",
      decision,
      comment
    );
    await recordAudit({
      userId: req.user.id,
      action: "leave.hrDecision",
      entityType: "LeaveRequest",
      entityId: req.params.id,
      summary: `${decision === "APPROVE" ? "Approved" : "Rejected"} (HR stage) ${await employeeName(request.employeeId)}'s leave request`,
    });
    res.json(request);
  } catch (err) {
    next(err);
  }
}

export async function cancelRequest(req, res, next) {
  try {
    const request = await cancelLeaveRequest(req.params.id);
    await recordAudit({
      userId: req.user.id,
      action: "leave.cancel",
      entityType: "LeaveRequest",
      entityId: req.params.id,
      summary: `Revoked ${await employeeName(request.employeeId)}'s leave request`,
    });
    res.json(request);
  } catch (err) {
    next(err);
  }
}

export async function mark(req, res, next) {
  try {
    const { employeeId, leaveType, date } = markLeaveSchema.parse(req.body);
    const request = await markLeave(employeeId, leaveType, date ?? new Date(), req.user.employeeId);
    await recordAudit({
      userId: req.user.id,
      action: "leave.mark",
      entityType: "LeaveRequest",
      entityId: request.id,
      summary: `Marked ${await employeeName(employeeId)} for ${leaveType} leave today`,
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}
