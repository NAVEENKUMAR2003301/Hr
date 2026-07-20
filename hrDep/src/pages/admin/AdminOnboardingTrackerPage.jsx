import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";
import { formatDate, getErrorMessage } from "../../lib/utils";
import {
  useSetOnboardingPayment,
  useSendOfferLetter,
  useSendAppointmentLetter,
  useUpdateOnboardingDates,
  useDeleteOnboardingProcess,
} from "../../api/useOnboarding";
import Modal from "../../components/Modal";
import ConfirmModal from "../../components/ConfirmModal";
import NewCandidateForm from "../../features/onboarding/NewCandidateForm";
import CandidateExcelImportExport from "../../features/onboarding/CandidateExcelImportExport";
import EditLetterModal from "../../features/onboarding/EditLetterModal";
import CandidateDetailsModal from "../../features/onboarding/CandidateDetailsModal";
import { offerLetterDefaultText, appointmentLetterDefaultText } from "../../features/onboarding/letterTemplates";

function progress(process) {
  const total = process.taskItems.length;
  const done = process.taskItems.filter((t) => t.status === "COMPLETED").length;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function toDateInput(value) {
  return value ? value.slice(0, 10) : "";
}

function ProcessCard({ process }) {
  const setPayment = useSetOnboardingPayment();
  const sendOffer = useSendOfferLetter();
  const sendAppointment = useSendAppointmentLetter();
  const updateDates = useUpdateOnboardingDates();
  const deleteProcess = useDeleteOnboardingProcess();
  const [emailStatus, setEmailStatus] = useState(null); // { type: "offer" | "appointment", sent, reason }
  const [editingLetter, setEditingLetter] = useState(null); // null | "offer" | "appointment"
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const isPaid = process.paymentStatus === "PAID";
  const { employee } = process;

  async function handleDelete() {
    setDeleteError(null);
    try {
      await deleteProcess.mutateAsync(process.id);
      setConfirmingDelete(false);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete"));
      setConfirmingDelete(false);
    }
  }

  async function handleSendOffer(content) {
    const result = await sendOffer.mutateAsync({ processId: process.id, content });
    setEmailStatus({ type: "offer", sent: result.emailSent, reason: result.emailError });
  }

  async function handleSendAppointment(content) {
    const result = await sendAppointment.mutateAsync({ processId: process.id, content });
    setEmailStatus({ type: "appointment", sent: result.emailSent, reason: result.emailError });
  }

  return (
    <div
      onClick={() => setShowDetails(true)}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-900 dark:text-slate-50">
          {process.employee.firstName} {process.employee.lastName}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{process.status === "COMPLETED" ? "Done" : process.status}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            className="text-xs text-red-500 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500" style={{ width: `${progress(process)}%` }} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm" onClick={(e) => e.stopPropagation()}>
        <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          Start
          <input
            type="date"
            defaultValue={toDateInput(process.startDate)}
            onBlur={(e) => e.target.value && updateDates.mutate({ processId: process.id, startDate: e.target.value })}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          Target end
          <input
            type="date"
            defaultValue={toDateInput(process.targetEndDate)}
            onBlur={(e) => e.target.value && updateDates.mutate({ processId: process.id, targetEndDate: e.target.value })}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isPaid
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
          }`}
        >
          {isPaid ? "Paid" : "Payment pending"}
        </span>
        <button
          onClick={() => setPayment.mutate({ processId: process.id, paid: !isPaid })}
          disabled={setPayment.isPending}
          className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          Mark as {isPaid ? "pending" : "paid"}
        </button>

        <span className="mx-1 text-slate-300">·</span>

        <button
          onClick={() => setEditingLetter("offer")}
          className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          {process.offerLetterSentAt ? `Offer letter sent ${formatDate(process.offerLetterSentAt)}` : "Send offer letter"}
        </button>

        <span className="mx-1 text-slate-300">·</span>

        <button
          onClick={() => setEditingLetter("appointment")}
          disabled={!isPaid}
          title={isPaid ? undefined : "Requires payment to be marked as paid first"}
          className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {process.appointmentLetterSentAt
            ? `Appointment letter sent ${formatDate(process.appointmentLetterSentAt)}`
            : "Send appointment letter"}
        </button>
      </div>

      {emailStatus && (
        <p className={`text-xs ${emailStatus.sent ? "text-emerald-600" : "text-amber-600"}`}>
          {emailStatus.sent
            ? `Email actually sent for the ${emailStatus.type} letter.`
            : `Recorded, but no email was sent (${emailStatus.reason}).`}
        </p>
      )}

      {editingLetter === "offer" && (
        <EditLetterModal
          title="Edit & Send Offer Letter"
          defaultText={offerLetterDefaultText({
            firstName: employee.firstName,
            lastName: employee.lastName,
            designation: employee.designation?.title,
            department: employee.department?.name,
          })}
          isSending={sendOffer.isPending}
          onSend={handleSendOffer}
          onClose={() => setEditingLetter(null)}
        />
      )}
      {editingLetter === "appointment" && (
        <EditLetterModal
          title="Edit & Send Appointment Letter"
          defaultText={appointmentLetterDefaultText({
            firstName: employee.firstName,
            lastName: employee.lastName,
            joiningDate: process.startDate,
            designation: employee.designation?.title,
            department: employee.department?.name,
          })}
          isSending={sendAppointment.isPending}
          onSend={handleSendAppointment}
          onClose={() => setEditingLetter(null)}
        />
      )}

      {confirmingDelete && (
        <ConfirmModal
          title="Delete this onboarding process?"
          message={`Remove ${employee.firstName} ${employee.lastName}'s onboarding checklist? Their employee record and login are not affected — only this tracking process and its checklist items are removed.`}
          pending={deleteProcess.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      )}
      {deleteError && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-red-600 text-white text-sm px-4 py-2 shadow-lg">{deleteError}</div>
      )}

      {showDetails && <CandidateDetailsModal employee={employee} process={process} onClose={() => setShowDetails(false)} />}
    </div>
  );
}

export default function AdminOnboardingTrackerPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.onboardingProcesses,
    queryFn: async () => (await api.get("/onboarding")).data,
  });
  const [showNewCandidate, setShowNewCandidate] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 max-w-2xl">
          Offer/appointment letter buttons always record HR's action and timestamp. Whether an actual email goes out
          depends on whether SMTP is configured on the server (see server/.env.example) — each click reports which happened.
        </p>
        <button
          onClick={() => setShowNewCandidate(true)}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New Candidate
        </button>
      </div>

      <CandidateExcelImportExport />

      {isLoading && <p className="text-slate-400">Loading…</p>}
      {!isLoading && data?.length === 0 && <p className="text-slate-400">No onboarding processes yet.</p>}
      {data?.map((process) => (
        <ProcessCard key={process.id} process={process} />
      ))}

      {showNewCandidate && (
        <Modal title="New Candidate" onClose={() => setShowNewCandidate(false)}>
          <NewCandidateForm onDone={() => setShowNewCandidate(false)} />
        </Modal>
      )}
    </div>
  );
}
