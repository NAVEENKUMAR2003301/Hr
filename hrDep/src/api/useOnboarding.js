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
  return useOnboardingMutation(async (processId) => (await api.post(`/onboarding/${processId}/offer-letter`)).data);
}

export function useSendAppointmentLetter() {
  return useOnboardingMutation(async (processId) => (await api.post(`/onboarding/${processId}/appointment-letter`)).data);
}

export function useUpdateOnboardingDates() {
  return useOnboardingMutation(
    async ({ processId, ...dates }) => (await api.patch(`/onboarding/${processId}/dates`, dates)).data
  );
}
