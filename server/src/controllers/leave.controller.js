import { prisma } from "../lib/prisma.js";
import { createLeaveRequestSchema, decisionSchema } from "../validators/leave.validator.js";
import { createLeaveRequest, decideLeaveRequest } from "../services/leave.service.js";

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
    res.json(request);
  } catch (err) {
    next(err);
  }
}
