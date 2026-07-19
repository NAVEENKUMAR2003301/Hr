import { useParams } from "react-router-dom";
import { useEmployee } from "../../api/useEmployees";
import EmployeeForm from "../../features/employees/EmployeeForm";

function toDateInput(value) {
  return value ? value.slice(0, 10) : "";
}

export default function AdminEmployeeEditPage() {
  const { id } = useParams();
  const { data: employee, isLoading } = useEmployee(id);

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!employee) return <p className="text-slate-400">Employee not found.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        Edit {employee.firstName} {employee.lastName}
      </h1>
      <EmployeeForm
        mode="edit"
        employeeId={id}
        managerLabel={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : ""}
        initialData={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          dateOfBirth: toDateInput(employee.dateOfBirth),
          personalEmail: employee.personalEmail ?? "",
          phoneNumber: employee.phoneNumber ?? "",
          address: employee.address ?? "",
          emergencyContactName: employee.emergencyContactName ?? "",
          emergencyContactNumber: employee.emergencyContactNumber ?? "",
          employeeCode: employee.employeeCode,
          departmentId: employee.departmentId ?? "",
          designationId: employee.designationId ?? "",
          managerId: employee.managerId ?? "",
          employmentType: employee.employmentType,
          joiningDate: toDateInput(employee.joiningDate),
          email: employee.user?.email ?? "",
          role: employee.user?.role ?? "EMPLOYEE",
        }}
      />
    </div>
  );
}
