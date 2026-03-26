import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CURSOS_CADASTRADOS = [
  "Técnico em Eletromecânica",
  "Técnico em Manutenção Automotiva",
  "Técnico em Eletrotécnica",
  "Técnico em Logística",
  "Técnico em Administração",
  "Técnico em Desenvolvimento de Sistemas",
  "Técnico em Química",
  "Técnico em Automação",
  "Técnico em Segurança do Trabalho",
];

serve(async (req) => {
  serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { acoes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!acoes || acoes.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma ação para analisar." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hoje = new Date().toISOString().slice(0, 10);

    // Configuração do Agente Estratégico
    const systemPrompt = `Você é um Consultor de Gestão Estratégica e Especialista em Eficiência Operacional Educacional (SENAI).
Sua missão é realizar uma auditoria técnica e estratégica sobre os planos de ação do SAEP.

DIRETRIZES DE ANÁLISE:
1. CRUZAMENTO DE DADOS: Identifique ações redundantes entre cursos diferentes e sugira unificação para economizar recursos.
2. VIABILIDADE TÉCNICA: Avalie se o prazo final é realista para o tipo de ação e o custo estimado.
3. GESTÃO ESTRATÉGICA: Aplique conceitos de análise de risco e melhoria contínua (PDCA).
4. FOCO EM RESULTADO: Identifique descrições vagas e proponha indicadores de desempenho (KPIs) claros.

REGRAS DE FORMATAÇÃO:
- Use EXCLUSIVAMENTE tabelas Markdown para dados comparativos.
- Use emojis para sinalização: 🔴 Crítico/Inviável, 🟡 Atenção/Ajustar, 🟢 Viável/Excelente.
- Separe as seções com '---'.`;

    const userPrompt = `Realize uma Auditoria Estratégica profunda nas ${acoes.length} ações SAEP cadastradas. Data de referência: ${hoje}.

DADOS DAS AÇÕES PARA CRUZAMENTO:
${JSON.stringify(acoes, null, 2)}

Gere o relatório estruturado nos seguintes blocos:

---
## 🔍 ANÁLISE DE VIABILIDADE E SAÚDE DO PLANO
Analise se as ações são realistas (Prazo vs. Complexidade).
| Ação | Curso | Análise de Viabilidade | Status de Saúde |
|------|-------|------------------------|-----------------|

---
## 🔗 CRUZAMENTO DE DADOS E SINERGIAS
Identifique onde os cursos estão fazendo a mesma coisa e podem agir em conjunto.
| Padrão Identificado | Cursos Envolvidos | Sugestão de Unificação/Ação Conjunta |
|---------------------|-------------------|---------------------------------------|

---
## 🎯 PONTOS DE MELHORIA E RECOMENDAÇÕES ESTRATÉGICAS
Proponha ajustes baseados em boas práticas de gestão.
| Ação Original | O que melhorar? | Sugestão do Consultor (Como fazer melhor) | Impacto Esperado |
|---------------|-----------------|-------------------------------------------|------------------|

---
## ⚠️ ALERTAS DE RISCO OPERACIONAL
Indique o que pode impedir o sucesso do plano se nada for feito.
| Risco Identificado | Cursos Afetados | Ação de Mitigação Sugerida | Urgência |
|--------------------|-----------------|----------------------------|----------|

---
## 💡 CONSIDERAÇÕES FINAIS DO CONSULTOR
Escreva 3 parágrafos curtos sobre a maturidade estratégica geral deste plano de ação.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash", // Modelo eficiente e rápido
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, // Baixa temperatura para manter a análise técnica e menos "criativa"
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro na comunicação com o agente de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    return new Response(JSON.stringify({ analise: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-acoes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
});
