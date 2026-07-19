import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import AdminAllReviewsPage from "./AdminAllReviewsPage";
import AdminReviewCyclesPage from "./AdminReviewCyclesPage";
import AdminFeedbackCategoriesPage from "./AdminFeedbackCategoriesPage";

// Absolute paths, not relative — see the same fix/comment in AdminLeavesPage.jsx.
const TABS = [
  { to: "/admin/performance/reviews", label: "Reviews" },
  { to: "/admin/performance/cycles", label: "Cycles" },
  { to: "/admin/performance/categories", label: "Feedback Categories" },
];

export default function AdminPerformancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Performance</h1>
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
        <Route index element={<Navigate to="reviews" replace />} />
        <Route path="reviews" element={<AdminAllReviewsPage />} />
        <Route path="cycles" element={<AdminReviewCyclesPage />} />
        <Route path="categories" element={<AdminFeedbackCategoriesPage />} />
      </Routes>
    </div>
  );
}
