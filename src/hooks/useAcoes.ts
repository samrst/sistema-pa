import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Acao = {
  id: string;
  created_at: string;
  updated_at: string;
  unidade: string;
  curso: string;
  uc_componente: string | null;
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acoes_saep")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Acao[];
    },
  });
}

export function useCreateAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (acao: TablesInsert<"acoes_saep">) => {
      const { data, error } = await supabase.from("acoes_saep").insert(acao).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acoes"] }),
  });
}

export function useUpdateAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"acoes_saep"> & { id: string }) => {
      const { data, error } = await supabase.from("acoes_saep").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acoes"] }),
  });
}

export function useDeleteAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("acoes_saep").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acoes"] }),
  });
}
