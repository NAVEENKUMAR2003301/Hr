import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";
import { formatDate, getErrorMessage } from "../../lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCloseReviewCycle, useDeleteReviewCycle } from "../../api/usePerformanceAdmin";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import ReviewCycleForm from "../../features/performance/ReviewCycleForm";

export default function AdminReviewCyclesPage() {
  const queryClient = useQueryClient();
  const { data: cycles, isLoading } = useQuery({
    queryKey: queryKeys.reviewCycles,
    queryFn: async () => (await api.get("/performance/cycles")).data,
  });

  const activate = useMutation({
    mutationFn: async (id) => (await api.post(`/performance/cycles/${id}/activate`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviewCycles }),
  });
  const closeCycle = useCloseReviewCycle();
  const deleteCycle = useDeleteReviewCycle();

  const [formTarget, setFormTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteCycle.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setFormTarget("new")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New Cycle
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {cycles?.map((cycle) => (
              <tr key={cycle.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">{cycle.name}</td>
                <td className="px-4 py-3">{cycle.type}</td>
                <td className="px-4 py-3">
                  {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
                </td>
                <td className="px-4 py-3">{cycle.status}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  {cycle.status === "UPCOMING" && (
                    <>
                      <button onClick={() => setFormTarget(cycle)} className="text-xs text-indigo-600 hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => activate.mutate(cycle.id)}
                        disabled={activate.isPending}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Activate
                      </button>
                      <button onClick={() => setDeleteTarget(cycle)} className="text-xs text-red-500 hover:underline">
                        Delete
                      </button>
                    </>
                  )}
                  {cycle.status === "ACTIVE" && (
                    <button
                      onClick={() => closeCycle.mutate(cycle.id)}
                      disabled={closeCycle.isPending}
                      className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formTarget && (
        <Modal title={formTarget === "new" ? "New Review Cycle" : "Edit Review Cycle"} onClose={() => setFormTarget(null)}>
          <ReviewCycleForm cycle={formTarget === "new" ? null : formTarget} onDone={() => setFormTarget(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete review cycle?"
          message={`Delete "${deleteTarget.name}"? Only possible while it's still upcoming (no reviews created yet).`}
          pending={deleteCycle.isPending}
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
