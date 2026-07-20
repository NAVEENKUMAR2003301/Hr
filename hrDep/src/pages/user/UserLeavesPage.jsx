import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import LeaveRequestForm from "../../features/leaves/LeaveRequestForm";
import { useMyLeaves } from "../../api/useLeaves";
import { formatDate } from "../../lib/utils";

function LeaveHistory() {
  const { data, isLoading } = useMyLeaves();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Approved by</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Loading…</td>
            </tr>
          )}
          {!isLoading && data?.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No leave requests yet.</td>
            </tr>
          )}
          {data?.map((req) => (
            <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
              <td className="px-4 py-3">{req.leavePolicy?.leaveType}</td>
              <td className="px-4 py-3">
                {formatDate(req.startDate)} – {formatDate(req.endDate)}
              </td>
              <td className="px-4 py-3">{req.status}</td>
              <td className="px-4 py-3 text-slate-500">
                {req.hrApprovedByUser
                  ? `${req.hrApprovedByUser.name ?? req.hrApprovedByUser.email} (HR)`
                  : req.hrApproval
                    ? `${req.hrApproval.firstName} ${req.hrApproval.lastName} (HR)`
                    : req.managerApproval
                      ? `${req.managerApproval.firstName} ${req.managerApproval.lastName} (Manager)`
                      : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UserLeavesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Leaves</h1>
        <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
          {/* Absolute paths, not relative — see the same fix/comment in AdminLeavesPage.jsx. */}
          <NavLink
            to="/leaves/request"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300"}`
            }
          >
            Request
          </NavLink>
          <NavLink
            to="/leaves/history"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300"}`
            }
          >
            History
          </NavLink>
        </div>
      </div>

      <Routes>
        <Route index element={<Navigate to="request" replace />} />
        <Route path="request" element={<LeaveRequestForm />} />
        <Route path="history" element={<LeaveHistory />} />
      </Routes>
    </div>
  );
}
