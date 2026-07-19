import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma.js";
import { createEmployee, updateEmployee } from "./employee.service.js";

// Single source of truth for the sheet shape — export writes these columns in this
// order, import reads them back by header name (order-independent on the way in).
const COLUMNS = [
  { header: "Employee Code", key: "employeeCode", width: 16 },
  { header: "First Name", key: "firstName", width: 16 },
  { header: "Last Name", key: "lastName", width: 16 },
  { header: "Login Email", key: "email", width: 26 },
  { header: "Role", key: "role", width: 12 },
  { header: "Personal Email", key: "personalEmail", width: 26 },
  { header: "Phone Number", key: "phoneNumber", width: 16 },
  { header: "Department Code", key: "departmentCode", width: 16 },
  { header: "Designation", key: "designationTitle", width: 20 },
  { header: "Manager Employee Code", key: "managerCode", width: 20 },
  { header: "Employment Type", key: "employmentType", width: 14 },
  { header: "Employment Status", key: "employmentStatus", width: 16 },
  { header: "Joining Date", key: "joiningDate", width: 14 },
  { header: "Onboarding Status", key: "onboardingStatus", width: 16 },
  { header: "Payment Status", key: "paymentStatus", width: 14 },
  { header: "Onboarding Target End Date", key: "targetEndDate", width: 22 },
];

function toDateOnly(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export async function exportEmployeesWorkbook() {
  const employees = await prisma.employee.findMany({
    include: {
      user: { select: { email: true, role: true } },
      department: true,
      designation: true,
      manager: true,
      onboardingProcess: true,
    },
    orderBy: { employeeCode: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Employees");
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true };

  for (const e of employees) {
    sheet.addRow({
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.user.email,
      role: e.user.role,
      personalEmail: e.personalEmail ?? "",
      phoneNumber: e.phoneNumber ?? "",
      departmentCode: e.department?.code ?? "",
      designationTitle: e.designation?.title ?? "",
      managerCode: e.manager?.employeeCode ?? "",
      employmentType: e.employmentType,
      employmentStatus: e.employmentStatus,
      joiningDate: toDateOnly(e.joiningDate),
      onboardingStatus: e.onboardingProcess?.status ?? "",
      paymentStatus: e.onboardingProcess?.paymentStatus ?? "",
      targetEndDate: toDateOnly(e.onboardingProcess?.targetEndDate),
    });
  }

  return workbook.xlsx.writeBuffer();
}

function cellText(row, key) {
  const value = row.getCell(key).value;
  if (value == null) return "";
  if (typeof value === "object" && "text" in value) return String(value.text).trim();
  return String(value).trim();
}

// Upserts by Employee Code: an existing code updates that employee (and its
// onboarding fields, if present); an unrecognized code creates a new employee.
// Every row is processed independently so one bad row doesn't block the rest —
// results report exactly what happened per row for HR to review.
export async function importEmployeesWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw Object.assign(new Error("No worksheet found in the uploaded file"), { status: 400 });

  const headerRow = sheet.getRow(1);
  const headerToKey = new Map(COLUMNS.map((c) => [c.header, c.key]));
  const colIndexToKey = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = headerToKey.get(String(cell.value).trim());
    if (key) colIndexToKey[colNumber] = key;
  });

  const [departments, designations, employeesByCode] = await Promise.all([
    prisma.department.findMany(),
    prisma.designation.findMany(),
    prisma.employee.findMany().then((rows) => new Map(rows.map((e) => [e.employeeCode, e]))),
  ]);
  const departmentByCode = new Map(departments.map((d) => [d.code, d.id]));
  const designationByTitle = new Map(designations.map((d) => [d.title, d.id]));

  const results = { created: 0, updated: 0, errors: [] };

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (row.cellCount === 0 || !row.getCell(1).value) continue;

    const record = {};
    for (const [colIndex, key] of Object.entries(colIndexToKey)) {
      record[key] = cellText(row, Number(colIndex));
    }

    try {
      if (!record.employeeCode) throw new Error("Employee Code is required");

      const departmentId = record.departmentCode ? departmentByCode.get(record.departmentCode) : undefined;
      if (record.departmentCode && !departmentId) throw new Error(`Unknown department code "${record.departmentCode}"`);

      const designationId = record.designationTitle ? designationByTitle.get(record.designationTitle) : undefined;
      if (record.designationTitle && !designationId) throw new Error(`Unknown designation "${record.designationTitle}"`);

      const managerId = record.managerCode ? employeesByCode.get(record.managerCode)?.id : undefined;
      if (record.managerCode && !managerId) throw new Error(`Unknown manager employee code "${record.managerCode}"`);

      const existing = employeesByCode.get(record.employeeCode);

      const employeeData = {
        firstName: record.firstName || undefined,
        lastName: record.lastName || undefined,
        personalEmail: record.personalEmail || "",
        phoneNumber: record.phoneNumber || undefined,
        departmentId: departmentId ?? "",
        designationId: designationId ?? "",
        managerId: managerId ?? "",
        employmentType: record.employmentType || undefined,
        // The service layer normally sits behind the Zod schemas (z.coerce.date()) that
        // the HTTP routes use — calling it directly here, a plain "YYYY-MM-DD" string
        // from the sheet must be turned into a real Date ourselves, or Prisma rejects
        // it as an incomplete ISO-8601 DateTime.
        joiningDate: record.joiningDate ? new Date(record.joiningDate) : undefined,
      };

      if (existing) {
        await updateEmployee(existing.id, employeeData);

        if (record.paymentStatus || record.targetEndDate) {
          await prisma.onboardingProcess.updateMany({
            where: { employeeId: existing.id },
            data: {
              paymentStatus: record.paymentStatus === "PAID" ? "PAID" : record.paymentStatus === "PENDING" ? "PENDING" : undefined,
              targetEndDate: record.targetEndDate ? new Date(record.targetEndDate) : undefined,
            },
          });
        }
        results.updated += 1;
      } else {
        if (!record.firstName || !record.lastName || !record.email) {
          throw new Error("New employees require First Name, Last Name, and Login Email");
        }
        await createEmployee({
          ...employeeData,
          employeeCode: record.employeeCode,
          email: record.email,
          role: ["ADMIN", "MANAGER", "EMPLOYEE"].includes(record.role) ? record.role : "EMPLOYEE",
        });
        results.created += 1;
      }
    } catch (err) {
      results.errors.push({ row: rowNumber, employeeCode: record.employeeCode || "(blank)", message: err.message });
    }
  }

  return results;
}
