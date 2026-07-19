import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { formatDate, formatRelativeTime } from "../../lib/utils";

const PAGE_SIZE = 50;

function actorName(entry) {
  if (!entry.user) return "System";
  if (entry.user.employee) return `${entry.user.employee.firstName} ${entry.user.employee.lastName}`;
  return entry.user.name ?? entry.user.email;
}

// Who-changed-what across the app, now that multiple HR/admin accounts share this
// system — every audit-logged action shows here, newest first.
export default function AdminActivityLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["auditLog", page],
    queryFn: async () => (await api.get("/audit-log", { params: { page, pageSize: PAGE_SIZE } })).data,
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Activity Log</h1>
        <p className="text-sm text-slate-500">{(data?.total ?? 0).toLocaleString()} recorded actions</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">What</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">No activity recorded yet.</td>
              </tr>
            )}
            {data?.items.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap" title={formatDate(entry.createdAt)}>
                  {formatRelativeTime(entry.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50 whitespace-nowrap">{actorName(entry)}</td>
                <td className="px-4 py-3">{entry.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
