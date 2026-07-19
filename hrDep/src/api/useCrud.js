import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./axiosClient";

// Builds a standard list/create/update/delete hook set for a REST resource that
// follows the { GET, POST, PATCH /:id, DELETE /:id } shape used across the admin
// CRUD pages, so each resource file is just this call instead of repeated boilerplate.
export function createCrudHooks(basePath, queryKey) {
  function useList(params, options = {}) {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => (await api.get(basePath, { params })).data,
      enabled: options.enabled ?? true,
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data) => (await api.post(basePath, data)).data,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...data }) => (await api.patch(`${basePath}/${id}`, data)).data,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  }

  function useRemove() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id) => (await api.delete(`${basePath}/${id}`)).data,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  }

  return { useList, useCreate, useUpdate, useRemove };
}
