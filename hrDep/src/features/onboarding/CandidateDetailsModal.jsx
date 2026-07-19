import { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import { formatDate, getErrorMessage } from "../../lib/utils";
import { useEmployeeDocuments, useUploadEmployeeDocument, useDeleteEmployeeDocument } from "../../api/useEmployeeDocuments";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");

// Same slots offered on the New Candidate intake form — kept in this fixed order
// so a slot without a document yet still shows an Upload control, not just a gap.
const DOCUMENT_SLOTS = ["Aadhaar Card", "PAN Card", "10th Marksheet", "12th Marksheet", "College Marksheet"];

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900 dark:text-slate-50">{value ?? "—"}</p>
    </div>
  );
}

function DocumentSlotRow({ employeeId, docType, existing }) {
  const upload = useUploadEmployeeDocument(employeeId);
  const remove = useDeleteEmployeeDocument(employeeId);
  const [error, setError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // "Replace" is delete-then-upload under the hood — from HR's side it's just
  // picking a new file for a slot that already has one, same control either way.
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      if (existing) await remove.mutateAsync(existing.id);
      await upload.mutateAsync({ file, docType });
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
    } finally {
      e.target.value = "";
    }
  }

  async function confirmDelete() {
    setError(null);
    try {
      await remove.mutateAsync(existing.id);
      setConfirmingDelete(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete"));
      setConfirmingDelete(false);
    }
  }

  const busy = upload.isPending || remove.isPending;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-50">{docType}</p>
        {existing ? (
          <a
            href={`${API_ORIGIN}${existing.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:underline"
          >
            {existing.fileName} · Uploaded {formatDate(existing.uploadedAt)}
          </a>
        ) : (
          <p className="text-xs text-slate-400">Not uploaded yet</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <label className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50">
          {busy ? "Working…" : existing ? "Replace" : "Upload"}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={handleFileChange}
            disabled={busy}
            className="hidden"
          />
        </label>
        {existing && (
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
            className="text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="Delete this document?"
          message={`Delete the uploaded ${docType} (${existing?.fileName})? This can't be undone.`}
          pending={remove.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDelete}
        />
      )}
    </li>
  );
}

// Candidate info + every document collected during onboarding, together in one
// view — the point being HR shouldn't have to leave the Onboarding page and hunt
// through the Employee detail page's separate tabs to see both at once. Full CRUD
// on documents right here too: upload a missing one, replace an existing one, or
// delete it — no separate trip to the Documents tab required.
export default function CandidateDetailsModal({ employee, onClose }) {
  const { data: documents, isLoading } = useEmployeeDocuments(employee.id);

  // Documents are already sorted newest-first by the API — keep only the first
  // (newest) one seen per slot, in case a slot somehow ends up with more than one.
  const byDocType = new Map();
  for (const doc of documents ?? []) {
    if (!byDocType.has(doc.docType)) byDocType.set(doc.docType, doc);
  }
  const otherDocuments = (documents ?? []).filter((doc) => !DOCUMENT_SLOTS.includes(doc.docType));

  return (
    <Modal title={`${employee.firstName} ${employee.lastName}`} onClose={onClose} maxWidthClassName="max-w-2xl">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Candidate info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
            <Field label="Employee code" value={employee.employeeCode} />
            <Field label="Phone number" value={employee.phoneNumber} />
            <Field label="Email" value={employee.personalEmail} />
            <Field label="Address" value={employee.address} />
            <Field label="Department" value={employee.department?.name} />
            <Field label="Designation" value={employee.designation?.title} />
            <Field label="Employment type" value={employee.employmentType} />
            <Field label="Joining date" value={formatDate(employee.joiningDate)} />
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Documents</p>
          {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
          {!isLoading && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              {DOCUMENT_SLOTS.map((docType) => (
                <DocumentSlotRow key={docType} employeeId={employee.id} docType={docType} existing={byDocType.get(docType)} />
              ))}
              {otherDocuments.map((doc) => (
                <DocumentSlotRow key={doc.id} employeeId={employee.id} docType={doc.docType} existing={doc} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Link to={`/admin/employees/${employee.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            Open full profile (leave history, performance, edit) →
          </Link>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
