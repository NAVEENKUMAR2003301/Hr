import { getErrorMessage } from "../../lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { personalInfoSchema, employmentInfoSchema, roleAccessSchema } from "../../lib/schemas";
import { useDepartments, useDesignations } from "../../api/useOrg";
import { useCreateEmployee, useUpdateEmployee, useNextEmployeeCode } from "../../api/useEmployees";
import ManagerPicker from "./ManagerPicker";

const STEPS = ["Personal Info", "Employment Info", "Role & Access"];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  personalEmail: "",
  phoneNumber: "",
  address: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  employeeCode: "",
  departmentId: "",
  designationId: "",
  managerId: "",
  employmentType: "FULL_TIME",
  joiningDate: "",
  email: "",
  role: "EMPLOYEE",
};

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function EmployeeForm({ mode = "create", employeeId, initialData, managerLabel }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const stepList = STEPS;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialData });
  const [selectedManagerLabel, setSelectedManagerLabel] = useState(managerLabel ?? "");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations(form.departmentId);
  const { data: nextCode } = useNextEmployeeCode(!isEdit);

  // Adjusting state during render (not in an effect) per React's recommended pattern
  // for "state that depends on a prop/query result" — avoids the extra render pass
  // an effect-based setState would cause. `appliedCode` guards against re-applying
  // once the user has started editing (or cleared) the suggested code.
  const [appliedCode, setAppliedCode] = useState(null);
  if (!isEdit && nextCode?.employeeCode && appliedCode !== nextCode.employeeCode && !form.employeeCode) {
    setAppliedCode(nextCode.employeeCode);
    setForm((f) => ({ ...f, employeeCode: nextCode.employeeCode }));
  }

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee(employeeId);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateStep(index) {
    const schema = [personalInfoSchema, employmentInfoSchema, roleAccessSchema][index];
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0]] = issue.message;
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, stepList.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep(step)) return;
    setServerError(null);

    try {
      if (isEdit) {
        await updateEmployee.mutateAsync(form);
        navigate(`/admin/employees/${employeeId}`);
      } else {
        const result = await createEmployee.mutateAsync(form);
        setCreatedCredentials({ email: form.email, temporaryPassword: result.temporaryPassword });
      }
    } catch (err) {
      setServerError(getErrorMessage(err, "Something went wrong. Please check the form and try again."));
    }
  }

  if (createdCredentials) {
    return (
      <div className="max-w-lg rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-500/10 p-6 space-y-3">
        <p className="font-semibold text-emerald-800 dark:text-emerald-300">Employee created</p>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Onboarding checklist was auto-generated. Share these temporary credentials out-of-band — they won't be shown again:
        </p>
        <div className="rounded-lg bg-white dark:bg-slate-900 p-3 text-sm font-mono">
          <p>{createdCredentials.email}</p>
          <p>{createdCredentials.temporaryPassword}</p>
        </div>
        <button
          onClick={() => navigate("/admin/employees")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to employees
        </button>
      </div>
    );
  }

  const isSubmitting = createEmployee.isPending || updateEmployee.isPending;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
        {stepList.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
              i === step
                ? "bg-indigo-600 text-white"
                : i < step
                ? "text-indigo-600 dark:text-indigo-300"
                : "text-slate-400"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" error={errors.firstName}>
                <input className={inputClass} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </Field>
              <Field label="Last name" error={errors.lastName}>
                <input className={inputClass} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </Field>
            </div>
            <Field label="Date of birth" error={errors.dateOfBirth}>
              <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </Field>
            <Field label="Personal email" error={errors.personalEmail}>
              <input className={inputClass} value={form.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />
            </Field>
            <Field label="Phone number" error={errors.phoneNumber}>
              <input className={inputClass} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
            </Field>
            <Field label="Address" error={errors.address}>
              <textarea rows={2} className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Emergency contact name" error={errors.emergencyContactName}>
                <input className={inputClass} value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
              </Field>
              <Field label="Emergency contact number" error={errors.emergencyContactNumber}>
                <input className={inputClass} value={form.emergencyContactNumber} onChange={(e) => set("emergencyContactNumber", e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Employee code" error={errors.employeeCode}>
              <input className={inputClass} value={form.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} />
            </Field>
            <Field label="Department" error={errors.departmentId}>
              <select
                className={inputClass}
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, designationId: "" }))}
              >
                <option value="">— Unassigned —</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Designation" error={errors.designationId}>
              <select
                className={inputClass}
                value={form.designationId}
                onChange={(e) => set("designationId", e.target.value)}
                disabled={!form.departmentId}
              >
                <option value="">— None —</option>
                {designations?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Manager" error={errors.managerId}>
              <ManagerPicker
                value={form.managerId}
                selectedLabel={selectedManagerLabel}
                onChange={(emp) => {
                  set("managerId", emp?.id ?? "");
                  setSelectedManagerLabel(emp ? `${emp.firstName} ${emp.lastName}` : "");
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employment type" error={errors.employmentType}>
                <select className={inputClass} value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
                  {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"].map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Joining date" error={errors.joiningDate}>
                <input type="date" className={inputClass} value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Login email" error={errors.email}>
              <input
                className={`${inputClass} ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                value={form.email}
                disabled={isEdit}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            {isEdit && <p className="text-xs text-slate-500 -mt-2">Login email can't be changed here.</p>}
            <Field label="Role" error={errors.role}>
              <select className={inputClass} value={form.role} onChange={(e) => set("role", e.target.value)}>
                {["EMPLOYEE", "MANAGER", "ADMIN"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            {!isEdit && (
              <p className="text-xs text-slate-500">
                A temporary password is generated on creation and shown once — there's no email delivery yet.
              </p>
            )}
          </>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-0"
        >
          Back
        </button>

        {step < stepList.length - 1 ? (
          <button
            key="next"
            type="button"
            onClick={next}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Next
          </button>
        ) : (
          <button
            key="submit"
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create employee"}
          </button>
        )}
      </div>
    </form>
  );
}
