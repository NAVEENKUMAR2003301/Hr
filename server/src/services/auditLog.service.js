import { prisma } from "../lib/prisma.js";

// Fire-and-forget by design — an audit log write failing should never break the
// actual action it's recording (e.g. an employee update shouldn't 500 just because
// the log insert hit a transient error). Logged to the console so a persistent
// failure is still visible somewhere.
export async function recordAudit({ userId, action, entityType, entityId, summary }) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entityType, entityId, summary } });
  } catch (err) {
    console.error("Failed to record audit log:", action, err.message);
  }
}
