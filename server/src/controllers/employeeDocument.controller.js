import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { UPLOAD_ROOT } from "../middleware/upload.js";

export async function index(req, res, next) {
  try {
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId: req.params.id },
      orderBy: { uploadedAt: "desc" },
    });
    res.json(documents);
  } catch (err) {
    next(err);
  }
}

export async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const docType = req.body.docType?.trim();
    if (!docType) return res.status(400).json({ error: "docType is required" });

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: req.params.id,
        docType,
        fileName: req.file.originalname,
        fileUrl: `/uploads/employee-documents/${req.params.id}/${req.file.filename}`,
      },
    });
    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const document = await prisma.employeeDocument.findUnique({ where: { id: req.params.docId } });
    if (!document || document.employeeId !== req.params.id) {
      return res.status(404).json({ error: "Document not found" });
    }

    await prisma.employeeDocument.delete({ where: { id: document.id } });

    const filePath = path.join(UPLOAD_ROOT, req.params.id, path.basename(document.fileUrl));
    fs.unlink(filePath, () => {}); // best-effort; DB row is the source of truth either way

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
