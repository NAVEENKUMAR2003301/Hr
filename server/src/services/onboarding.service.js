import { prisma } from "../lib/prisma.js";

// Auto-generates an OnboardingProcess + one OnboardingTaskItem per active template
// so no mandatory step is ever missed for a new hire. `extra` carries the
// recruitment-pipeline fields from the candidate intake form (referral, interview
// rounds, etc.) — offerGiven/appointmentLetterGiven map onto the same
// offerLetterSentAt/appointmentLetterSentAt fields the "Send letter" buttons use, so
// there's one source of truth for whether either letter has gone out.
export async function createOnboardingForEmployee(tx, employeeId, extra = {}) {
  const templates = await tx.onboardingTaskTemplate.findMany();

  const process = await tx.onboardingProcess.create({
    data: {
      employeeId,
      status: extra.onboardingStatus ?? "IN_PROGRESS",
      startDate: extra.onboardingDate ?? undefined,
      forReference: extra.forReference || undefined,
      designation: extra.designation || undefined,
      experienceLevel: extra.experienceLevel || undefined,
      relevantExperience: extra.relevantExperience || undefined,
      trainingKt: extra.trainingKt || undefined,
      technicalRound: extra.technicalRound || undefined,
      hrRound: extra.hrRound || undefined,
      currentCtc: extra.currentCtc || undefined,
      expectedCtc: extra.expectedCtc || undefined,
      trainingStipend: extra.trainingStipend || undefined,
      selectionMailSent: extra.selectionMailSent ?? undefined,
      docUpdates: extra.docUpdates || undefined,
      trainingStatus: extra.trainingStatus || undefined,
      liveProject: extra.liveProject || undefined,
      offerLetterSentAt: extra.offerGiven ? new Date() : undefined,
      appointmentLetterSentAt: extra.appointmentLetterGiven ? new Date() : undefined,
    },
  });

  if (templates.length > 0) {
    await tx.onboardingTaskItem.createMany({
      data: templates.map((t) => ({ processId: process.id, templateId: t.id, status: "PENDING" })),
    });
  }

  return process;
}

// Backs the Candidate Details modal's "Edit pipeline" form — every recruitment
// pipeline field is editable after intake, not just at creation time. Offer/
// appointment-letter checkboxes toggle the same timestamp fields the "Send letter"
// buttons use: checking sets "now" if not already set, unchecking clears it.
export async function updateOnboardingPipeline(processId, data) {
  const { offerGiven, appointmentLetterGiven, onboardingDate, onboardingStatus, ...rest } = data;

  const current =
    offerGiven !== undefined || appointmentLetterGiven !== undefined
      ? await prisma.onboardingProcess.findUnique({ where: { id: processId } })
      : null;

  return prisma.onboardingProcess.update({
    where: { id: processId },
    data: {
      ...rest,
      startDate: onboardingDate,
      status: onboardingStatus,
      offerLetterSentAt:
        offerGiven === undefined ? undefined : offerGiven ? current.offerLetterSentAt ?? new Date() : null,
      appointmentLetterSentAt:
        appointmentLetterGiven === undefined
          ? undefined
          : appointmentLetterGiven
            ? current.appointmentLetterSentAt ?? new Date()
            : null,
    },
  });
}
