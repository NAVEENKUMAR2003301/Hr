import { useRef, useState } from "react";
import { useEmployeeDocuments, useUploadEmployeeDocument, useDeleteEmployeeDocument } from "../../api/useEmployeeDocuments";
import ConfirmModal from "../../components/ConfirmModal";
import { formatDate, getErrorMessage } from "../../lib/utils";

const DOC_TYPES = ["ID Proof", "Education Certificate", "Offer Letter", "Appointment Letter", "Other"];
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");

export default function EmployeeDocumentsTab({ employeeId }) {
  const { data: documents, isLoading } = useEmployeeDocuments(employeeId);
  const uploadDocument = useUploadEmployeeDocument(employeeId);
  const deleteDocument = useDeleteEmployeeDocument(employeeId);

  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await uploadDocument.mutateAsync({ file, docType });
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
    } finally {
      e.target.value = "";
    }
  }

  async function confirmDelete() {
    await deleteDocument.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadDocument.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploadDocument.isPending ? "Uploading…" : "Upload document"}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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
