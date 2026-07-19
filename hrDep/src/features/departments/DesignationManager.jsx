import { useState } from "react";
import { useDesignations, useCreateDesignation, useUpdateDesignation } from "../../api/useOrg";

function DesignationRow({ designation, onDeleteRequest }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(designation.title);
  const updateDesignation = useUpdateDesignation();

  async function save() {
    if (!title.trim() || title === designation.title) {
      setEditing(false);
      return;
    }
    await updateDesignation.mutateAsync({ id: designation.id, title });
    setEditing(false);
  }

  return (
    <li className="flex items-center justify-between gap-2 py-1.5 text-sm">
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm"
        />
      ) : (
        <button onClick={() => setEditing(true)} className="flex-1 text-left hover:underline">
          {designation.title}
        </button>
      )}
      <button onClick={() => onDeleteRequest(designation)} className="text-xs text-red-500 hover:text-red-700">
        Delete
      </button>
    </li>
  );
}

export default function DesignationManager({ departmentId, onDeleteRequest }) {
  const { data: designations, isLoading } = useDesignations(departmentId);
  const [newTitle, setNewTitle] = useState("");
  const createDesignation = useCreateDesignation();

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createDesignation.mutateAsync({ title: newTitle, departmentId });
    setNewTitle("");
  }

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
      <p className="text-xs font-medium text-slate-500 mb-1">Designations</p>
      {isLoading && <p className="text-xs text-slate-400">Loading…</p>}
      {!isLoading && designations?.length === 0 && <p className="text-xs text-slate-400">None yet.</p>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {designations?.map((d) => (
          <DesignationRow key={d.id} designation={d} onDeleteRequest={onDeleteRequest} />
        ))}
      </ul>
      <form onSubmit={handleAdd} className="flex gap-2 mt-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New designation title…"
          className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={createDesignation.isPending}
          className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
