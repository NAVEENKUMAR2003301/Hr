import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./axiosClient";
import { queryKeys } from "./queryKeys";

function useOnboardingMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboardingProcesses }),
  });
}

export function useSetOnboardingPayment() {
  return useOnboardingMutation(
    async ({ processId, paid }) => (await api.post(`/onboarding/${processId}/payment`, { paid })).data
  );
}

export function useSendOfferLetter() {
  return useOnboardingMutation(
    async ({ processId, content }) => (await api.post(`/onboarding/${processId}/offer-letter`, { content })).data
  );
}

export function useSendAppointmentLetter() {
  return useOnboardingMutation(
    async ({ processId, content }) => (await api.post(`/onboarding/${processId}/appointment-letter`, { content })).data
  );
}

export function useUpdateOnboardingDates() {
  return useOnboardingMutation(
    async ({ processId, ...dates }) => (await api.patch(`/onboarding/${processId}/dates`, dates)).data
  );
}

// Edits the recruitment-pipeline fields collected on the New Candidate intake form
// (referral note, designation, rounds, CTC, etc.) — see Candidate Details modal.
export function useUpdateOnboardingPipeline() {
  return useOnboardingMutation(
    async ({ processId, ...data }) => (await api.patch(`/onboarding/${processId}/pipeline`, data)).data
  );
}

// Removes the onboarding process/checklist only — the employee record and their
// login are untouched (see server/src/controllers/onboarding.controller.js removeProcess).
export function useDeleteOnboardingProcess() {
  return useOnboardingMutation(async (processId) => (await api.delete(`/onboarding/${processId}`)).data);
}
