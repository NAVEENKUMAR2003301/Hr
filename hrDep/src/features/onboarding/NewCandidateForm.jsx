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

// Plain text fields HR fills in freely — no fixed options, matches how HR already
// tracks this in their own sheet (see server/src/validators/employee.validator.js
// pipelineFieldsSchema for the field list this mirrors).
const TEXT_FIELDS = [
  { key: "forReference", label: "For my reference" },
  { key: "designation", label: "Designation" },
  { key: "experienceLevel", label: "Fresher / Experience" },
  { key: "relevantExperience", label: "Relevant experience" },
  { key: "trainingKt", label: "Training/KT" },
  { key: "phoneNumber", label: "Mobile number" },
  { key: "trainingStipend", label: "Training on salary/stipend" },
  { key: "technicalRound", label: "Technical round" },
  { key: "hrRound", label: "HR round" },
  { key: "currentCtc", label: "Current CTC" },
  { key: "expectedCtc", label: "Expected CTC" },
  { key: "docUpdates", label: "Doc updates" },
  { key: "trainingStatus", label: "Training status" },
  { key: "liveProject", label: "Live project" },
];

const CHECKBOX_FIELDS = [
  { key: "selectionMailSent", label: "Selection mail sent" },
  { key: "offerGiven", label: "Offer letter given" },
  { key: "appointmentLetterGiven", label: "Appointment letter given" },
];

const initialForm = {
  name: "",
  email: "",
  onboardingStatus: "IN_PROGRESS",
  onboardingDate: "",
  selectionMailSent: false,
  offerGiven: false,
  appointmentLetterGiven: false,
  ...Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, ""])),
};

export default function NewCandidateForm({ onDone }) {
  const [form, setForm] = useState(initialForm);
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
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required");
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mail ID</label>
          <input className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            <input className={inputClass} value={form[key]} onChange={(e) => set(key, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Onboarding status</label>
          <select
            className={inputClass}
            value={form.onboardingStatus}
            onChange={(e) => set("onboardingStatus", e.target.value)}
          >
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Onboarding date</label>
          <input
            type="date"
            className={inputClass}
            value={form.onboardingDate}
            onChange={(e) => set("onboardingDate", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        {CHECKBOX_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
            {label}
          </label>
        ))}
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
