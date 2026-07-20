import { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import { formatDate, getErrorMessage, resolveDocumentUrl } from "../../lib/utils";
import { useEmployeeDocuments, useUploadEmployeeDocument, useDeleteEmployeeDocument } from "../../api/useEmployeeDocuments";
import { useUpdateEmployee } from "../../api/useEmployees";
import { useDepartments } from "../../api/useOrg";
import { useUpdateOnboardingPipeline } from "../../api/useOnboarding";

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
            href={resolveDocumentUrl(existing.fileUrl)}
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

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"];

function candidateInfoFormFromEmployee(employee) {
  return {
    employeeCode: employee.employeeCode ?? "",
    phoneNumber: employee.phoneNumber ?? "",
    personalEmail: employee.personalEmail ?? "",
    address: employee.address ?? "",
    departmentId: employee.departmentId ?? "",
    employmentType: employee.employmentType,
    joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : "",
  };
}

// Editable "Candidate info" section — Read+Update half of CRUD on the basics
// (Employee code, contact details, department, employment type, joining date).
// Designation isn't editable here (it needs a department-scoped picker not used
// anywhere else in this app yet) — still shown read-only below.
function CandidateInfoSection({ employee }) {
  const updateEmployee = useUpdateEmployee(employee.id);
  const { data: departments } = useDepartments();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => candidateInfoFormFromEmployee(employee));
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEditing() {
    setForm(candidateInfoFormFromEmployee(employee));
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setError(null);
    try {
      await updateEmployee.mutateAsync(form);
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save"));
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Candidate info</p>
          <button onClick={startEditing} className="text-xs font-medium text-indigo-600 hover:underline">
            Edit
          </button>
        </div>
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
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Candidate info</p>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Employee code</label>
            <input className={inputClass} value={form.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Phone number</label>
            <input className={inputClass} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Email</label>
            <input className={inputClass} value={form.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Address</label>
            <input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Department</label>
            <select className={inputClass} value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
              <option value="">— Unassigned —</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Employment type</label>
            <select className={inputClass} value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Joining date</label>
            <input type="date" className={inputClass} value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateEmployee.isPending}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateEmployee.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Same field list as NewCandidateForm.jsx's TEXT_FIELDS, minus phoneNumber (that's
// an Employee field, edited from the Employee profile, not the pipeline here).
const PIPELINE_TEXT_FIELDS = [
  { key: "forReference", label: "For my reference" },
  { key: "designation", label: "Designation" },
  { key: "experienceLevel", label: "Fresher / Experience" },
  { key: "relevantExperience", label: "Relevant experience" },
  { key: "trainingKt", label: "Training/KT" },
  { key: "trainingStipend", label: "Training on salary/stipend" },
  { key: "technicalRound", label: "Technical round" },
  { key: "hrRound", label: "HR round" },
  { key: "currentCtc", label: "Current CTC" },
  { key: "expectedCtc", label: "Expected CTC" },
  { key: "docUpdates", label: "Doc updates" },
  { key: "trainingStatus", label: "Training status" },
  { key: "liveProject", label: "Live project" },
];

const PIPELINE_CHECKBOX_FIELDS = [
  { key: "selectionMailSent", label: "Selection mail sent" },
  { key: "offerGiven", label: "Offer letter given" },
  { key: "appointmentLetterGiven", label: "Appointment letter given" },
];

function pipelineFormFromProcess(process) {
  return {
    onboardingStatus: process.status,
    onboardingDate: process.startDate ? process.startDate.slice(0, 10) : "",
    selectionMailSent: process.selectionMailSent,
    offerGiven: Boolean(process.offerLetterSentAt),
    appointmentLetterGiven: Boolean(process.appointmentLetterSentAt),
    ...Object.fromEntries(PIPELINE_TEXT_FIELDS.map((f) => [f.key, process[f.key] ?? ""])),
  };
}

// Editable recruitment-pipeline section — same fields as the New Candidate intake
// form, but readable/updatable afterward (Create happens on intake; this is the
// Read+Update half of that CRUD; Delete is the existing "Delete" on the tracker card).
function PipelineSection({ process }) {
  const updatePipeline = useUpdateOnboardingPipeline();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => pipelineFormFromProcess(process));
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEditing() {
    setForm(pipelineFormFromProcess(process));
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setError(null);
    try {
      await updatePipeline.mutateAsync({ processId: process.id, ...form });
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save"));
    }
  }

  if (!editing) {
    return (
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Recruitment pipeline</p>
          <button onClick={startEditing} className="text-xs font-medium text-indigo-600 hover:underline">
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
          <Field label="Onboarding status" value={process.status === "COMPLETED" ? "Completed" : "In progress"} />
          <Field label="Onboarding date" value={formatDate(process.startDate)} />
          {PIPELINE_TEXT_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label} value={process[key]} />
          ))}
          {PIPELINE_CHECKBOX_FIELDS.map(({ key, label }) => (
            <Check
              key={key}
              label={label}
              checked={key === "offerGiven" ? Boolean(process.offerLetterSentAt) : key === "appointmentLetterGiven" ? Boolean(process.appointmentLetterSentAt) : process[key]}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recruitment pipeline</p>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Onboarding status</label>
            <select className={inputClass} value={form.onboardingStatus} onChange={(e) => set("onboardingStatus", e.target.value)}>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Onboarding date</label>
            <input
              type="date"
              className={inputClass}
              value={form.onboardingDate}
              onChange={(e) => set("onboardingDate", e.target.value)}
            />
          </div>
          {PIPELINE_TEXT_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-slate-500">{label}</label>
              <input className={inputClass} value={form[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          {PIPELINE_CHECKBOX_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updatePipeline.isPending}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {updatePipeline.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Check({ label, checked }) {
  return (
    <p className="flex items-center gap-1.5 text-sm">
      <span className={checked ? "text-emerald-600" : "text-slate-300 dark:text-slate-700"}>{checked ? "✓" : "✕"}</span>
      <span className={checked ? "text-slate-900 dark:text-slate-50" : "text-slate-400"}>{label}</span>
    </p>
  );
}

// Candidate info + every document collected during onboarding, together in one
// view — the point being HR shouldn't have to leave the Onboarding page and hunt
// through the Employee detail page's separate tabs to see both at once. Full CRUD
// on documents right here too: upload a missing one, replace an existing one, or
// delete it — no separate trip to the Documents tab required.
export default function CandidateDetailsModal({ employee, process, onClose }) {
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
        <CandidateInfoSection employee={employee} />

        {process && <PipelineSection process={process} />}

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
            Employee info →
          </Link>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
