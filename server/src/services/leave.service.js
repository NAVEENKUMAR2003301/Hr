import dayjs from "dayjs";
import { withTransactionRetry } from "../lib/withTransactionRetry.js";

function countDays(startDate, endDate) {
  return dayjs(endDate).diff(dayjs(startDate), "day") + 1;
}

// Locks the year's balance row inside a transaction so two concurrent requests
// can't both pass the "enough balance" check and overdraw the same balance.
export async function createLeaveRequest(employeeId, { leaveType, startDate, endDate, reason }) {
  return withTransactionRetry(async (tx) => {
    const policy = await tx.leavePolicy.findUnique({ where: { leaveType } });
    if (!policy) throw Object.assign(new Error("Unknown leave type"), { status: 400 });

    const year = dayjs(startDate).year();
    // FOR UPDATE actually takes the row lock the comment above promises — a plain
    // findUnique here runs under read-committed isolation and doesn't block a second
    // concurrent transaction from reading the same pre-update balance.
    const [balance] = await tx.$queryRaw`
      SELECT * FROM "LeaveBalance"
      WHERE "employeeId" = ${employeeId} AND "leavePolicyId" = ${policy.id} AND "year" = ${year}
      FOR UPDATE
    `;

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

  return withTransactionRetry(async (tx) => {
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

// HR one-click "mark this employee as on leave today" — skips the employee-apply +
// manager/HR-approve flow entirely and records an already-APPROVED_BY_HR request
// for `date`, deducting straight from usedDays. Reuses the same row-lock + balance
// + overlap checks as createLeaveRequest so it can't overdraw or double-book either.
export async function markLeave(employeeId, leaveType, rawDate, approverEmployeeId) {
  // Truncate to the calendar day — `rawDate` carries whatever time-of-day HR
  // clicked the button (or `new Date()`'s current instant), and comparing that
  // millisecond-precision value against another request's start/end (also
  // millisecond-precision) would make two marks on the same calendar day look like
  // they don't overlap at all, defeating the overlap guard below.
  const date = dayjs(rawDate).startOf("day").toDate();

  return withTransactionRetry(async (tx) => {
    const policy = await tx.leavePolicy.findUnique({ where: { leaveType } });
    if (!policy) throw Object.assign(new Error("Unknown leave type"), { status: 400 });

    const year = dayjs(date).year();
    const [balance] = await tx.$queryRaw`
      SELECT * FROM "LeaveBalance"
      WHERE "employeeId" = ${employeeId} AND "leavePolicyId" = ${policy.id} AND "year" = ${year}
      FOR UPDATE
    `;

    const available = (balance?.totalDays ?? 0) - (balance?.usedDays ?? 0) - (balance?.pendingDays ?? 0);
    if (!balance || available < 1) {
      throw Object.assign(new Error("Insufficient leave balance"), { status: 400 });
    }

    const overlapping = await tx.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED_BY_MANAGER", "APPROVED_BY_HR"] },
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
    if (overlapping) {
      throw Object.assign(new Error("Already has a leave request covering that date"), { status: 400 });
    }

    const request = await tx.leaveRequest.create({
      data: {
        employeeId,
        leavePolicyId: policy.id,
        startDate: date,
        endDate: date,
        reason: "Marked directly by HR",
        status: "APPROVED_BY_HR",
        hrApprovalId: approverEmployeeId,
      },
    });

    await tx.leaveBalance.update({
      where: { id: balance.id },
      data: { usedDays: { increment: 1 } },
    });

    return request;
  });
}

// Admin-only "undo" for a request that's already PENDING/APPROVED_BY_MANAGER/
// APPROVED_BY_HR (e.g. the employee turned out not to need the leave after all, or
// HR approved by mistake) — reverses whichever balance bucket the days were sitting
// in (pendingDays pre-HR-approval, usedDays once HR had signed off) so the days
// become available again, then marks the request CANCELLED.
export async function cancelLeaveRequest(requestId) {
  return withTransactionRetry(async (tx) => {
    const request = await tx.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) throw Object.assign(new Error("Leave request not found"), { status: 404 });
    if (!["PENDING", "APPROVED_BY_MANAGER", "APPROVED_BY_HR"].includes(request.status)) {
      throw Object.assign(
        new Error(`Cannot revoke a request that's already ${request.status.toLowerCase().replaceAll("_", " ")}`),
        { status: 409 }
      );
    }

    const days = countDays(request.startDate, request.endDate);
    const year = dayjs(request.startDate).year();

    await tx.leaveBalance.updateMany({
      where: { employeeId: request.employeeId, leavePolicyId: request.leavePolicyId, year },
      data:
        request.status === "APPROVED_BY_HR"
          ? { usedDays: { decrement: days } }
          : { pendingDays: { decrement: days } },
    });

    return tx.leaveRequest.update({ where: { id: requestId }, data: { status: "CANCELLED" } });
  });
}
