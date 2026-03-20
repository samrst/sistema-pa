import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Loader2, ClipboardList, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

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
    <div className="w-full max-w-3xl mx-auto p-6 bg-card rounded-2xl shadow-lg border border-border mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <BrainCircuit size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Agente Analista IA</h2>
          <p className="text-sm text-muted-foreground">Análise inteligente do Plano de Ações SAEP</p>
        </div>
      </div>

      {!analise ? (
        <div className="text-center py-8">
          <div className="bg-muted/50 border-2 border-dashed border-border rounded-xl p-8 mb-6">
            <ClipboardList className="mx-auto text-muted-foreground/50 mb-3" size={40} />
            <p className="text-foreground font-medium text-lg">
              {dadosAcoes?.length || 0} ações prontas para análise
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              A IA vai identificar padrões, riscos e gerar recomendações
            </p>
          </div>
          
          <button
            onClick={analisarComIA}
            disabled={carregando}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 font-semibold text-primary-foreground transition-all duration-200 bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {carregando ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                Analisando dados...
              </>
            ) : (
              <>
                <FileText className="mr-2" size={20} />
                Gerar Relatório de Análise
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-muted/30 border border-border rounded-xl p-5 mb-4 text-foreground leading-relaxed">
            <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
              <Sparkles size={18} /> Relatório do Agente Analista
            </h4>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{analise}</ReactMarkdown>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setAnalise("")}
              className="text-primary text-sm font-medium hover:underline"
            >
              ← Nova análise
            </button>
            <button
              onClick={analisarComIA}
              disabled={carregando}
              className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
            >
              {carregando ? "Analisando..." : "🔄 Refazer análise"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalistaGemini;
