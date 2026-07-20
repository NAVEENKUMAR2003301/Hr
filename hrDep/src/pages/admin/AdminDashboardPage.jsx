import { Link } from "react-router-dom";
import { useDashboard } from "../../api/useDashboard";
import { formatDate, formatRelativeTime } from "../../lib/utils";

function StatCard({ label, value, to }) {
  const Wrapper = to ? Link : "div";
  return (
    <Wrapper
      to={to}
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors ${
        to ? "hover:border-indigo-300 dark:hover:border-indigo-700" : ""
      }`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{value ?? "—"}</p>
    </Wrapper>
  );
}

const LEAVE_STATUS_STYLE = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  APPROVED_BY_MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300",
  APPROVED_BY_HR: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300",
};

const ACTIVITY_ICON = {
  employee_added: "👤",
  leave_requested: "🗓️",
  onboarding_task_completed: "✅",
};

function Panel({ title, action, children }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={data?.stats.totalEmployees} to="/admin/employees" />
        <StatCard label="Pending Leave Requests" value={data?.stats.pendingLeaveCount} to="/admin/leaves/requests" />
        <StatCard label="Active Onboarding" value={data?.stats.activeOnboardingCount} to="/admin/onboarding" />
        <StatCard label="Departments" value={data?.stats.departmentCount} to="/admin/departments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Recent Employees" action={<Link to="/admin/employees" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>}>
            {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
            {!isLoading && data?.recentEmployees.length === 0 && <p className="text-sm text-slate-400">No employees yet.</p>}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.recentEmployees.map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between">
                  <Link to={`/admin/employees/${e.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-50 hover:text-indigo-600">
                    {e.firstName} {e.lastName}
                  </Link>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{e.department?.name ?? "Unassigned"}</p>
                    <p className="text-xs text-slate-400">{formatDate(e.joiningDate)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent Leave Requests" action={<Link to="/admin/leaves/requests" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>}>
            {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
            {!isLoading && data?.recentLeaves.length === 0 && <p className="text-sm text-slate-400">No leave requests yet.</p>}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.recentLeaves.map((l) => (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {l.employee.firstName} {l.employee.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {l.leavePolicy.leaveType} · {formatDate(l.startDate)} – {formatDate(l.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${LEAVE_STATUS_STYLE[l.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {l.status.replaceAll("_", " ")}
                    </span>
                    {l.hrApprovedByUser && (
                      <p className="mt-1 text-xs text-slate-400">
                        by {l.hrApprovedByUser.name ?? l.hrApprovedByUser.email}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Recent Activity">
          {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
          {!isLoading && data?.activity.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
          <ul className="space-y-4">
            {data?.activity.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-lg leading-none">{ACTIVITY_ICON[a.type] ?? "•"}</span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{a.message}</p>
                  <p className="text-xs text-slate-400">{formatRelativeTime(a.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
