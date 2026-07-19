import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useLeavePolicies, useDeleteLeavePolicy } from "../../api/useLeavePolicies";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import LeavePolicyForm from "../../features/leaves/LeavePolicyForm";

export default function AdminLeavePoliciesPage() {
  const { data, isLoading } = useLeavePolicies();
  const deletePolicy = useDeleteLeavePolicy();
  const [formTarget, setFormTarget] = useState(null); // null | "new" | policy
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deletePolicy.mutateAsync(deleteTarget.id);
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
          disabled={data?.length >= 5}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          New Policy
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Max days/year</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {data?.map((policy) => (
              <tr key={policy.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">{policy.leaveType}</td>
                <td className="px-4 py-3">{policy.maxDaysPerYear}</td>
                <td className="px-4 py-3">{policy.isPaid ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => setFormTarget(policy)} className="text-xs text-indigo-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(policy)} className="text-xs text-red-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formTarget && (
        <Modal title={formTarget === "new" ? "New Leave Policy" : "Edit Leave Policy"} onClose={() => setFormTarget(null)}>
          <LeavePolicyForm
            policy={formTarget === "new" ? null : formTarget}
            existingTypes={data?.map((p) => p.leaveType) ?? []}
            onDone={() => setFormTarget(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete leave policy?"
          message={`Delete the ${deleteTarget.leaveType} policy? Only possible if no leave requests reference it.`}
          pending={deletePolicy.isPending}
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
