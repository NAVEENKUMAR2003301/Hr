import { useState } from "react";
import { getErrorMessage } from "../../lib/utils";
import { useEmployees } from "../../api/useEmployees";
import { useMarkLeave, useLeaveRequests, useCancelLeaveRequest } from "../../api/useLeaves";

const LEAVE_BUTTONS = [
  { leaveType: "CASUAL", label: "Casual Leave" },
  { leaveType: "SICK", label: "Sick Leave" },
];
const ACTIVE_STATUSES = ["PENDING", "APPROVED_BY_MANAGER", "APPROVED_BY_HR"];

function todayCovers(request) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(request.startDate) <= today && new Date(request.endDate) >= today;
}

// HR's one-click shortcut for same-day, unplanned leave — no employee-apply +
// manager-approve round trip, just mark it and the balance updates immediately.
// Shows today's status per employee up front (rather than only surfacing it as an
// error after a click) so it's obvious *why* the mark buttons are unavailable for
// someone already marked, instead of a click silently appearing to do nothing.
export default function MarkLeaveSection() {
  const [search, setSearch] = useState("");
  const { data: employees, isLoading } = useEmployees({ search, page: 1, pageSize: 20 });
  // Pending/manager-approved requests are rare in this same-day-marking flow (most
  // rows here come from this very feature, which creates APPROVED_BY_HR directly),
  // but a manager-approval-flow request could still cover today — check all three.
  const { data: allRequests } = useLeaveRequests();
  const markLeave = useMarkLeave();
  const cancelLeave = useCancelLeaveRequest();
  const [pendingKey, setPendingKey] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", message }

  const todaysRequestByEmployee = new Map();
  (allRequests ?? [])
    .filter((req) => ACTIVE_STATUSES.includes(req.status) && todayCovers(req))
    .forEach((req) => todaysRequestByEmployee.set(req.employeeId, req));

  async function handleMark(employee, leaveType, label) {
    const key = `${employee.id}-${leaveType}`;
    setPendingKey(key);
    setFeedback(null);
    try {
      await markLeave.mutateAsync({ employeeId: employee.id, leaveType });
      setFeedback({ type: "success", message: `Marked ${employee.firstName} ${employee.lastName} for ${label} today.` });
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err, "Failed to mark leave") });
    } finally {
      setPendingKey(null);
    }
  }

  async function handleRevoke(employee, request) {
    const key = `${employee.id}-revoke`;
    setPendingKey(key);
    setFeedback(null);
    try {
      await cancelLeave.mutateAsync(request.id);
      setFeedback({ type: "success", message: `Revoked ${employee.firstName} ${employee.lastName}'s leave for today.` });
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err, "Failed to revoke") });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark today's leave for an employee</p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code…"
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{feedback.message}</p>
      )}

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {!isLoading && employees?.items.length === 0 && <p className="text-sm text-slate-400">No employees found.</p>}

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {employees?.items.map((emp) => {
          const todaysRequest = todaysRequestByEmployee.get(emp.id);
          const revokeKey = `${emp.id}-revoke`;

          return (
            <li key={emp.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="text-sm">
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  {emp.firstName} {emp.lastName}
                </span>
                <span className="text-slate-400"> · {emp.employeeCode}</span>
              </span>

              {todaysRequest ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 px-2.5 py-1 text-xs font-medium">
                    Marked: {todaysRequest.leavePolicy?.leaveType ?? todaysRequest.leavePolicyId}
                  </span>
                  <button
                    onClick={() => handleRevoke(emp, todaysRequest)}
                    disabled={pendingKey === revokeKey}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {pendingKey === revokeKey ? "Revoking…" : "Revoke"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {LEAVE_BUTTONS.map(({ leaveType, label }) => {
                    const key = `${emp.id}-${leaveType}`;
                    return (
                      <button
                        key={leaveType}
                        onClick={() => handleMark(emp, leaveType, label)}
                        disabled={pendingKey === key}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                      >
                        {pendingKey === key ? "Marking…" : label}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
