import {
  exportEmployeesWorkbook,
  importEmployeesWorkbook,
  exportCandidatesWorkbook,
  importCandidatesWorkbook,
} from "../services/excelImportExport.service.js";

export async function exportEmployees(req, res, next) {
  try {
    const buffer = await exportEmployeesWorkbook();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}

export async function importEmployees(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const results = await importEmployeesWorkbook(req.file.buffer);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

// Also serves as the downloadable template — export with zero candidates yet is
// just the header row.
export async function exportCandidates(req, res, next) {
  try {
    const buffer = await exportCandidatesWorkbook();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="candidates-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}

export async function importCandidates(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const results = await importCandidatesWorkbook(req.file.buffer);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
