import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { useAuth } from "../../features/auth/useAuth";
import { formatDate } from "../../lib/utils";

export default function UserProfilePage() {
  const { user } = useAuth();
  const { data: employee, isLoading } = useQuery({
    queryKey: ["employees", user.employeeId],
    queryFn: async () => (await api.get(`/employees/${user.employeeId}`)).data,
    enabled: Boolean(user.employeeId),
  });

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!employee) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Profile</h1>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <Field label="Name" value={`${employee.firstName} ${employee.lastName}`} />
        <Field label="Employee code" value={employee.employeeCode} />
        <Field label="Department" value={employee.department?.name ?? "—"} />
        <Field label="Designation" value={employee.designation?.title ?? "—"} />
        <Field label="Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"} />
        <Field label="Joined" value={formatDate(employee.joiningDate)} />
        <Field label="Phone" value={employee.phoneNumber ?? "—"} editable />
        <Field label="Emergency contact" value={employee.emergencyContactName ?? "—"} editable />
      </div>
    </div>
  );
}

function Field({ label, value, editable }) {
  return (
    <div>
      <p className="text-slate-500">
        {label} {editable && <span className="text-xs text-indigo-500">(editable)</span>}
      </p>
      <p className="font-medium text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}
