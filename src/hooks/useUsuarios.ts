import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type {
  Usuario,
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UpdateSenhaUsuarioInput,
} from "@/types/auth";

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => apiFetch<Usuario[]>("/api/usuarios"),
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUsuarioInput) => {
      return apiFetch<Usuario>("/api/usuarios", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateUsuarioInput & { id: string }) => {
      return apiFetch<Usuario>(`/api/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useUpdateSenhaUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateSenhaUsuarioInput & { id: string }) => {
      return apiFetch<{ message: string }>(`/api/usuarios/${id}/senha`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
