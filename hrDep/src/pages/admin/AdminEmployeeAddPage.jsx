import EmployeeForm from "../../features/employees/EmployeeForm";

export default function AdminEmployeeAddPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Add Employee</h1>
      <EmployeeForm mode="create" />
    </div>
  );
}
