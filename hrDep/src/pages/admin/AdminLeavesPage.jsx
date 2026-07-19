import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import AdminLeaveCalendarPage from "./AdminLeaveCalendarPage";
import AdminLeaveRequestsPage from "./AdminLeaveRequestsPage";
import AdminLeavePoliciesPage from "./AdminLeavePoliciesPage";
import AdminLeaveBalancesPage from "./AdminLeaveBalancesPage";

const TABS = [
  { to: "calendar", label: "Calendar" },
  { to: "requests", label: "Requests" },
  { to: "policies", label: "Policies" },
  { to: "balances", label: "Balances" },
];

export default function AdminLeavesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Leave Management</h1>
        <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300"}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
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
