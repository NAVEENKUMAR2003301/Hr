import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { UPLOAD_ROOT } from "../middleware/upload.js";
import { uploadDocumentBuffer, getSignedDocumentUrl, deleteDocument, isCloudinaryConfigured } from "../services/cloudinary.service.js";

// Cloudinary-stored documents get a freshly-signed, time-limited URL on every read
// (never a stored long-lived link); documents still on local disk from before the
// migration keep using the old static path.
function resolveFileUrl(document) {
  if (document.cloudinaryPublicId) {
    return getSignedDocumentUrl(document.cloudinaryPublicId, document.cloudinaryResourceType ?? "raw");
  }
  return document.fileUrl;
}

export async function index(req, res, next) {
  try {
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId: req.params.id },
      orderBy: { uploadedAt: "desc" },
    });
    res.json(documents.map((d) => ({ ...d, fileUrl: resolveFileUrl(d) })));
  } catch (err) {
    next(err);
  }
}

export async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const docType = req.body.docType?.trim();
    if (!docType) return res.status(400).json({ error: "docType is required" });

    if (!isCloudinaryConfigured()) {
      return res
        .status(503)
        .json({ error: "Document storage is not configured (missing CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET env vars)" });
    }

    const { publicId, resourceType } = await uploadDocumentBuffer(req.file.buffer, {
      employeeId: req.params.id,
      mimetype: req.file.mimetype,
    });

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: req.params.id,
        docType,
        fileName: req.file.originalname,
        fileUrl: "", // legacy field — only meaningful for pre-Cloudinary documents
        cloudinaryPublicId: publicId,
        cloudinaryResourceType: resourceType,
      },
    });
    res.status(201).json({ ...document, fileUrl: resolveFileUrl(document) });
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

    if (document.cloudinaryPublicId) {
      await deleteDocument(document.cloudinaryPublicId, document.cloudinaryResourceType ?? "raw").catch(() => {});
    } else {
      // Legacy local-disk document — best-effort; DB row is the source of truth either way.
      const filePath = path.join(UPLOAD_ROOT, req.params.id, path.basename(document.fileUrl));
      fs.unlink(filePath, () => {});
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
