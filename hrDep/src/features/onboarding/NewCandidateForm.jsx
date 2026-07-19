import { useState } from "react";
import { getErrorMessage } from "../../lib/utils";
import { useCreateCandidate } from "../../api/useEmployees";
import { useUploadEmployeeDocument } from "../../api/useEmployeeDocuments";

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

// docType key must match what's sent to the upload endpoint; `required` just drives
// the UI hint — nothing here is enforced server-side, so HR can still finish the
// intake and add a missing document later from the employee's own Documents tab.
const DOCUMENT_SLOTS = [
  { key: "Aadhaar Card", label: "Aadhaar Card", required: true },
  { key: "PAN Card", label: "PAN Card (optional)", required: false },
  { key: "10th Marksheet", label: "10th Marksheet", required: true },
  { key: "12th Marksheet", label: "12th Marksheet", required: true },
  { key: "College Marksheet", label: "College Marksheet", required: true },
];

function DocumentUploadRow({ employeeId, slot, uploaded, onUploaded }) {
  const upload = useUploadEmployeeDocument(employeeId);
  const [error, setError] = useState(null);

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await upload.mutateAsync({ file, docType: slot.key });
      onUploaded(slot.key);
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"));
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-sm">
        {slot.label}
        {uploaded && <span className="ml-2 text-xs text-emerald-600">✓ Uploaded</span>}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={handleChange}
          disabled={upload.isPending}
          className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700"
        />
      </div>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function NewCandidateForm({ onDone }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "", address: "" });
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null); // { employee, temporaryPassword }
  const [uploadedDocs, setUploadedDocs] = useState(new Set());
  const createCandidate = useCreateCandidate();

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phoneNumber.trim() || !form.email.trim()) {
      setError("Name, phone number, and email are required");
      return;
    }
    try {
      const result = await createCandidate.mutateAsync(form);
      setCreated(result);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create candidate"));
    }
  }

  function markUploaded(key) {
    setUploadedDocs((prev) => new Set(prev).add(key));
  }

  if (created) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-500/10 p-4 space-y-2">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            {created.employee.firstName} {created.employee.lastName} added — onboarding started
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Temporary login credentials (share out-of-band — shown once):
          </p>
          <div className="rounded-lg bg-white dark:bg-slate-900 p-3 text-sm font-mono">
            <p>{created.employee.personalEmail}</p>
            <p>{created.temporaryPassword}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Documents</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {DOCUMENT_SLOTS.map((slot) => (
              <DocumentUploadRow
                key={slot.key}
                employeeId={created.employee.id}
                slot={slot}
                uploaded={uploadedDocs.has(slot.key)}
                onUploaded={markUploaded}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onDone}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First name</label>
          <input className={inputClass} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last name</label>
          <input className={inputClass} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone number</label>
        <input className={inputClass} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
        <textarea rows={2} className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={createCandidate.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {createCandidate.isPending ? "Creating…" : "Create candidate"}
        </button>
      </div>
    </form>
  );
}
