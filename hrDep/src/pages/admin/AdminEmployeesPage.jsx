import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEmployees } from "../../api/useEmployees";
import { formatDate } from "../../lib/utils";
import ExcelImportExport from "../../features/employees/ExcelImportExport";

export default function AdminEmployeesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [includeTerminated, setIncludeTerminated] = useState(false);
  const { data, isLoading } = useEmployees({ search, page: 1, pageSize: 20, includeTerminated });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Employees</h1>
        <Link
          to="/admin/employees/add"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Add Employee
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, or email…"
          className="w-full max-w-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={includeTerminated} onChange={(e) => setIncludeTerminated(e.target.checked)} />
          Show deactivated employees
        </label>
      </div>

      <ExcelImportExport />

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No employees found.</td>
              </tr>
            )}
            {data?.items.map((emp) => (
              <tr
                key={emp.id}
                onClick={() => navigate(`/admin/employees/${emp.id}`)}
                className={`cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  emp.employmentStatus === "TERMINATED" ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-3 text-slate-500">{emp.employeeCode}</td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
                  {emp.firstName} {emp.lastName}
                </td>
                <td className="px-4 py-3">{emp.department?.name ?? "—"}</td>
                <td className="px-4 py-3">{emp.employmentStatus}</td>
                <td className="px-4 py-3">{formatDate(emp.joiningDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
