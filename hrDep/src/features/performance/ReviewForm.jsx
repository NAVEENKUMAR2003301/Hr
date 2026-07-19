import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../features/auth/useAuth";

// Renders one row per feedback category the review already has ratings for,
// with the field the current user owns (self vs manager) editable.
export default function ReviewForm({ review }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSelf = review.employeeId === user.employeeId;
  const [drafts, setDrafts] = useState({});

  const submitRating = useMutation({
    mutationFn: async ({ categoryId, value }) =>
      (
        await api.post(`/performance/reviews/${review.id}/ratings`, {
          categoryId,
          [isSelf ? "selfRating" : "managerRating"]: value,
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myReviews }),
  });

  const acknowledge = useMutation({
    mutationFn: async () => (await api.post(`/performance/reviews/${review.id}/acknowledge`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myReviews }),
  });

  const canEdit = isSelf ? review.status === "SELF_APPRAISAL_PENDING" : review.status === "MANAGER_REVIEW_PENDING";
  const managerDone = review.ratings.length > 0 && review.ratings.every((r) => r.managerRating != null);
  const canAcknowledge = isSelf && review.status === "MANAGER_REVIEW_PENDING" && managerDone;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900 dark:text-slate-50">{review.cycle.name}</p>
        <span className="text-sm text-slate-500">{review.status}</span>
      </div>

      <div className="space-y-3">
        {review.ratings.map((rating) => (
          <div key={rating.id} className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{rating.category.name}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Self: {rating.selfRating ?? "—"}</span>
              <span className="text-slate-400">Manager: {rating.managerRating ?? "—"}</span>
              {canEdit && (
                <select
                  value={drafts[rating.categoryId] ?? ""}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [rating.categoryId]: e.target.value })
                  }
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1"
                >
                  <option value="" disabled>
                    Rate
                  </option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <button
          onClick={() =>
            Object.entries(drafts).forEach(([categoryId, value]) =>
              submitRating.mutate({ categoryId, value: Number(value) })
            )
          }
          disabled={submitRating.isPending || Object.keys(drafts).length === 0}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Submit ratings
        </button>
      )}

      {canAcknowledge && (
        <button
          onClick={() => acknowledge.mutate()}
          disabled={acknowledge.isPending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}
