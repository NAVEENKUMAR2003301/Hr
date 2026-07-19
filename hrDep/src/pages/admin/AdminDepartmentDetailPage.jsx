import { Link, useParams } from "react-router-dom";
import { useDepartment } from "../../api/useOrg";
import { useEmployees } from "../../api/useEmployees";
import { formatDate } from "../../lib/utils";

export default function AdminDepartmentDetailPage() {
  const { id } = useParams();
  const { data: department, isLoading } = useDepartment(id);
  const { data: employees, isLoading: employeesLoading } = useEmployees({ departmentId: id, page: 1, pageSize: 50 });

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!department) return <p className="text-slate-400">Department not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{department.name}</h1>
          <p className="text-sm text-slate-500">{department.code}</p>
        </div>
        <Link to="/admin/departments" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Back to departments
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Department head</p>
          <p className="font-medium text-slate-900 dark:text-slate-50">
            {department.head ? `${department.head.firstName} ${department.head.lastName}` : "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Employees</p>
          <p className="font-medium text-slate-900 dark:text-slate-50">{department._count?.employees ?? 0}</p>
        </div>
        <div>
          <p className="text-slate-500">Designations</p>
          <p className="font-medium text-slate-900 dark:text-slate-50">
            {department.designations?.length ? department.designations.map((d) => d.title).join(", ") : "None"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">Employees in this department</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {employeesLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td>
                </tr>
              )}
              {!employeesLoading && employees?.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No employees in this department yet.</td>
                </tr>
              )}
              {employees?.items.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-3 text-slate-500">{emp.employeeCode}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/employees/${emp.id}`} className="font-medium text-slate-900 dark:text-slate-50 hover:text-indigo-600">
                      {emp.firstName} {emp.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{emp.designation?.title ?? "—"}</td>
                  <td className="px-4 py-3">{emp.employmentStatus}</td>
                  <td className="px-4 py-3">{formatDate(emp.joiningDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
