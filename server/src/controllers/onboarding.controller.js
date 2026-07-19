import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../services/email.service.js";
import { offerLetterEmail, appointmentLetterEmail, wrapPlainTextLetter } from "../services/emailTemplates.js";
import { recordAudit } from "../services/auditLog.service.js";

export async function listProcesses(req, res, next) {
  try {
    const processes = await prisma.onboardingProcess.findMany({
      include: {
        employee: { include: { department: true, designation: true } },
        taskItems: { include: { template: true } },
      },
      orderBy: { startDate: "desc" },
    });
    res.json(processes);
  } catch (err) {
    next(err);
  }
}

export async function myProcess(req, res, next) {
  try {
    const process = await prisma.onboardingProcess.findUnique({
      where: { employeeId: req.user.employeeId },
      include: { taskItems: { include: { template: true } } },
    });
    if (!process) return res.status(404).json({ error: "No onboarding process found" });
    res.json(process);
  } catch (err) {
    next(err);
  }
}

const dateFieldsSchema = z.object({
  startDate: z.coerce.date().optional(),
  targetEndDate: z.coerce.date().optional(),
});

// HR sets/edits onboarding start & target dates directly — these shift month to month
// per hire, there's no fixed schedule to default to.
export async function updateDates(req, res, next) {
  try {
    const data = dateFieldsSchema.parse(req.body);
    const process = await prisma.onboardingProcess.update({ where: { id: req.params.processId }, data });
    res.json(process);
  } catch (err) {
    next(err);
  }
}

// Payment is the final onboarding milestone in this app's flow (it's also what
// unlocks sending the appointment letter) — so marking it paid marks the whole
// onboarding process done, and un-marking it (HR correcting a mistake) reopens it.
export async function setPaymentStatus(req, res, next) {
  try {
    const { paid } = z.object({ paid: z.boolean() }).parse(req.body);
    const process = await prisma.onboardingProcess.update({
      where: { id: req.params.processId },
      data: { paymentStatus: paid ? "PAID" : "PENDING", status: paid ? "COMPLETED" : "IN_PROGRESS" },
      include: { employee: true },
    });
    await recordAudit({
      userId: req.user.id,
      action: "onboarding.payment",
      entityType: "OnboardingProcess",
      entityId: process.id,
      summary: `Marked ${process.employee.firstName} ${process.employee.lastName}'s onboarding payment as ${paid ? "paid" : "pending"}`,
    });
    res.json(process);
  } catch (err) {
    next(err);
  }
}

// Actually attempts to email the candidate if SMTP is configured (see
// email.service.js); either way, records that HR triggered it and when. The
// response's `emailSent`/`emailError` tell the client which case happened, so HR
// isn't misled into thinking a real email went out when SMTP isn't set up.
export async function sendOfferLetter(req, res, next) {
  try {
    const { content } = z.object({ content: z.string().optional() }).parse(req.body);

    const process = await prisma.onboardingProcess.update({
      where: { id: req.params.processId },
      data: { offerLetterSentAt: new Date() },
      include: { employee: { include: { user: true, designation: true } } },
    });

    const { employee } = process;
    // HR's edited text (from the "Edit & Send" modal) takes priority over the
    // fixed template — either way the letter still goes through the same styled
    // wrapper and send path, so there's exactly one place that formats/delivers it.
    const { subject, html } = content
      ? { subject: "Your Offer Letter — Stackly", html: wrapPlainTextLetter(content) }
      : offerLetterEmail({
          firstName: employee.firstName,
          lastName: employee.lastName,
          designation: employee.designation?.title,
        });
    const result = await sendEmail({ to: employee.personalEmail || employee.user.email, subject, html });

    await recordAudit({
      userId: req.user.id,
      action: "onboarding.offerLetter",
      entityType: "OnboardingProcess",
      entityId: process.id,
      summary: `Sent offer letter to ${employee.firstName} ${employee.lastName} (email ${result.sent ? "delivered" : "not configured/failed"})`,
    });

    res.json({ ...process, emailSent: result.sent, emailError: result.sent ? undefined : result.reason });
  } catch (err) {
    next(err);
  }
}

