import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./axiosClient";

export function useEmployeeDocuments(employeeId) {
  return useQuery({
    queryKey: ["employeeDocuments", employeeId],
    queryFn: async () => (await api.get(`/employees/${employeeId}/documents`)).data,
    enabled: Boolean(employeeId),
  });
}

export function useUploadEmployeeDocument(employeeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, docType }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      return (await api.post(`/employees/${employeeId}/documents`, formData)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employeeDocuments", employeeId] }),
  });
}

export function useDeleteEmployeeDocument(employeeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (docId) => (await api.delete(`/employees/${employeeId}/documents/${docId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employeeDocuments", employeeId] }),
  });
}
