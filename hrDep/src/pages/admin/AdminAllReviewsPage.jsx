import { useState } from "react";
import { Link } from "react-router-dom";
import { useAllReviews } from "../../api/usePerformanceAdmin";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";

const STATUS_STYLE = {
  SELF_APPRAISAL_PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  MANAGER_REVIEW_PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
  DISPUTED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300",
};

function averageRating(ratings, field) {
  const values = ratings.map((r) => r[field]).filter((v) => v != null);
  if (values.length === 0) return "—";
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
}

export default function AdminAllReviewsPage() {
  const [cycleId, setCycleId] = useState("");
  const { data: cycles } = useQuery({
    queryKey: queryKeys.reviewCycles,
    queryFn: async () => (await api.get("/performance/cycles")).data,
  });
  const { data: reviews, isLoading } = useAllReviews({ cycleId: cycleId || undefined });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">All cycles</option>
          {cycles?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Cycle</th>
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Self avg</th>
              <th className="px-4 py-3 font-medium">Manager avg</th>
              <th className="px-4 py-3 font-medium">Leave days (cycle)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!isLoading && reviews?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">No reviews found.</td>
              </tr>
            )}
            {reviews?.map((review) => (
              <tr key={review.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="px-4 py-3">
                  <Link to={`/admin/employees/${review.employee.id}`} className="font-medium text-slate-900 dark:text-slate-50 hover:text-indigo-600">
                    {review.employee.firstName} {review.employee.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{review.cycle.name}</td>
                <td className="px-4 py-3 text-slate-500">
                  {review.reviewer.firstName} {review.reviewer.lastName}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[review.status] ?? "bg-slate-100 text-slate-700"}`}>
                    {review.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">{averageRating(review.ratings, "selfRating")}</td>
                <td className="px-4 py-3">{averageRating(review.ratings, "managerRating")}</td>
                <td className="px-4 py-3">{review.leaveDaysInCycle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
