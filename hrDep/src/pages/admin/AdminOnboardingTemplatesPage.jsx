import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useOnboardingTemplates, useDeleteOnboardingTemplate } from "../../api/useOnboardingTemplates";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import OnboardingTemplateForm from "../../features/onboarding/OnboardingTemplateForm";

export default function AdminOnboardingTemplatesPage() {
  const { data, isLoading } = useOnboardingTemplates();
  const deleteTemplate = useDeleteOnboardingTemplate();
  const [formTarget, setFormTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Applied to every new hire's onboarding checklist. Editing here doesn't change existing employees' checklists.
        </p>
        <button
          onClick={() => setFormTarget("new")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New Task
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Assigned role</th>
              <th className="px-4 py-3 font-medium">Mandatory</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {data?.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">{t.taskName}</td>
                <td className="px-4 py-3">{t.category.replace("_", " ")}</td>
                <td className="px-4 py-3">{t.assignedRole}</td>
                <td className="px-4 py-3">{t.isMandatory ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => setFormTarget(t)} className="text-xs text-indigo-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(t)} className="text-xs text-red-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formTarget && (
        <Modal title={formTarget === "new" ? "New Onboarding Task" : "Edit Onboarding Task"} onClose={() => setFormTarget(null)}>
          <OnboardingTemplateForm template={formTarget === "new" ? null : formTarget} onDone={() => setFormTarget(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete task template?"
          message={`Delete "${deleteTarget.taskName}"? Only possible if no employee checklist already includes it.`}
          pending={deleteTemplate.isPending}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
      {deleteError && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-red-600 text-white text-sm px-4 py-2 shadow-lg">{deleteError}</div>
      )}
    </div>
  );
}
