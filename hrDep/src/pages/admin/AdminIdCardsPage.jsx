import { useState } from "react";
import { getErrorMessage } from "../../lib/utils";
import { useEmployees, useSetIdCardStatus } from "../../api/useEmployees";

const PAGE_SIZE = 50;

const FILTERS = [
  { value: "", label: "All" },
  { value: "false", label: "Not provided" },
  { value: "true", label: "Provided" },
];

function IdCardRow({ employee, serial }) {
  const setStatus = useSetIdCardStatus();
  const [error, setError] = useState(null);

  async function toggle() {
    setError(null);
    try {
      await setStatus.mutateAsync({ id: employee.id, provided: !employee.idCardProvided });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update"));
    }
  }

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <td className="px-4 py-3 text-slate-500">{serial}</td>
      <td className="px-4 py-3 text-slate-500">{employee.employeeCode}</td>
      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
        {employee.firstName} {employee.lastName}
      </td>
      <td className="px-4 py-3">{employee.department?.name ?? "—"}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            employee.idCardProvided
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
          }`}
        >
          {employee.idCardProvided ? "Provided" : "Not provided"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={toggle}
          disabled={setStatus.isPending}
          className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          Mark as {employee.idCardProvided ? "not provided" : "provided"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

export default function AdminIdCardsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useEmployees({
    search,
    page,
    pageSize: PAGE_SIZE,
    idCardProvided: filter || undefined,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstSerial = (page - 1) * PAGE_SIZE + 1;

  function updateFilter(value) {
    setFilter(value);
    setPage(1);
  }

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">ID Cards</h1>
        <p className="text-sm text-slate-500">{total.toLocaleString()} employees total</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Search by name, code, or email…"
          className="w-full max-w-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                filter === f.value ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">ID Card</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">No employees found.</td>
              </tr>
            )}
            {data?.items.map((emp, i) => (
              <IdCardRow key={emp.id} employee={emp} serial={firstSerial + i} />
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
