import { useMyLeaves } from "../../api/useLeaves";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";
import { Link } from "react-router-dom";

export default function UserDashboardPage() {
  const { data: leaves } = useMyLeaves();
  const { data: onboarding } = useQuery({
    queryKey: queryKeys.myOnboarding,
    queryFn: async () => (await api.get("/onboarding/me")).data,
    retry: false,
  });

  const pendingTasks = onboarding?.taskItems?.filter((t) => t.status === "PENDING").length ?? 0;
  const pendingLeaves = leaves?.filter((l) => l.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Dashboard</h1>
        <Link
          to="/user/leaves/request"
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Apply for Leave
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-sm text-slate-500">Pending Leave Requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{pendingLeaves}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-sm text-slate-500">Onboarding Tasks Remaining</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{pendingTasks}</p>
        </div>
      </div>
    </div>
  );
}
