import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const UPLOAD_ROOT = path.resolve("uploads", "employee-documents");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_ROOT, req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

// 10MB cap keeps a single bad upload from filling local disk — this is the "zero-cost"
// local filesystem storage from the blueprint, not cloud storage, so space is finite.
export const uploadDocument = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Excel imports are parsed in memory (small files, no need to persist the upload
// itself to disk) — kept separate from the document storage above.
export const uploadSpreadsheet = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export { UPLOAD_ROOT };
