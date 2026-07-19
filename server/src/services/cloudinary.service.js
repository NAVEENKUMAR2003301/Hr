import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

// Images go through Cloudinary's "image" pipeline (thumbnails, transforms); PDFs/
// Word docs use "raw" — Cloudinary would otherwise try to rasterize them as images.
function resourceTypeFor(mimetype) {
  return mimetype.startsWith("image/") ? "image" : "raw";
}

// Employee documents are PII (ID proofs, etc.) — uploaded with type "authenticated"
// so the file is never reachable by a bare public URL, only via a signed URL we
// generate on demand (see getSignedDocumentUrl), gated by the same ownership check
// as the rest of the employee record.
export async function uploadDocumentBuffer(buffer, { employeeId, mimetype }) {
  const resourceType = resourceTypeFor(mimetype);
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `employee-documents/${employeeId}`, resource_type: resourceType, type: "authenticated" },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });
  return { publicId: result.public_id, resourceType: result.resource_type };
}

// Signed URLs are time-limited (1 hour) — generated fresh every time the document
// list is requested, rather than stored, so access always re-checks the caller's
// ownership/auth at request time instead of a long-lived link floating around.
export function getSignedDocumentUrl(publicId, resourceType) {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });
}

export async function deleteDocument(publicId, resourceType) {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: "authenticated" });
}
