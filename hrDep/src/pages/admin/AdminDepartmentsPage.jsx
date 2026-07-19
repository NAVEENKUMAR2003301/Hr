import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDepartments, useDeleteDepartment, useDeleteDesignation } from "../../api/useOrg";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import DepartmentForm from "../../features/departments/DepartmentForm";
import DesignationManager from "../../features/departments/DesignationManager";

export default function AdminDepartmentsPage() {
  const { data, isLoading } = useDepartments();
  const deleteDepartment = useDeleteDepartment();
  const deleteDesignation = useDeleteDesignation();

  const [formTarget, setFormTarget] = useState(null); // null | "new" | department object
  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "department" | "designation", item }
  const [deleteError, setDeleteError] = useState(null);

  async function confirmDelete() {
    setDeleteError(null);
    try {
      if (deleteTarget.type === "department") {
        await deleteDepartment.mutateAsync(deleteTarget.item.id);
      } else {
        await deleteDesignation.mutateAsync(deleteTarget.item.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Departments</h1>
        <button
          onClick={() => setFormTarget("new")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New Department
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {data?.map((dept) => (
          <div key={dept.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-start justify-between">
              <Link to={`/admin/departments/${dept.id}`} className="group">
                <p className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600">{dept.name}</p>
                <p className="text-sm text-slate-500">{dept.code}</p>
              </Link>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setFormTarget(dept)} className="text-indigo-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => setDeleteTarget({ type: "department", item: dept })} className="text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Head: {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : "Unassigned"}
            </p>
            <p className="text-sm text-slate-500">{dept._count?.employees ?? 0} employees</p>

            <button
              onClick={() => setExpandedId(expandedId === dept.id ? null : dept.id)}
              className="mt-3 text-xs font-medium text-indigo-600 hover:underline"
            >
              {expandedId === dept.id ? "Hide designations" : "Manage designations"}
            </button>
            {expandedId === dept.id && (
              <DesignationManager
                departmentId={dept.id}
                onDeleteRequest={(designation) => setDeleteTarget({ type: "designation", item: designation })}
              />
            )}
          </div>
        ))}
      </div>

      {formTarget && (
        <Modal title={formTarget === "new" ? "New Department" : "Edit Department"} onClose={() => setFormTarget(null)}>
          <DepartmentForm department={formTarget === "new" ? null : formTarget} onDone={() => setFormTarget(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title={deleteTarget.type === "department" ? "Delete department?" : "Delete designation?"}
          message={
            deleteTarget.type === "department"
              ? `Delete "${deleteTarget.item.name}"? This only works if no employees or designations reference it.`
              : `Delete "${deleteTarget.item.title}"? This only works if no employees hold this designation.`
          }
          pending={deleteDepartment.isPending || deleteDesignation.isPending}
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