// Same idea as sendOfferLetter — and still gated on payment, since the appointment
// letter is the formal confirmation sent only after the candidate has paid.
export async function sendAppointmentLetter(req, res, next) {
  try {
    const { content } = z.object({ content: z.string().optional() }).parse(req.body);

    const process = await prisma.onboardingProcess.findUnique({
      where: { id: req.params.processId },
      include: { employee: { include: { user: true } } },
    });
    if (!process) return res.status(404).json({ error: "Onboarding process not found" });
    if (process.paymentStatus !== "PAID") {
      return res.status(409).json({ error: "Payment must be confirmed before sending the appointment letter" });
    }

    const updated = await prisma.onboardingProcess.update({
      where: { id: req.params.processId },
      data: { appointmentLetterSentAt: new Date() },
    });

    const { employee } = process;
    const { subject, html } = content
      ? { subject: "Your Appointment Letter — Stackly", html: wrapPlainTextLetter(content) }
      : appointmentLetterEmail({
          firstName: employee.firstName,
          lastName: employee.lastName,
          joiningDate: process.startDate,
        });
    const result = await sendEmail({ to: employee.personalEmail || employee.user.email, subject, html });

    await recordAudit({
      userId: req.user.id,
      action: "onboarding.appointmentLetter",
      entityType: "OnboardingProcess",
      entityId: updated.id,
      summary: `Sent appointment letter to ${employee.firstName} ${employee.lastName} (email ${result.sent ? "delivered" : "not configured/failed"})`,
    });

    res.json({ ...updated, emailSent: result.sent, emailError: result.sent ? undefined : result.reason });
  } catch (err) {
    next(err);
  }
}

// Removes the onboarding process/checklist only — the Employee record itself
// (and their login) is untouched; deactivating an employee is a separate action
// on the Employees page. Useful for a process started by mistake (e.g. a
// duplicate candidate entry) without needing to also deactivate the employee.
export async function removeProcess(req, res, next) {
  try {
    const process = await prisma.onboardingProcess.findUnique({
      where: { id: req.params.processId },
      include: { employee: true },
    });
    if (!process) return res.status(404).json({ error: "Onboarding process not found" });

    await prisma.onboardingTaskItem.deleteMany({ where: { processId: process.id } });
    await prisma.onboardingProcess.delete({ where: { id: process.id } });
    await recordAudit({
      userId: req.user.id,
      action: "onboarding.removeProcess",
      entityType: "OnboardingProcess",
      entityId: process.id,
      summary: `Removed ${process.employee.firstName} ${process.employee.lastName}'s onboarding process`,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function completeTask(req, res, next) {
  try {
    const existing = await prisma.onboardingTaskItem.findUnique({
      where: { id: req.params.taskId },
      include: { process: true },
    });
    if (!existing) return res.status(404).json({ error: "Task not found" });

    // Employees may complete their own checklist items; anyone else needs ADMIN.
    // Without this, any authenticated user could complete (or attach an arbitrary
    // fileUploadUrl to) another employee's onboarding tasks by guessing/enumerating
    // task IDs seen elsewhere in the app.
    const isOwnTask = existing.process.employeeId === req.user.employeeId;
    if (!isOwnTask && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // fileUploadUrl must point at a document already uploaded for this employee via
    // the real upload endpoint — not an arbitrary attacker-supplied string.
    const { fileUploadUrl } = req.body;
    if (fileUploadUrl && !fileUploadUrl.startsWith(`/uploads/employee-documents/${existing.process.employeeId}/`)) {
      return res.status(400).json({ error: "Invalid fileUploadUrl" });
    }

    const item = await prisma.onboardingTaskItem.update({
      where: { id: req.params.taskId },
      data: { status: "COMPLETED", completedAt: new Date(), fileUploadUrl },
    });

    const remaining = await prisma.onboardingTaskItem.count({
      where: { processId: item.processId, status: "PENDING" },
    });
    if (remaining === 0) {
      await prisma.onboardingProcess.update({ where: { id: item.processId }, data: { status: "COMPLETED" } });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
}
