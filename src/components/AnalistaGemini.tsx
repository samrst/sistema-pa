import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Loader2, ClipboardList, FileText, RotateCcw, Download, Filter } from "lucide-react";
import DOMPurify from "dompurify";
import { exportRelatorioPdf } from "@/lib/exportRelatorioPdf";
import { API_BASE_URL, getAuthHeaders } from "@/services/api";
import { useAcoesFilter } from "@/hooks/useAcoesFilter";
import { getFiltersSummary } from "@/contexts/FilterContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "p", "br", "hr", "div", "section", "span",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "ul", "ol", "li", "strong", "em", "b", "i",
  ],
  ALLOWED_ATTR: ["class", "style", "colspan", "rowspan"],
};

function sanitizeHtml(raw: string): string {
  let html = raw.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "").trim();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

interface AnalistaGeminiProps {
  dadosAcoes?: any[];
}

const AnalistaGemini = ({ dadosAcoes }: AnalistaGeminiProps) => {
  const { filteredAcoes, filters, hasActiveFilters, activeFilterCount } = useAcoesFilter();
  const [analise, setAnalise] = useState<string>("");
  const [carregando, setCarregando] = useState(false);

  const acoesParaAnalisar = dadosAcoes !== undefined ? dadosAcoes : filteredAcoes;

  const analisarComIA = async () => {
    if (!acoesParaAnalisar || acoesParaAnalisar.length === 0) {
      toast.error("Não há ações no conjunto filtrado para analisar.");
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ia/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ acoes: acoesParaAnalisar }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data?.error) throw new Error(data.error);

      setAnalise(data.analise);
      toast.success("Relatório executivo gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro na análise:", error);
      setAnalise(`❌ Erro ao realizar análise: ${error.message || "Tente novamente."}`);
      toast.error("Erro ao gerar análise com IA.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {!analise ? (
        <div className="bg-card rounded-[0.875rem] shadow-md border border-border p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-[0.75rem] text-primary">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-primary">Agente Analista IA</h2>
              <p className="text-xs text-muted-foreground">Relatório executivo inteligente do Plano SAEP</p>
            </div>
          </div>

          <div className="bg-primary-soft border border-dashed border-primary-light rounded-[0.875rem] p-6 mb-6 text-center space-y-3">
            <ClipboardList className="mx-auto text-primary/30 mb-1" size={36} />
            <p className="text-foreground font-semibold text-base">
              {acoesParaAnalisar?.length || 0} {acoesParaAnalisar?.length === 1 ? "ação pronta" : "ações prontas"} para análise
            </p>
            <p className="text-muted-foreground text-xs max-w-md mx-auto">
              A IA cruzará dados entre cursos e unidades, identificará padrões em comum, ações críticas, focos estratégicos e gerará recomendações para a gestão.
            </p>

            {/* Resumo do Escopo dos Filtros Ativos */}
            {hasActiveFilters && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 border-t border-primary-light/40">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3 text-primary" />
                  Escopo filtrado:
                </span>
                {filters.unidade !== "all" && (
                  <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                    Unidade: {filters.unidade}
                  </Badge>
                )}
                {filters.curso !== "all" && (
                  <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                    Curso: {filters.curso.replace("Técnico em ", "")}
                  </Badge>
                )}
                {filters.status !== "all" && (
                  <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                    Status: {filters.status}
                  </Badge>
                )}
                {filters.criticidade !== "all" && (
                  <Badge variant="outline" className="text-[11px] bg-destructive/10 text-destructive border-destructive/20">
                    Criticidade: {filters.criticidade}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <button
              onClick={analisarComIA}
              disabled={carregando || acoesParaAnalisar.length === 0}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 font-semibold text-sm text-primary-foreground bg-primary rounded-[0.875rem] hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
              aria-label="Gerar Relatório Executivo com Inteligência Artificial"
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Analisando dados...
                </>
              ) : (
                <>
                  <FileText className="mr-2" size={18} />
                  Gerar Relatório Executivo
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-3">
          {/* Report Header */}
          <div className="bg-card border border-border rounded-[0.875rem] shadow-md overflow-hidden">
            <div className="bg-primary px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-primary-foreground/20 rounded-[0.5rem] shrink-0">
                  <Sparkles size={20} className="text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-primary-foreground text-sm sm:text-base truncate">Relatório Executivo — Plano de Ações SAEP</h3>
                  <p className="text-[11px] text-primary-foreground/70 truncate">
                    SENAI Bahia · Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {acoesParaAnalisar.length} {acoesParaAnalisar.length === 1 ? "ação analisada" : "ações analisadas"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => exportRelatorioPdf(analise, acoesParaAnalisar.length, getFiltersSummary(filters))}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground rounded-[0.5rem] transition-colors shrink-0"
                title="Baixar relatório em PDF"
                aria-label="Baixar relatório em PDF"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Baixar PDF</span>
              </button>
            </div>

            <div className="agent-html p-4 sm:p-6 overflow-x-auto">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(analise) }} />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-3 px-1">
            <button
              onClick={() => setAnalise("")}
              className="text-xs font-medium text-primary hover:underline"
            >
              ← Nova análise
            </button>
            <button
              onClick={analisarComIA}
              disabled={carregando}
              className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              <RotateCcw size={12} className={`mr-1 ${carregando ? 'animate-spin' : ''}`} />
              {carregando ? "Analisando..." : "Refazer análise"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalistaGemini;
