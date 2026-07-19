import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";

export default function UserOnboardingPage() {
  const queryClient = useQueryClient();
  const { data: process, isLoading } = useQuery({
    queryKey: queryKeys.myOnboarding,
    queryFn: async () => (await api.get("/onboarding/me")).data,
    retry: false,
  });

  const complete = useMutation({
    mutationFn: async (taskId) => (await api.patch(`/onboarding/tasks/${taskId}/complete`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myOnboarding }),
  });

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!process) return <p className="text-slate-400">No onboarding checklist assigned.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Onboarding</h1>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {process.taskItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-50">{item.template.taskName}</p>
              <p className="text-xs text-slate-500">{item.template.category}</p>
            </div>
            {item.status === "COMPLETED" ? (
              <span className="text-xs font-semibold text-emerald-600">Done</span>
            ) : (
              <button
                onClick={() => complete.mutate(item.id)}
                disabled={complete.isPending}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Mark complete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
