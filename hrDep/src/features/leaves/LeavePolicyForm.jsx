import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useCreateLeavePolicy, useUpdateLeavePolicy } from "../../api/useLeavePolicies";

const LEAVE_TYPES = ["ANNUAL", "SICK", "CASUAL", "MATERNITY", "PATERNITY"];

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function LeavePolicyForm({ policy, existingTypes, onDone }) {
  const isEdit = Boolean(policy);
  const [form, setForm] = useState({
    leaveType: policy?.leaveType ?? LEAVE_TYPES.find((t) => !existingTypes.includes(t)) ?? "ANNUAL",
    maxDaysPerYear: policy?.maxDaysPerYear ?? 10,
    isPaid: policy?.isPaid ?? true,
  });
  const [error, setError] = useState(null);

  const createPolicy = useCreateLeavePolicy();
  const updatePolicy = useUpdateLeavePolicy();
  const isSubmitting = createPolicy.isPending || updatePolicy.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updatePolicy.mutateAsync({ id: policy.id, maxDaysPerYear: Number(form.maxDaysPerYear), isPaid: form.isPaid });
      } else {
        await createPolicy.mutateAsync({ ...form, maxDaysPerYear: Number(form.maxDaysPerYear) });
      }
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Leave type</label>
        <select
          className={inputClass}
          value={form.leaveType}
          disabled={isEdit}
          onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t} disabled={!isEdit && existingTypes.includes(t)}>
              {t} {!isEdit && existingTypes.includes(t) ? "(already exists)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max days per year</label>
        <input
          type="number"
          min={0}
          className={inputClass}
          value={form.maxDaysPerYear}
          onChange={(e) => setForm({ ...form, maxDaysPerYear: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} />
        Paid leave
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create policy"}
        </button>
      </div>
    </form>
  );
}
