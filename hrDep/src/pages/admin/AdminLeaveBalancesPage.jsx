import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useEmployees } from "../../api/useEmployees";
import { useLeaveBalances, useUpdateLeaveBalance } from "../../api/useLeaveBalances";

function BalanceRow({ balance }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(balance.totalDays);
  const [error, setError] = useState(null);
  const updateBalance = useUpdateLeaveBalance();

  async function save() {
    setError(null);
    if (Number(value) === balance.totalDays) {
      setEditing(false);
      return;
    }
    try {
      await updateBalance.mutateAsync({ id: balance.id, totalDays: Number(value) });
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update"));
    }
  }

  return (
    <>
      <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">{balance.leavePolicy.leaveType}</td>
        <td className="px-4 py-3">
          {editing ? (
            <input
              type="number"
              min={0}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="w-20 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm"
            />
          ) : (
            <button onClick={() => setEditing(true)} className="hover:underline">
              {balance.totalDays}
            </button>
          )}
        </td>
        <td className="px-4 py-3">{balance.usedDays}</td>
        <td className="px-4 py-3">{balance.pendingDays}</td>
        <td className="px-4 py-3 text-slate-500">{balance.totalDays - balance.usedDays - balance.pendingDays}</td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} className="px-4 pb-2 text-xs text-red-600">
            {error}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminLeaveBalancesPage() {
  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeLabel, setEmployeeLabel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: searchResults } = useEmployees({ search, page: 1, pageSize: 8 });
  const { data: balances, isLoading } = useLeaveBalances({ employeeId, year }, { enabled: Boolean(employeeId) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative w-72">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employee</label>
          <input
            value={employeeId ? employeeLabel : search}
            onChange={(e) => {
              setSearch(e.target.value);
              setEmployeeId(null);
            }}
            placeholder="Search by name or code…"
            className="w-full mt-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {!employeeId && search && (
            <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg text-sm">
              {searchResults?.items.length === 0 && <li className="px-3 py-2 text-slate-400">No matches</li>}
              {searchResults?.items.map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeId(emp.id);
                      setEmployeeLabel(`${emp.firstName} ${emp.lastName}`);
                      setSearch("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {emp.firstName} {emp.lastName} <span className="text-slate-400">· {emp.employeeCode}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="block mt-1 w-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {!employeeId && <p className="text-slate-400 text-sm">Search for an employee to view and correct their leave balances.</p>}

      {employeeId && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Total (click to edit)</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Pending</th>
                <th className="px-4 py-3 font-medium">Available</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td>
                </tr>
              )}
              {balances?.map((b) => (
                <BalanceRow key={b.id} balance={b} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
