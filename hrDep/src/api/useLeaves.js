import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./axiosClient";
import { queryKeys } from "./queryKeys";

export function useMyLeaves() {
  return useQuery({
    queryKey: queryKeys.myLeaves,
    queryFn: async () => (await api.get("/leaves/me")).data,
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post("/leaves/me", data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myLeaves }),
  });
}

export function useLeaveRequests(filters = {}) {
  return useQuery({
    queryKey: queryKeys.leaveRequests(filters),
    queryFn: async () => (await api.get("/leaves", { params: filters })).data,
  });
}

export function useLeaveDecision(stage) {
  const queryClient = useQueryClient();
  const path = stage === "HR" ? "hr-decision" : "manager-decision";
  return useMutation({
    mutationFn: async ({ id, decision, comment }) => (await api.post(`/leaves/${id}/${path}`, { decision, comment })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
}
