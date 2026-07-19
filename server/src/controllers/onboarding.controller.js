import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../services/email.service.js";
import { offerLetterEmail, appointmentLetterEmail } from "../services/emailTemplates.js";

export async function listProcesses(req, res, next) {
  try {
    const processes = await prisma.onboardingProcess.findMany({
      include: { employee: true, taskItems: { include: { template: true } } },
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

export async function setPaymentStatus(req, res, next) {
  try {
    const { paid } = z.object({ paid: z.boolean() }).parse(req.body);
    const process = await prisma.onboardingProcess.update({
      where: { id: req.params.processId },
      data: { paymentStatus: paid ? "PAID" : "PENDING" },
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
    const process = await prisma.onboardingProcess.update({
      where: { id: req.params.processId },
      data: { offerLetterSentAt: new Date() },
      include: { employee: { include: { user: true, designation: true } } },
    });

    const { employee } = process;
    const { subject, html } = offerLetterEmail({
      firstName: employee.firstName,
      lastName: employee.lastName,
      designation: employee.designation?.title,
    });
    const result = await sendEmail({ to: employee.personalEmail || employee.user.email, subject, html });

    res.json({ ...process, emailSent: result.sent, emailError: result.sent ? undefined : result.reason });
  } catch (err) {
    next(err);
  }
}

// Same idea as sendOfferLetter — and still gated on payment, since the appointment
// letter is the formal confirmation sent only after the candidate has paid.
export async function sendAppointmentLetter(req, res, next) {
  try {
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
    const { subject, html } = appointmentLetterEmail({
      firstName: employee.firstName,
      lastName: employee.lastName,
      joiningDate: process.startDate,
    });
    const result = await sendEmail({ to: employee.personalEmail || employee.user.email, subject, html });

    res.json({ ...updated, emailSent: result.sent, emailError: result.sent ? undefined : result.reason });
  } catch (err) {
    next(err);
  }
}

export async function completeTask(req, res, next) {
  try {
    const item = await prisma.onboardingTaskItem.update({
      where: { id: req.params.taskId },
      data: { status: "COMPLETED", completedAt: new Date(), fileUploadUrl: req.body.fileUploadUrl },
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
