import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useAcoes, type Acao } from "@/hooks/useAcoes";
import { useAuth } from "@/hooks/useAuth";
import {
  UNIDADES,
  CURSOS,
  MODALIDADE,
  STATUS_OPTIONS,
  CRITICIDADE_OPTIONS,
  PRIORIDADE_OPTIONS,
  RISCO_OPTIONS,
  CAPACIDADES,
  TIPOS_ACAO,
} from "@/lib/constants";

export interface FilterState {
  search: string;
  unidade: string;
  curso: string;
  modalidade: string;
  status: string;
  criticidade: string;
  prioridade: string;
  risco: string;
  capacidade_saep: string;
  tipo_acao: string;
  situacaoPrazo: string;
}

export function getFiltersSummary(filters: FilterState): string {
  const parts: string[] = [];
  if (filters.unidade !== "all") parts.push(`Unidade: ${filters.unidade}`);
  if (filters.curso !== "all") parts.push(`Curso: ${filters.curso.replace("Técnico em ", "")}`);
  if (filters.status !== "all") parts.push(`Status: ${filters.status}`);
  if (filters.modalidade !== "all") parts.push(`Modalidade: ${filters.modalidade}`);
  if (filters.criticidade !== "all") parts.push(`Criticidade: ${filters.criticidade}`);
  if (filters.prioridade !== "all") parts.push(`Prioridade: ${filters.prioridade}`);
  if (filters.risco !== "all") parts.push(`Risco: ${filters.risco}`);
  if (filters.tipo_acao !== "all") parts.push(`Tipo: ${filters.tipo_acao}`);
  if (filters.capacidade_saep !== "all") parts.push(`Cap.: ${filters.capacidade_saep}`);
  if (filters.situacaoPrazo !== "all") {
    const prazoLabel =
      filters.situacaoPrazo === "vencida"
        ? "Vencidas"
        : filters.situacaoPrazo === "vence_hoje"
        ? "Vencem hoje"
        : filters.situacaoPrazo === "vence_7dias"
        ? "Vencem em até 7 dias"
        : filters.situacaoPrazo === "no_prazo"
        ? "No prazo"
        : filters.situacaoPrazo === "concluida"
        ? "Concluídas"
        : "Sem prazo";
    parts.push(`Prazo: ${prazoLabel}`);
  }
  if (filters.search.trim()) parts.push(`Busca: "${filters.search.trim()}"`);
  return parts.length > 0 ? parts.join(" | ") : "Todos";
}

export const initialFilters: FilterState = {
  search: "",
  unidade: "all",
  curso: "all",
  modalidade: "all",
  status: "all",
  criticidade: "all",
  prioridade: "all",
  risco: "all",
  capacidade_saep: "all",
  tipo_acao: "all",
  situacaoPrazo: "all",
};

