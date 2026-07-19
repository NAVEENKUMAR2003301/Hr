import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import AdminLeaveCalendarPage from "./AdminLeaveCalendarPage";
import AdminLeaveRequestsPage from "./AdminLeaveRequestsPage";
import AdminLeavePoliciesPage from "./AdminLeavePoliciesPage";
import AdminLeaveBalancesPage from "./AdminLeaveBalancesPage";

// Absolute paths, not relative ("calendar", "requests", ...) — relative NavLink
// targets resolve against the CURRENT matched path, not this route's own base, so
// from e.g. /admin/leaves/calendar a relative "requests" would resolve to
// /admin/leaves/calendar/requests instead of /admin/leaves/requests.
const TABS = [
  { to: "/admin/leaves/calendar", label: "Calendar" },
  { to: "/admin/leaves/requests", label: "Requests" },
  { to: "/admin/leaves/policies", label: "Policies" },
  { to: "/admin/leaves/balances", label: "Balances" },
];

export default function AdminLeavesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Leave Management</h1>
        <div className="max-w-full overflow-x-auto">
          <div className="flex w-fit gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300"}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <Routes>
        <Route index element={<Navigate to="calendar" replace />} />
        <Route path="calendar" element={<AdminLeaveCalendarPage />} />
        <Route path="requests" element={<AdminLeaveRequestsPage />} />
        <Route path="policies" element={<AdminLeavePoliciesPage />} />
        <Route path="balances" element={<AdminLeaveBalancesPage />} />
      </Routes>
    </div>
  );
}
