import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useCreateDepartment, useUpdateDepartment } from "../../api/useOrg";
import { useEmployees } from "../../api/useEmployees";

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

// Departments here are mostly a title catalog (e.g. "HR", "Software Engineer",
// "Developer") that the Employee form's Department dropdown picks from, plus an
// optional Head — no code, no role field.
export default function DepartmentForm({ department, onDone }) {
  const isEdit = Boolean(department);
  const [name, setName] = useState(department?.name ?? "");
  const [headEmployeeId, setHeadEmployeeId] = useState(department?.headEmployeeId ?? "");
  const [headNameInput, setHeadNameInput] = useState(
    department?.head ? `${department.head.firstName} ${department.head.lastName}` : ""
  );
  const [headLookupError, setHeadLookupError] = useState(null);
  const [error, setError] = useState(null);

  // Plain typed full name, resolved to a real employee via an exact name match on
  // blur — not a picker/combobox, so it's a single input field only. The directory
  // search only substring-matches individual fields (firstName, lastName, etc.), so
  // searching the whole "First Last" string never matches anything — search by just
  // the first word instead, then exact-match the full name client-side.
  const trimmedHeadName = headNameInput.trim();
  const headSearchTerm = trimmedHeadName.split(/\s+/)[0] ?? "";
  const { data: headMatches, isFetching: isLookingUpHead } = useEmployees(
    headSearchTerm ? { search: headSearchTerm, page: 1, pageSize: 20 } : undefined
  );

  function handleHeadNameBlur() {
    if (!trimmedHeadName) {
      setHeadEmployeeId("");
      setHeadLookupError(null);
      return;
    }
    const match = headMatches?.items.find(
      (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === trimmedHeadName.toLowerCase()
    );
    if (match) {
      setHeadEmployeeId(match.id);
      setHeadLookupError(null);
    } else if (!isLookingUpHead) {
      setHeadEmployeeId("");
      setHeadLookupError("No employee found with that name");
    }
  }

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const isSubmitting = createDepartment.isPending || updateDepartment.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (trimmedHeadName && !headEmployeeId) {
      setError("Resolve the Head's name to a real employee first (or clear the field)");
      return;
    }

    try {
      if (isEdit) {
        await updateDepartment.mutateAsync({ id: department.id, name, headEmployeeId });
      } else {
        await createDepartment.mutateAsync({ name, headEmployeeId });
      }
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department title</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HR, Software Engineer, Developer"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Head (optional)</label>
        <input
          className={inputClass}
          value={headNameInput}
          onChange={(e) => setHeadNameInput(e.target.value)}
          onBlur={handleHeadNameBlur}
          placeholder="Name, e.g. Naveenkumar V"
        />
        {headLookupError && <p className="text-xs text-red-600">{headLookupError}</p>}
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
          {isSubmitting ? "Saving…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
