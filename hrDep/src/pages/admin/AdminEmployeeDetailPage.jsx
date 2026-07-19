import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEmployee, useDeactivateEmployee } from "../../api/useEmployees";
import { formatDate, getErrorMessage } from "../../lib/utils";
import ConfirmModal from "../../components/ConfirmModal";
import EmployeeDocumentsTab from "../../features/employees/EmployeeDocumentsTab";

const TABS = ["Overview", "Documents", "Leave History", "Onboarding", "Performance"];

function Field({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="font-medium text-slate-900 dark:text-slate-50">{value ?? "—"}</p>
    </div>
  );
}

function OverviewTab({ employee }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <Field label="Employee code" value={employee.employeeCode} />
      <Field label="Login email" value={employee.user?.email} />
      <Field label="Role" value={employee.user?.role} />
      <Field label="Department" value={employee.department?.name} />
      <Field label="Department role" value={employee.department?.role} />
      <Field label="Designation" value={employee.designation?.title} />
      <Field label="Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"} />
      <Field label="Employment type" value={employee.employmentType} />
      <Field label="Employment status" value={employee.employmentStatus} />
      <Field label="Joined" value={formatDate(employee.joiningDate)} />
      <Field label="Phone" value={employee.phoneNumber} />
      <Field label="Personal email" value={employee.personalEmail} />
      <Field label="Address" value={employee.address} />
      <Field label="Emergency contact" value={employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactNumber})` : "—"} />
    </div>
  );
}

function LeaveHistoryTab({ employee }) {
  if (employee.leaveRequests.length === 0) return <p className="text-slate-400">No leave requests.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Dates</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {employee.leaveRequests.map((req) => (
            <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
              <td className="py-2">{req.leavePolicy?.leaveType}</td>
              <td className="py-2">
                {formatDate(req.startDate)} – {formatDate(req.endDate)}
              </td>
              <td className="py-2">{req.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OnboardingTab({ employee }) {
  const process = employee.onboardingProcess;
  if (!process) return <p className="text-slate-400">No onboarding process.</p>;
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">Status: {process.status}</p>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {process.taskItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2 text-sm">
            <span>{item.template.taskName}</span>
            <span className={item.status === "COMPLETED" ? "text-emerald-600" : "text-slate-400"}>{item.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PerformanceTab({ employee }) {
  if (employee.reviewsAsEmployee.length === 0) return <p className="text-slate-400">No reviews.</p>;
  return (
    <div className="space-y-3">
      {employee.reviewsAsEmployee.map((review) => (
        <div key={review.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm">
          <div className="flex justify-between">
            <p className="font-medium">{review.cycle.name}</p>
            <p className="text-slate-500">{review.status}</p>
          </div>
          {review.ratings.length > 0 && (
            <ul className="mt-2 space-y-1 text-slate-500">
              {review.ratings.map((r) => (
                <li key={r.id}>
                  {r.category.name}: self {r.selfRating ?? "—"} / manager {r.managerRating ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminEmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id);
  const [tab, setTab] = useState(TABS[0]);
  const [deleteError, setDeleteError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deactivateEmployee = useDeactivateEmployee();

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!employee) return <p className="text-slate-400">Employee not found.</p>;

  async function handleDelete() {
    setDeleteError(null);
    try {
      await deactivateEmployee.mutateAsync(id);
      navigate("/admin/employees");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to deactivate employee"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-slate-500">{employee.employeeCode}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/admin/employees/${id}/edit`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Edit
          </Link>
          {employee.employmentStatus !== "TERMINATED" && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg border border-red-300 dark:border-red-900 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex w-fit gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        {tab === "Overview" && <OverviewTab employee={employee} />}
        {tab === "Documents" && <EmployeeDocumentsTab employeeId={id} employee={employee} />}
        {tab === "Leave History" && <LeaveHistoryTab employee={employee} />}
        {tab === "Onboarding" && <OnboardingTab employee={employee} />}
        {tab === "Performance" && <PerformanceTab employee={employee} />}
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="Delete employee?"
          message={`Deactivate ${employee.firstName} ${employee.lastName}? Their login will be disabled and status set to TERMINATED — leave/onboarding/review history is kept, not erased.`}
          pending={deactivateEmployee.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      )}
      {deleteError && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-red-600 text-white text-sm px-4 py-2 shadow-lg">{deleteError}</div>
      )}
    </div>
  );
}
