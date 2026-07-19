import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const UPLOAD_ROOT = path.resolve("uploads", "employee-documents");

// Documents are things like ID proofs and certificates — there's no reason for an
// upload here to ever be HTML/SVG/script-capable content. Without this allow-list,
// an uploaded .html file gets served back with a text/html content-type (browsers
// render it, including any embedded <script>) to anyone with view access to that
// employee's documents — a stored-XSS path via a feature meant for static files.
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]);

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(Object.assign(new Error("Unsupported file type — allowed: PDF, JPG, PNG, WEBP, DOC, DOCX"), { status: 400 }));
  }
  cb(null, true);
}

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
export const uploadDocument = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Excel imports are parsed in memory (small files, no need to persist the upload
// itself to disk) — kept separate from the document storage above.
export const uploadSpreadsheet = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export { UPLOAD_ROOT };
