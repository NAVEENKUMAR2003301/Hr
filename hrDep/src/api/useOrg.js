import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./axiosClient";
import { queryKeys } from "./queryKeys";

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: async () => (await api.get("/departments")).data,
  });
}

export function useDepartment(id) {
  return useQuery({
    queryKey: ["departments", id],
    queryFn: async () => (await api.get(`/departments/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post("/departments", data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => (await api.patch(`/departments/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/departments/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments }),
  });
}

export function useDesignations(departmentId) {
  return useQuery({
    queryKey: ["designations", departmentId],
    queryFn: async () => (await api.get("/designations", { params: { departmentId } })).data,
    enabled: Boolean(departmentId),
  });
}

function invalidateDesignations(queryClient) {
  queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "designations" });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post("/designations", data)).data,
    onSuccess: () => invalidateDesignations(queryClient),
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => (await api.patch(`/designations/${id}`, data)).data,
    onSuccess: () => invalidateDesignations(queryClient),
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/designations/${id}`)).data,
    onSuccess: () => invalidateDesignations(queryClient),
  });
}
