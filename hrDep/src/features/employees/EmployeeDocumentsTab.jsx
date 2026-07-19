import { useRef, useState } from "react";
import { useEmployeeDocuments, useUploadEmployeeDocument, useDeleteEmployeeDocument } from "../../api/useEmployeeDocuments";
import ConfirmModal from "../../components/ConfirmModal";
import Modal from "../../components/Modal";
import { formatDate, getErrorMessage } from "../../lib/utils";

const DOC_TYPES = ["ID Proof", "Education Certificate", "Offer Letter", "Appointment Letter", "Other"];
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");

function NewDocumentModal({ employee, onClose, onUpload, uploading, error }) {
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    onUpload({ file, docType });
  }

  return (
    <Modal title="New Document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Name</p>
            <p className="font-medium text-slate-900 dark:text-slate-50">
              {employee.firstName} {employee.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Employee ID</p>
            <p className="font-medium text-slate-900 dark:text-slate-50">{employee.employeeCode}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Role</p>
            <p className="font-medium text-slate-900 dark:text-slate-50">{employee.user?.role ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Department</p>
            <p className="font-medium text-slate-900 dark:text-slate-50">{employee.department?.name ?? "—"}</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Document type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || uploading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployeeDocumentsTab({ employeeId, employee }) {
  const { data: documents, isLoading } = useEmployeeDocuments(employeeId);
  const uploadDocument = useUploadEmployeeDocument(employeeId);
  const deleteDocument = useDeleteEmployeeDocument(employeeId);

  const [showNewDocument, setShowNewDocument] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function handleUpload({ file, docType }) {
    setError(null);
    try {
      await uploadDocument.mutateAsync({ file, docType });
      setShowNewDocument(false);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
    }
  }

  async function confirmDelete() {
    await deleteDocument.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-50">Documents</h3>
        <button
          type="button"
          onClick={() => setShowNewDocument(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New Document
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {!isLoading && documents?.length === 0 && <p className="text-sm text-slate-400">No documents uploaded yet.</p>}

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {documents?.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <a
                href={`${API_ORIGIN}${doc.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-indigo-600 hover:underline"
              >
                {doc.fileName}
              </a>
              <p className="text-xs text-slate-500">
                {doc.docType} · Uploaded {formatDate(doc.uploadedAt)}
              </p>
            </div>
            <button onClick={() => setDeleteTarget(doc)} className="text-xs text-red-500 hover:underline">
              Delete
            </button>
          </li>
        ))}
      </ul>

      {showNewDocument && (
        <NewDocumentModal
          employee={employee}
          onClose={() => {
            setShowNewDocument(false);
            setError(null);
          }}
          onUpload={handleUpload}
          uploading={uploadDocument.isPending}
          error={error}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete document?"
          message={`Delete "${deleteTarget.fileName}"? This can't be undone.`}
          pending={deleteDocument.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
