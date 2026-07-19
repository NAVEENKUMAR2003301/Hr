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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myLeaves });
      // Applying moves days into "pending" on the balance the server tracks.
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      // Approve/reject shifts days between "pending" and "used" on the balance.
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
    },
  });
}

// Admin-only "undo" for a request already decided (or still pending) — reverses
// whichever balance bucket the days were sitting in and marks it CANCELLED.
export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/leaves/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
    },
  });
}

// HR one-click "mark this employee as on Casual/Sick leave today" — records an
// already-approved leave directly, no apply-then-approve round trip.
export function useMarkLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, leaveType, date }) => (await api.post("/leaves/mark", { employeeId, leaveType, date })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
    },
  });
}