export interface FilterContextType {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setFilters: (partial: Partial<FilterState>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filteredAcoes: Acao[];
  totalAcoes: number;
  availableUnidades: string[];
  availableCursos: string[];
  availableModalidades: string[];
  availableTiposAcao: string[];
  availableStatus: string[];
  availableCriticidades: string[];
  availablePrioridades: string[];
  availableRiscos: string[];
  availableCapacidades: string[];
  isLoading: boolean;
}

const FilterContext = createContext<FilterContextType | null>(null);

function matchesPrazo(dataFimStr: string | null | undefined, acaoStatus: string, filterPrazo: string): boolean {
  if (filterPrazo === "all") return true;
  if (!dataFimStr) {
    return filterPrazo === "sem_prazo";
  }

  const isConcluido = acaoStatus === "Concluído";
  if (isConcluido) {
    return filterPrazo === "concluida";
  }
  if (filterPrazo === "concluida") {
    return false;
  }

  const datePart = dataFimStr.includes("T") ? dataFimStr.split("T")[0] : dataFimStr;
  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const dataFim = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  dataFim.setHours(0, 0, 0, 0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diffTime = dataFim.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (filterPrazo === "vencida") {
    return diffDays < 0;
  }
  if (filterPrazo === "vence_hoje") {
    return diffDays === 0;
  }
  if (filterPrazo === "vence_7dias") {
    return diffDays >= 0 && diffDays <= 7;
  }
  if (filterPrazo === "no_prazo") {
    return diffDays > 7;
  }

  return true;
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { user, isMacroprocesso, isUsuario } = useAuth();
  const { data: acoes, isLoading } = useAcoes();
  const [filters, setFiltersState] = useState<FilterState>(initialFilters);

  const allAcoes = useMemo(() => acoes || [], [acoes]);

  // Derive available options respecting user permission scope
  const availableUnidades = useMemo(() => {
    if (isUsuario && user?.unidades?.length) {
      return user.unidades.map((u) => u.nome);
    }
    if (isMacroprocesso && user?.unidades?.length) {
      return user.unidades.map((u) => u.nome);
    }
    // For admin, prefer unique units found in dataset or fallback to constant UNIDADES
    const fromData = Array.from(new Set(allAcoes.map((a) => a.unidade).filter(Boolean)));
    if (fromData.length > 0) {
      return Array.from(new Set([...fromData, ...UNIDADES.filter((u) => u !== "Geral")]));
    }
    return UNIDADES.filter((u) => u !== "Geral");
  }, [user, isUsuario, isMacroprocesso, allAcoes]);

  const availableCursos = useMemo(() => {
    const fromData = Array.from(new Set(allAcoes.map((a) => a.curso).filter(Boolean)));
    if (fromData.length > 0) {
      return Array.from(new Set([...fromData, ...CURSOS.filter((c) => c !== "Geral")]));
    }
    return CURSOS.filter((c) => c !== "Geral");
  }, [allAcoes]);

  const availableModalidades = useMemo(() => {
    return MODALIDADE.filter((m) => m !== "Geral");
  }, []);

  const availableTiposAcao = useMemo(() => {
    return Array.from(TIPOS_ACAO);
  }, []);

  const availableStatus = useMemo(() => {
    return Array.from(STATUS_OPTIONS);
  }, []);

  const availableCriticidades = useMemo(() => {
    return Array.from(CRITICIDADE_OPTIONS);
  }, []);

  const availablePrioridades = useMemo(() => {
    return Array.from(PRIORIDADE_OPTIONS);
  }, []);

  const availableRiscos = useMemo(() => {
    return Array.from(RISCO_OPTIONS);
  }, []);

  const availableCapacidades = useMemo(() => {
    return CAPACIDADES.filter((c) => c !== "Geral");
  }, []);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.unidade !== "all") count++;
    if (filters.curso !== "all") count++;
    if (filters.modalidade !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.criticidade !== "all") count++;
    if (filters.prioridade !== "all") count++;
    if (filters.risco !== "all") count++;
    if (filters.capacidade_saep !== "all") count++;
    if (filters.tipo_acao !== "all") count++;
    if (filters.situacaoPrazo !== "all") count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  // Compute filtered actions with full intersection (AND)
  const filteredAcoes = useMemo(() => {
    return allAcoes.filter((a) => {
      // 1. Search query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchAcao = a.acao?.toLowerCase().includes(q) ?? false;
        const matchResp = a.responsavel_principal?.toLowerCase().includes(q) ?? false;
        const matchProb = a.problema_identificado?.toLowerCase().includes(q) ?? false;
        const matchCurso = a.curso?.toLowerCase().includes(q) ?? false;
        const matchUnidade = a.unidade?.toLowerCase().includes(q) ?? false;
        if (!matchAcao && !matchResp && !matchProb && !matchCurso && !matchUnidade) {
          return false;
        }
      }

      // 2. Unidade
      if (filters.unidade !== "all") {
        if (a.unidade.toLowerCase() !== filters.unidade.toLowerCase()) {
          return false;
        }
      }

      // 3. Curso
      if (filters.curso !== "all") {
        if (a.curso !== filters.curso) {
          return false;
        }
      }

      // 4. Modalidade
      if (filters.modalidade !== "all") {
        if (a.modalidade !== filters.modalidade) {
          return false;
        }
      }

      // 5. Status
      if (filters.status !== "all") {
        if (a.status !== filters.status) {
          return false;
        }
      }

      // 6. Criticidade
      if (filters.criticidade !== "all") {
        if (a.classificacao_criticidade !== filters.criticidade) {
          return false;
        }
      }

      // 7. Prioridade
      if (filters.prioridade !== "all") {
        if (a.prioridade !== filters.prioridade) {
          return false;
        }
      }

      // 8. Risco
      if (filters.risco !== "all") {
        if (a.risco !== filters.risco) {
          return false;
        }
      }

      // 9. Capacidade SAEP
      if (filters.capacidade_saep !== "all") {
        if (a.capacidade_saep !== filters.capacidade_saep) {
          return false;
        }
      }

      // 10. Tipo de Ação
      if (filters.tipo_acao !== "all") {
        if (a.tipo_acao !== filters.tipo_acao) {
          return false;
        }
      }

      // 11. Prazo
      if (filters.situacaoPrazo !== "all") {
        if (!matchesPrazo(a.data_fim, a.status, filters.situacaoPrazo)) {
          return false;
        }
      }

      return true;
    });
  }, [allAcoes, filters]);

  const value = useMemo<FilterContextType>(() => ({
    filters,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    filteredAcoes,
    totalAcoes: allAcoes.length,
    availableUnidades,
    availableCursos,
    availableModalidades,
    availableTiposAcao,
    availableStatus,
    availableCriticidades,
    availablePrioridades,
    availableRiscos,
    availableCapacidades,
    isLoading,
  }), [
    filters,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    filteredAcoes,
    allAcoes.length,
    availableUnidades,
    availableCursos,
    availableModalidades,
    availableTiposAcao,
    availableStatus,
    availableCriticidades,
    availablePrioridades,
    availableRiscos,
    availableCapacidades,
    isLoading,
  ]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useAcoesFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useAcoesFilter must be used within a FilterProvider");
  }
  return context;
}
