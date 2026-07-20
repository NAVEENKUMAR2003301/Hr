import { useState } from "react";
import { formatDate } from "../../lib/utils";
import { useLeaveDecision } from "../../api/useLeaves";

const STAGE_LABEL = { MANAGER: "Manager decision", HR: "HR decision" };
// Mirrors server/src/services/leave.service.js EXPECTED_STATUS_FOR_STAGE — the server
// rejects a decision made from the wrong status, so hide the buttons instead of letting
// the click round-trip into an error.
const ACTIONABLE_STATUS_FOR_STAGE = { MANAGER: "PENDING", HR: "APPROVED_BY_MANAGER" };

export default function LeaveApprovalCard({ request, stage }) {
  const [comment, setComment] = useState("");
  const decide = useLeaveDecision(stage);
  const isActionable = request.status === ACTIONABLE_STATUS_FOR_STAGE[stage];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-50">
            {request.employee?.firstName} {request.employee?.lastName}
          </p>
          <p className="text-sm text-slate-500">
            {request.leavePolicy?.leaveType} · {formatDate(request.startDate)} – {formatDate(request.endDate)}
          </p>
        </div>
        <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 px-2.5 py-1 text-xs font-medium">
          {request.status}
        </span>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">{request.reason}</p>

      {isActionable ? (
        <>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`${STAGE_LABEL[stage]} comment (optional)`}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex gap-2">
            <button
              onClick={() => decide.mutate({ id: request.id, decision: "APPROVE", comment })}
              disabled={decide.isPending}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => decide.mutate({ id: request.id, decision: "REJECT", comment })}
              disabled={decide.isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-1 text-xs text-slate-400">
          {request.managerApproval && (
            <p>
              Manager stage: {request.managerApproval.firstName} {request.managerApproval.lastName}
              {request.managerComment && ` — "${request.managerComment}"`}
            </p>
          )}
          {(request.hrApprovedByUser || request.hrApproval) && (
            <p>
              HR stage:{" "}
              {request.hrApprovedByUser
                ? request.hrApprovedByUser.name ?? request.hrApprovedByUser.email
                : `${request.hrApproval.firstName} ${request.hrApproval.lastName}`}
              {request.hrComment && ` — "${request.hrComment}"`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
