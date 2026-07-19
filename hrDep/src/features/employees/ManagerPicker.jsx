import { useState } from "react";
import { useEmployees } from "../../api/useEmployees";

// Searchable combobox instead of a plain <select> — at 4000+ employees a full
// dropdown of names would be both slow to render and unusable to scroll.
export default function ManagerPicker({ value, selectedLabel, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useEmployees({ search: query, page: 1, pageSize: 8 });

  return (
    <div className="relative">
      <input
        value={open ? query : selectedLabel ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search by name or employee code…"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
        >
          Clear
        </button>
      )}

      {open && query && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg text-sm">
          {isFetching && <li className="px-3 py-2 text-slate-400">Searching…</li>}
          {!isFetching && data?.items.length === 0 && <li className="px-3 py-2 text-slate-400">No matches</li>}
          {data?.items.map((emp) => (
            <li key={emp.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(emp);
                  setQuery("");
                  setOpen(false);
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
  );
}
