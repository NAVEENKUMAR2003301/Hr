import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useCreateOnboardingTemplate, useUpdateOnboardingTemplate } from "../../api/useOnboardingTemplates";

const CATEGORIES = ["DOCUMENT", "IT_SETUP", "TRAINING"];
const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"];

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function OnboardingTemplateForm({ template, onDone }) {
  const isEdit = Boolean(template);
  const [form, setForm] = useState({
    taskName: template?.taskName ?? "",
    category: template?.category ?? "DOCUMENT",
    assignedRole: template?.assignedRole ?? "ADMIN",
    isMandatory: template?.isMandatory ?? true,
  });
  const [error, setError] = useState(null);

  const createTemplate = useCreateOnboardingTemplate();
  const updateTemplate = useUpdateOnboardingTemplate();
  const isSubmitting = createTemplate.isPending || updateTemplate.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.taskName.trim()) {
      setError("Task name is required");
      return;
    }
    try {
      if (isEdit) {
        await updateTemplate.mutateAsync({ id: template.id, ...form });
      } else {
        await createTemplate.mutateAsync(form);
      }
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Task name</label>
        <input className={inputClass} value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
        <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assigned role</label>
        <select className={inputClass} value={form.assignedRole} onChange={(e) => setForm({ ...form, assignedRole: e.target.value })}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={form.isMandatory} onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })} />
        Mandatory
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
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create template"}
        </button>
      </div>
    </form>
  );
}
