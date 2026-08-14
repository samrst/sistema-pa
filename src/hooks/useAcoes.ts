import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error || payload?.message || `Erro na requisição: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type Acao = {
  id: string;
  created_at: string;
  updated_at: string;
  unidade: string;
  curso: string;
  modalidade: string;
  capacidade_saep: string;
  problema_identificado: string;
  evidencias: string | null;
  classificacao_criticidade: string | null;
  meta_objetiva: string | null;
  meta_pratica: string | null;
  meta_prazo: string | null;
  acao: string;
  tipo_acao: string;
  entregavel: string | null;
  responsavel_principal: string;
  funcao_cargo: string | null;
  co_responsaveis: string | null;
  apoios_necessarios: string[] | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  risco: string | null;
  plano_mitigacao: string | null;
  custo_estimado: number | null;
  prioridade: string | null;
  impacto_saep: string | null;
  observacoes: string | null;
};

export function useAcoes() {
  return useQuery({
    queryKey: ["acoes"],
    queryFn: async () => apiFetch<Acao[]>("/api/acoes"),
  });
}

export function useCreateAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (acao: Partial<Acao> & Record<string, any>) => {
      return apiFetch<Acao>("/api/acoes", {
        method: "POST",
        body: JSON.stringify(acao),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acoes"] }),
  });
}

export function useUpdateAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Acao> & { id: string }) => {
      return apiFetch<Acao>(`/api/acoes/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acoes"] }),
  });
}

export function useDeleteAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/api/acoes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acoes"] }),
  });
}
