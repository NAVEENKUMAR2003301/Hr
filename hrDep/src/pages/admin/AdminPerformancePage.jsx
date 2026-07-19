import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import AdminAllReviewsPage from "./AdminAllReviewsPage";
import AdminReviewCyclesPage from "./AdminReviewCyclesPage";
import AdminFeedbackCategoriesPage from "./AdminFeedbackCategoriesPage";

const TABS = [
  { to: "reviews", label: "Reviews" },
  { to: "cycles", label: "Cycles" },
  { to: "categories", label: "Feedback Categories" },
];

export default function AdminPerformancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Performance</h1>
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
        <Route index element={<Navigate to="reviews" replace />} />
        <Route path="reviews" element={<AdminAllReviewsPage />} />
        <Route path="cycles" element={<AdminReviewCyclesPage />} />
        <Route path="categories" element={<AdminFeedbackCategoriesPage />} />
      </Routes>
    </div>
  );
}
