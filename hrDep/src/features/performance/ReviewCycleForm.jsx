import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";
import { useUpdateReviewCycle } from "../../api/usePerformanceAdmin";

const TYPES = ["MONTHLY", "QUARTERLY", "ANNUAL", "PROBATION"];

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

function toDateInput(value) {
  return value ? value.slice(0, 10) : "";
}

export default function ReviewCycleForm({ cycle, onDone }) {
  const isEdit = Boolean(cycle);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: cycle?.name ?? "",
    type: cycle?.type ?? "QUARTERLY",
    startDate: toDateInput(cycle?.startDate),
    endDate: toDateInput(cycle?.endDate),
  });
  const [error, setError] = useState(null);

  const createCycle = useMutation({
    mutationFn: async (data) => (await api.post("/performance/cycles", data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviewCycles }),
  });
  const updateCycle = useUpdateReviewCycle();
  const isSubmitting = createCycle.isPending || updateCycle.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setError("Name, start date, and end date are required");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date must be on or after start date");
      return;
    }
    try {
      if (isEdit) {
        await updateCycle.mutateAsync({ id: cycle.id, ...form });
      } else {
        await createCycle.mutateAsync(form);
      }
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
        <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
        <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start date</label>
          <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">End date</label>
          <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>

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
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create cycle"}
        </button>
      </div>
    </form>
  );
}
