import { useState } from "react";
import { useLeaveRequests } from "../../api/useLeaves";
import LeaveApprovalCard from "../../features/leaves/LeaveApprovalCard";
import MarkLeaveSection from "../../features/leaves/MarkLeaveSection";
import { useAuth } from "../../features/auth/useAuth";

export default function AdminLeaveRequestsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("PENDING");
  const { data, isLoading } = useLeaveRequests({ status });

  const stage = user.role === "MANAGER" ? "MANAGER" : "HR";

  return (
    <div className="space-y-4">
      {/* Mark-leave is an ADMIN-only shortcut server-side — only show it to ADMIN,
          not MANAGER, so the button isn't there just to fail with 403 on click. */}
      {user.role === "ADMIN" && <MarkLeaveSection />}

      <div className="flex justify-end">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED_BY_MANAGER">Approved by manager</option>
          <option value="APPROVED_BY_HR">Approved by HR</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {data?.map((req) => (
          <LeaveApprovalCard key={req.id} request={req} stage={stage} />
        ))}
      </div>
    </div>
  );
}
