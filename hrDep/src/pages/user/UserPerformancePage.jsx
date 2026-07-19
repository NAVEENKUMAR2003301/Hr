import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";
import ReviewForm from "../../features/performance/ReviewForm";

export default function UserPerformancePage() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: queryKeys.myReviews,
    queryFn: async () => (await api.get("/performance/reviews/me")).data,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Performance</h1>

      <div className="space-y-4">
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {!isLoading && reviews?.length === 0 && <p className="text-slate-400">No reviews right now.</p>}
        {reviews?.map((review) => (
          <ReviewForm key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
