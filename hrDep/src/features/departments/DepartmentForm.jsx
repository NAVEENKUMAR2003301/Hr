import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useCreateDepartment, useUpdateDepartment } from "../../api/useOrg";
import ManagerPicker from "../employees/ManagerPicker";

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function DepartmentForm({ department, onDone }) {
  const isEdit = Boolean(department);
  const [form, setForm] = useState({
    name: department?.name ?? "",
    code: department?.code ?? "",
    headEmployeeId: department?.headEmployeeId ?? "",
  });
  const [headLabel, setHeadLabel] = useState(
    department?.head ? `${department.head.firstName} ${department.head.lastName}` : ""
  );
  const [error, setError] = useState(null);

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const isSubmitting = createDepartment.isPending || updateDepartment.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.code.trim()) {
      setError("Name and code are required");
      return;
    }

    try {
      if (isEdit) {
        await updateDepartment.mutateAsync({ id: department.id, ...form });
      } else {
        await createDepartment.mutateAsync(form);
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
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Code</label>
        <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department head</label>
        <ManagerPicker
          value={form.headEmployeeId}
          selectedLabel={headLabel}
          onChange={(emp) => {
            setForm({ ...form, headEmployeeId: emp?.id ?? "" });
            setHeadLabel(emp ? `${emp.firstName} ${emp.lastName}` : "");
          }}
        />
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
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create department"}
        </button>
      </div>
    </form>
  );
}
