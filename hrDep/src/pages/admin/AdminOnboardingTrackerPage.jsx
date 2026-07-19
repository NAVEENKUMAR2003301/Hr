import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../api/axiosClient";
import { queryKeys } from "../../api/queryKeys";
import { formatDate, getErrorMessage } from "../../lib/utils";
import {
  useSetOnboardingPayment,
  useSendOfferLetter,
  useSendAppointmentLetter,
  useUpdateOnboardingDates,
} from "../../api/useOnboarding";

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
  const [error, setError] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null); // { type: "offer" | "appointment", sent, reason }

  const isPaid = process.paymentStatus === "PAID";

  async function handleSendOffer() {
    setError(null);
    setEmailStatus(null);
    try {
      const result = await sendOffer.mutateAsync(process.id);
      setEmailStatus({ type: "offer", sent: result.emailSent, reason: result.emailError });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send offer letter"));
    }
  }

  async function handleSendAppointment() {
    setError(null);
    setEmailStatus(null);
    try {
      const result = await sendAppointment.mutateAsync(process.id);
      setEmailStatus({ type: "appointment", sent: result.emailSent, reason: result.emailError });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send appointment letter"));
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Link to={`/admin/employees/${process.employee.id}`} className="font-semibold text-slate-900 dark:text-slate-50 hover:text-indigo-600">
          {process.employee.firstName} {process.employee.lastName}
        </Link>
        <span className="text-sm text-slate-500">{process.status}</span>
      </div>

      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500" style={{ width: `${progress(process)}%` }} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
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

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
          onClick={handleSendOffer}
          disabled={sendOffer.isPending}
          className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          {process.offerLetterSentAt ? `Offer letter sent ${formatDate(process.offerLetterSentAt)}` : "Send offer letter"}
        </button>

        <span className="mx-1 text-slate-300">·</span>

        <button
          onClick={handleSendAppointment}
          disabled={sendAppointment.isPending || !isPaid}
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
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AdminOnboardingTrackerPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.onboardingProcesses,
    queryFn: async () => (await api.get("/onboarding")).data,
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Offer/appointment letter buttons always record HR's action and timestamp. Whether an actual email goes out
        depends on whether SMTP is configured on the server (see server/.env.example) — each click reports which happened.
      </p>
      {isLoading && <p className="text-slate-400">Loading…</p>}
      {!isLoading && data?.length === 0 && <p className="text-slate-400">No onboarding processes yet.</p>}
      {data?.map((process) => (
        <ProcessCard key={process.id} process={process} />
      ))}
    </div>
  );
}
