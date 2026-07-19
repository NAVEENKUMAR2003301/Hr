import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { leaveRequestSchema } from "../../lib/schemas";
import { useApplyLeave } from "../../api/useLeaves";

const LEAVE_TYPES = ["ANNUAL", "SICK", "CASUAL", "MATERNITY", "PATERNITY"];

export default function LeaveRequestForm() {
  const navigate = useNavigate();
  const applyLeave = useApplyLeave();
  const [form, setForm] = useState({ leaveType: "ANNUAL", startDate: "", endDate: "", reason: "" });
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const parsed = leaveRequestSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    try {
      await applyLeave.mutateAsync(parsed.data);
      navigate("/user/leaves/history");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit leave request"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Leave type</label>
        <select
          value={form.leaveType}
          onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">End date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
        <textarea
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={applyLeave.isPending}
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {applyLeave.isPending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
