import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import AdminOnboardingTrackerPage from "./AdminOnboardingTrackerPage";
import AdminOnboardingTemplatesPage from "./AdminOnboardingTemplatesPage";

const TABS = [
  { to: "tracker", label: "Tracker" },
  { to: "templates", label: "Task Templates" },
];

export default function AdminOnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Onboarding</h1>
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
        <Route index element={<Navigate to="tracker" replace />} />
        <Route path="tracker" element={<AdminOnboardingTrackerPage />} />
        <Route path="templates" element={<AdminOnboardingTemplatesPage />} />
      </Routes>
    </div>
  );
}
