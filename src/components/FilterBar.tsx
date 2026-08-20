import React, { useState } from "react";
import { useAcoesFilter } from "@/hooks/useAcoesFilter";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Filter,
  FilterX,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function FilterBar() {
  const { user, isUsuario } = useAuth();
  const {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    filteredAcoes,
    totalAcoes,
    availableUnidades,
    availableCursos,
    availableModalidades,
    availableTiposAcao,
    availableStatus,
    availableCriticidades,
    availablePrioridades,
    availableRiscos,
    availableCapacidades,
  } = useAcoesFilter();

  const [expanded, setExpanded] = useState(false);

  const isSingleUnitUser = Boolean(isUsuario && user?.unidades?.length === 1);

  return (
    <Card className="border border-border/80 bg-card shadow-sm mb-6 rounded-[0.875rem] overflow-hidden transition-all duration-300">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Top Header / Search & Primary Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ações por título, responsável, problema, curso..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="pl-9 h-10 text-sm bg-background/60 focus:bg-background transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick primary selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {/* Unidade */}
            <Select
              value={filters.unidade}
              onValueChange={(v) => setFilter("unidade", v)}
              disabled={isSingleUnitUser}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-background/60 min-w-[150px]">
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {availableUnidades.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Curso */}
            <Select
              value={filters.curso}
              onValueChange={(v) => setFilter("curso", v)}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-background/60 min-w-[160px]">
                <SelectValue placeholder="Todos os cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cursos</SelectItem>
                {availableCursos.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.replace("Técnico em ", "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={filters.status}
              onValueChange={(v) => setFilter("status", v)}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-background/60 min-w-[140px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {availableStatus.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Situação do Prazo */}
            <Select
              value={filters.situacaoPrazo}
              onValueChange={(v) => setFilter("situacaoPrazo", v)}
            >
              <SelectTrigger className="h-10 text-xs sm:text-sm bg-background/60 min-w-[140px]">
                <SelectValue placeholder="Todos os prazos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os prazos</SelectItem>
                <SelectItem value="vencida">🚨 Vencidas</SelectItem>
                <SelectItem value="vence_hoje">⏰ Vencem hoje</SelectItem>
                <SelectItem value="vence_7dias">⏳ Vencem em até 7 dias</SelectItem>
                <SelectItem value="no_prazo">📅 No prazo</SelectItem>
                <SelectItem value="concluida">✅ Concluídas</SelectItem>
                <SelectItem value="sem_prazo">⚪ Sem prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-10 text-xs font-semibold gap-1.5 border-dashed"
            >
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Mais Filtros</span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                title="Limpar todos os filtros"
              >
                <FilterX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Secondary / Advanced Filters Section (Expandable) */}
        {expanded && (
          <div className="pt-3 border-t border-border/60 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Modalidade */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Modalidade
                </label>
                <Select
                  value={filters.modalidade}
                  onValueChange={(v) => setFilter("modalidade", v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/60">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as modalidades</SelectItem>
                    {availableModalidades.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Criticidade */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Criticidade
                </label>
                <Select
                  value={filters.criticidade}
                  onValueChange={(v) => setFilter("criticidade", v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/60">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {availableCriticidades.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridade */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Prioridade
                </label>
                <Select
                  value={filters.prioridade}
                  onValueChange={(v) => setFilter("prioridade", v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/60">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {availablePrioridades.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Risco */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Risco
                </label>
                <Select
                  value={filters.risco}
                  onValueChange={(v) => setFilter("risco", v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/60">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableRiscos.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Ação */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Tipo de Ação
                </label>
                <Select
                  value={filters.tipo_acao}
                  onValueChange={(v) => setFilter("tipo_acao", v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/60 truncate">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {availableTiposAcao.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capacidade SAEP */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Capacidade SAEP
                </label>
                <Select
                  value={filters.capacidade_saep}
                  onValueChange={(v) => setFilter("capacidade_saep", v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/60">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as capacidades</SelectItem>
                    {availableCapacidades.map((cap) => (
                      <SelectItem key={cap} value={cap}>
                        {cap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Footer info: Active Filters Badges and Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Indicador de Ações Exibidas — Alta Legibilidade e Contraste Otimizado */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted/60 text-foreground border border-border/80 rounded-md font-sans">
              <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-foreground/80 font-normal">Exibindo</span>
              <span className="font-bold text-primary text-[13px] tracking-tight">
                {filteredAcoes.length} {filteredAcoes.length === 1 ? "ação" : "ações"}
              </span>
              {totalAcoes > 0 && filteredAcoes.length !== totalAcoes && (
                <span className="text-muted-foreground text-[11px] font-normal">
                  (de {totalAcoes})
                </span>
              )}
            </div>

            {/* Active filters pill list */}
            {filters.unidade !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Unidade: {filters.unidade}</span>
                <button
                  onClick={() => setFilter("unidade", "all")}
                  disabled={isSingleUnitUser}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de unidade: ${filters.unidade}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.curso !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Curso: {filters.curso.replace("Técnico em ", "")}</span>
                <button
                  onClick={() => setFilter("curso", "all")}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de curso: ${filters.curso}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.status !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Status: {filters.status}</span>
                <button
                  onClick={() => setFilter("status", "all")}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de status: ${filters.status}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.situacaoPrazo !== "all" && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1 pr-1">
                <span>
                  Prazo:{" "}
                  {filters.situacaoPrazo === "vencida"
                    ? "Vencidas"
                    : filters.situacaoPrazo === "vence_hoje"
                    ? "Vencem hoje"
                    : filters.situacaoPrazo === "vence_7dias"
                    ? "Vencem em até 7 dias"
                    : filters.situacaoPrazo === "no_prazo"
                    ? "No prazo"
                    : filters.situacaoPrazo === "concluida"
                    ? "Concluídas"
                    : "Sem prazo"}
                </span>
                <button
                  onClick={() => setFilter("situacaoPrazo", "all")}
                  className="hover:bg-warning/20 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label="Remover filtro de prazo"
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.criticidade !== "all" && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1 pr-1">
                <span>Criticidade: {filters.criticidade}</span>
                <button
                  onClick={() => setFilter("criticidade", "all")}
                  className="hover:bg-destructive/20 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de criticidade: ${filters.criticidade}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.prioridade !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Prioridade: {filters.prioridade}</span>
                <button
                  onClick={() => setFilter("prioridade", "all")}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de prioridade: ${filters.prioridade}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.risco !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Risco: {filters.risco}</span>
                <button
                  onClick={() => setFilter("risco", "all")}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de risco: ${filters.risco}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.modalidade !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Modalidade: {filters.modalidade}</span>
                <button
                  onClick={() => setFilter("modalidade", "all")}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de modalidade: ${filters.modalidade}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.tipo_acao !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Tipo: {filters.tipo_acao}</span>
                <button
                  onClick={() => setFilter("tipo_acao", "all")}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de tipo: ${filters.tipo_acao}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.capacidade_saep !== "all" && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 pr-1">
                <span>Cap.: {filters.capacidade_saep}</span>
                <button
                  onClick={() => setFilter("capacidade_saep", "all")}
                  className="hover:bg-primary/10 rounded p-1 -mr-1 inline-flex items-center justify-center"
                  aria-label={`Remover filtro de capacidade: ${filters.capacidade_saep}`}
                  title="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{activeFilterCount} {activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
