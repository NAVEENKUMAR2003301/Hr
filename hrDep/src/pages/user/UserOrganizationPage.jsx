import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { useAuth } from "../../features/auth/useAuth";

export default function UserOrganizationPage() {
  const { user } = useAuth();
  const { data: me, isLoading } = useQuery({
    queryKey: ["employees", user.employeeId, "org"],
    queryFn: async () => (await api.get(`/employees/${user.employeeId}`)).data,
    enabled: Boolean(user.employeeId),
  });

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!me) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Org Chart</h1>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <p className="text-sm text-slate-500">Department</p>
          <p className="font-medium text-slate-900 dark:text-slate-50">{me.department?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Manager</p>
          <p className="font-medium text-slate-900 dark:text-slate-50">
            {me.manager ? `${me.manager.firstName} ${me.manager.lastName}` : "No manager (top of hierarchy)"}
          </p>
        </div>
      </div>
    </div>
  );
}
