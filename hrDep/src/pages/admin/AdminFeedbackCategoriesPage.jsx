import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useFeedbackCategories, useDeleteFeedbackCategory } from "../../api/useFeedbackCategories";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import FeedbackCategoryForm from "../../features/performance/FeedbackCategoryForm";

export default function AdminFeedbackCategoriesPage() {
  const { data, isLoading } = useFeedbackCategories();
  const deleteCategory = useDeleteFeedbackCategory();
  const [formTarget, setFormTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Applied to every review created when a cycle is activated. Editing here doesn't change reviews already in progress.
        </p>
        <button
          onClick={() => setFormTarget("new")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {data?.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between">
            <p className="font-medium text-slate-900 dark:text-slate-50">{cat.name}</p>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setFormTarget(cat)} className="text-indigo-600 hover:underline">
                Edit
              </button>
              <button onClick={() => setDeleteTarget(cat)} className="text-red-500 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {formTarget && (
        <Modal title={formTarget === "new" ? "New Feedback Category" : "Edit Feedback Category"} onClose={() => setFormTarget(null)}>
          <FeedbackCategoryForm category={formTarget === "new" ? null : formTarget} onDone={() => setFormTarget(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete feedback category?"
          message={`Delete "${deleteTarget.name}"? Only possible if it isn't used in any review rating yet.`}
          pending={deleteCategory.isPending}
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
