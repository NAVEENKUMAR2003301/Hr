import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useCreateFeedbackCategory, useUpdateFeedbackCategory } from "../../api/useFeedbackCategories";

export default function FeedbackCategoryForm({ category, onDone }) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState(null);

  const createCategory = useCreateFeedbackCategory();
  const updateCategory = useUpdateFeedbackCategory();
  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      if (isEdit) {
        await updateCategory.mutateAsync({ id: category.id, name });
      } else {
        await createCategory.mutateAsync({ name });
      }
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
}
