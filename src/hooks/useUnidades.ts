import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type { Unidade } from "@/types/auth";

export function useUnidades() {
  return useQuery({
    queryKey: ["unidades"],
    queryFn: async () => apiFetch<Unidade[]>("/api/unidades"),
  });
}
