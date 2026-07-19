import dayjs from "dayjs";
import { prisma } from "../lib/prisma.js";

function countDays(startDate, endDate) {
  return dayjs(endDate).diff(dayjs(startDate), "day") + 1;
}

// Locks the year's balance row inside a transaction so two concurrent requests
// can't both pass the "enough balance" check and overdraw the same balance.
export async function createLeaveRequest(employeeId, { leaveType, startDate, endDate, reason }) {
  return prisma.$transaction(async (tx) => {
    const policy = await tx.leavePolicy.findUnique({ where: { leaveType } });
    if (!policy) throw Object.assign(new Error("Unknown leave type"), { status: 400 });

    const year = dayjs(startDate).year();
    const balance = await tx.leaveBalance.findUnique({
      where: { employeeId_leavePolicyId_year: { employeeId, leavePolicyId: policy.id, year } },
    });

    const days = countDays(startDate, endDate);
    const available = (balance?.totalDays ?? 0) - (balance?.usedDays ?? 0) - (balance?.pendingDays ?? 0);
    if (!balance || available < days) {
      throw Object.assign(new Error("Insufficient leave balance"), { status: 400 });
    }

    const overlapping = await tx.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED_BY_MANAGER", "APPROVED_BY_HR"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlapping) {
      throw Object.assign(new Error("Overlaps an existing leave request"), { status: 400 });
    }

    const request = await tx.leaveRequest.create({
      data: { employeeId, leavePolicyId: policy.id, startDate, endDate, reason, status: "PENDING" },
    });

    await tx.leaveBalance.update({
      where: { id: balance.id },
      data: { pendingDays: { increment: days } },
    });

    return request;
  });
}

const EXPECTED_STATUS_FOR_STAGE = { MANAGER: "PENDING", HR: "APPROVED_BY_MANAGER" };

// Manager approves/rejects; HR gives the final sign-off. Approval at either stage
// keeps pendingDays reserved; only HR approval converts pendingDays -> usedDays.
//
// Two guards matter here: (1) a request can only be decided from the status the
// stage expects — otherwise HR could approve a still-PENDING request (skipping the
// manager step) or a stale double-click could re-apply the balance mutation and
// drive pendingDays negative; (2) at the MANAGER stage, the approver must actually
// be that employee's manager — otherwise any MANAGER-role user could decide any
// employee's leave, not just their own reports. ADMIN bypasses the manager-identity
// check (HR/admin can act as a stand-in manager) but not the status guard.
export async function decideLeaveRequest(requestId, approver, stage, decision, comment) {
  const { employeeId: approverEmployeeId, role: approverRole } = approver;

  return prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: { select: { managerId: true } } },
    });
    if (!request) throw Object.assign(new Error("Leave request not found"), { status: 404 });

    if (request.status !== EXPECTED_STATUS_FOR_STAGE[stage]) {
      throw Object.assign(
        new Error(`This request is already ${request.status.toLowerCase().replaceAll("_", " ")}`),
        { status: 409 }
      );
    }

    if (stage === "MANAGER" && approverRole !== "ADMIN" && request.employee.managerId !== approverEmployeeId) {
      throw Object.assign(new Error("You can only decide leave requests for your own direct reports"), { status: 403 });
    }

    const days = countDays(request.startDate, request.endDate);
    const year = dayjs(request.startDate).year();

    if (decision === "REJECT") {
      await tx.leaveRequest.update({
        where: { id: requestId },
        data:
          stage === "MANAGER"
            ? { status: "REJECTED", managerApprovalId: approverEmployeeId, managerComment: comment }
            : { status: "REJECTED", hrApprovalId: approverEmployeeId, hrComment: comment },
      });
      await tx.leaveBalance.updateMany({
        where: { employeeId: request.employeeId, leavePolicyId: request.leavePolicyId, year },
        data: { pendingDays: { decrement: days } },
      });
      return;
    }

    if (stage === "MANAGER") {
      return tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED_BY_MANAGER", managerApprovalId: approverEmployeeId, managerComment: comment },
      });
    }

    // HR final approval: move days from pending -> used.
    await tx.leaveBalance.updateMany({
      where: { employeeId: request.employeeId, leavePolicyId: request.leavePolicyId, year },
      data: { pendingDays: { decrement: days }, usedDays: { increment: days } },
    });

    return tx.leaveRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED_BY_HR", hrApprovalId: approverEmployeeId, hrComment: comment },
    });
  });
}
