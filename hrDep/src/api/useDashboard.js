import { useQuery } from "@tanstack/react-query";
import { api } from "./axiosClient";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data,
    refetchInterval: 60_000,
  });
}
