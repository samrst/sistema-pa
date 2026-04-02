import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Loader2, ClipboardList, FileText, RotateCcw, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import { exportRelatorioPdf } from "@/lib/exportRelatorioPdf";

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "h2", "h3", "h4", "p", "br", "hr", "div", "section", "span",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "ul", "ol", "li", "strong", "em", "b", "i",
  ],
  ALLOWED_ATTR: ["class", "style", "colspan", "rowspan"],
};

function sanitizeHtml(raw: string): string {
  let html = raw.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "").trim();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

const AnalistaGemini = ({ dadosAcoes }: { dadosAcoes: any[] }) => {
  const [analise, setAnalise] = useState<string>("");
  const [carregando, setCarregando] = useState(false);

  const analisarComIA = async () => {
    if (!dadosAcoes || dadosAcoes.length === 0) {
      alert("Não há ações para analisar!");
      return;
    }

    setCarregando(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-acoes', {
        body: { acoes: dadosAcoes },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalise(data.analise);
    } catch (error: any) {
      console.error("Erro na análise:", error);
      setAnalise(`❌ Erro ao realizar análise: ${error.message || "Tente novamente."}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {!analise ? (
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Agente Analista IA</h2>
              <p className="text-xs text-muted-foreground">Relatório executivo inteligente do Plano SAEP</p>
            </div>
          </div>

          <div className="bg-muted/40 border border-dashed border-border rounded-xl p-6 mb-6 text-center">
            <ClipboardList className="mx-auto text-muted-foreground/40 mb-3" size={36} />
            <p className="text-foreground font-semibold text-base">
              {dadosAcoes?.length || 0} ações prontas para análise
            </p>
            <p className="text-muted-foreground text-xs mt-1 max-w-md mx-auto">
              A IA vai cruzar dados entre cursos, identificar padrões em comum, ações críticas, focos estratégicos e gerar recomendações para a gestão.
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={analisarComIA}
              disabled={carregando}
              className="inline-flex items-center justify-center px-8 py-3 font-semibold text-sm text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.97]"
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
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-primary px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  <Sparkles size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-primary-foreground text-sm sm:text-base">Relatório Executivo — Plano de Ações SAEP</h3>
                  <p className="text-[11px] text-primary-foreground/70">
                    SENAI Feira de Santana · Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {dadosAcoes.length} ações
                  </p>
                </div>
              </div>
              <button
                onClick={() => exportRelatorioPdf(analise, dadosAcoes.length)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground rounded-lg transition-colors"
                title="Baixar relatório em PDF"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Baixar PDF</span>
              </button>
            </div>

            <div className="agent-html p-4 sm:p-6">
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
              className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
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
