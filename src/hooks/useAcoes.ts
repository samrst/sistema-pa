import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";

export type Acao = {
  id: string;
  created_at: string;
  updated_at: string;
  unidade_id?: string | null;
  usuario_criador_id?: string | null;
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
