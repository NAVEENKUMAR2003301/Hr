import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./axiosClient";
import { queryKeys } from "./queryKeys";

export function useUpdateReviewCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => (await api.patch(`/performance/cycles/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviewCycles }),
  });
}

export function useCloseReviewCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/performance/cycles/${id}/close`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviewCycles }),
  });
}

export function useDeleteReviewCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/performance/cycles/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviewCycles }),
  });
}

export function useAllReviews(filters = {}) {
  return useQuery({
    queryKey: ["performance", "reviews", filters],
    queryFn: async () => (await api.get("/performance/reviews", { params: filters })).data,
  });
}
