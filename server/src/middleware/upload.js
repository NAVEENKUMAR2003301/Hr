import multer from "multer";
import path from "node:path";

// Still used by app.js's legacy `/uploads/employee-documents/:id/:filename` route,
// which only serves documents uploaded before the Cloudinary migration (local disk
// doesn't persist reliably on serverless hosts, so nothing new is written here).
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

// Buffered in memory, then streamed straight to Cloudinary (see documents
// controller) — never written to local disk, since that doesn't persist reliably
// on serverless hosts (e.g. Vercel) and Cloudinary is now the source of truth.
// 10MB cap keeps a single bad upload from ballooning memory/bandwidth.
export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Excel imports are parsed in memory too (small files, no need to persist the
// upload itself anywhere) — kept separate from the document storage above.
export const uploadSpreadsheet = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export { UPLOAD_ROOT };
