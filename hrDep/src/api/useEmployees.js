import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./axiosClient";
import { queryKeys } from "./queryKeys";

export function useEmployees(filters = {}) {
  return useQuery({
    queryKey: queryKeys.employees(filters),
    queryFn: async () => (await api.get("/employees", { params: filters })).data,
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: async () => (await api.get(`/employees/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post("/employees", data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// Onboarding's lightweight intake (name/phone/email/address only) — see
// server/src/services/employee.service.js createCandidate for the defaults it fills in.
export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post("/employees/candidates", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });
}

export function useUpdateEmployee(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.patch(`/employees/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.employee(id) });
    },
  });
}

// "Delete" deactivates the employee (employmentStatus -> TERMINATED, login disabled)
// rather than removing the row — see server/src/services/employee.service.js.
export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/employees/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// Toggles whether HR has physically handed this employee their ID card yet.
export function useSetIdCardStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, provided }) => (await api.patch(`/employees/${id}/id-card`, { provided })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useNextEmployeeCode(enabled = true) {
  return useQuery({
    queryKey: ["employees", "next-code"],
    queryFn: async () => (await api.get("/employees/next-code")).data,
    staleTime: 0,
    enabled,
  });
}
