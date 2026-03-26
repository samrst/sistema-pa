import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {

const systemPrompt = `Você é um Consultor Estratégico Sênior do SENAI. 
Sua resposta deve ser um RELATÓRIO EXECUTIVO LIMPO, sem o uso de tabelas Markdown (|---|).

REGRAS DE FORMATAÇÃO VISUAL:
1. Use LINHAS DIVISORAS para separar seções (ex: ════════════════════════).
2. Use TÍTULOS EM CAIXA ALTA para facilitar a leitura rápida.
3. Para dados comparativos, use o formato de LISTA ROTULADA (ex: • CURSO: Nome do Curso).
4. Use ESPAÇAMENTO DUPLO entre blocos de informação para não poluir a visão.
5. Use emojis apenas como marcadores de status: 🔴 (Crítico), 🟡 (Atenção), 🟢 (OK).`;

    const userPrompt = `Analise as ${acoes.length} ações do plano SAEP e gere o relatório seguindo este layout:

══════════════════════════════════════════════════
📊 DIAGNÓSTICO ESTRATÉGICO DO PLANO
══════════════════════════════════════════════════
[Escreva aqui um resumo executivo de 4 linhas sobre a viabilidade geral das ações e saúde dos prazos]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 CRUZAMENTO DE DADOS E SINERGIAS (PONTOS EM COMUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nesta seção, identifique quais cursos possuem ações que podem ser unificadas.

• PADRÃO IDENTIFICADO: [Ex: Capacitação em Metodologias]
• CURSOS ENVOLVIDOS: [Lista de Cursos]
• ANÁLISE: [Por que unificar e qual o ganho de eficiência?]

(Repita para cada padrão encontrado)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ANÁLISE DE VIABILIDADE E MELHORIAS POR AÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Selecione as ações mais sensíveis e aplique a consultoria:

• AÇÃO: [Nome]
• STATUS: 🔴/🟡/🟢
• CRÍTICA DO CONSULTOR: [Análise sobre prazo, custo e meta]
• PROPOSTA DE MELHORIA: [Como tornar essa ação mais estratégica]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMENDAÇÕES FINAIS (PRÓXIMOS PASSOS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Liste 3 a 5 recomendações prioritárias para a diretoria, com foco em gestão de curto e médio prazo]

DADOS PARA ANÁLISE:
${JSON.stringify(acoes, null, 2)}`;
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











const systemPrompt = `Você é um Consultor Estratégico Sênior do SENAI. 
Sua resposta deve ser um RELATÓRIO EXECUTIVO com ESPAÇAMENTO AMPLO.

REGRAS DE FORMATAÇÃO VISUAL (OBRIGATÓRIAS):
1. PULE DUAS LINHAS entre cada seção e entre cada item de análise.
2. NUNCA use tabelas Markdown (|---|).
3. Use LINHAS DIVISORAS LONGAS para criar separação visual clara.
4. Use RECUOS (espaços em branco) para hierarquizar as informações.
5. Use emojis apenas como marcadores: 🔴, 🟡, 🟢.`;

    const userPrompt = `Analise as ${acoes.length} ações do plano SAEP e gere o relatório com o máximo de clareza visual. 

DADOS PARA ANÁLISE:
${JSON.stringify(acoes, null, 2)}

ESTRUTURE O TEXTO EXATAMENTE ASSIM (RESPEITANDO OS ESPAÇOS):

══════════════════════════════════════════════════
📊  DIAGNÓSTICO ESTRATÉGICO DO PLANO
══════════════════════════════════════════════════


[Escreva o resumo executivo aqui com 4 linhas]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍  CRUZAMENTO DE DADOS E SINERGIAS (PONTOS EM COMUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


• PADRÃO IDENTIFICADO: [Nome do Padrão]

• CURSOS ENVOLVIDOS: [Lista de Cursos]

• ANÁLISE TÉCNICA: [Por que unificar e qual o ganho?]


(Pule duas linhas antes do próximo padrão)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯  ANÁLISE DE VIABILIDADE E MELHORIAS POR AÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


• AÇÃO: [Nome]

• STATUS: 🔴/🟡/🟢

• CRÍTICA DO CONSULTOR: [Análise técnica]

• PROPOSTA DE MELHORIA: [Sugestão estratégica]


(Pule duas linhas antes da próxima ação)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡  RECOMENDAÇÕES FINAIS (PRÓXIMOS PASSOS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


1. [Recomendação 1] - Prioridade Máxima

2. [Recomendação 2] - Prioridade Média


══════════════════════════════════════════════════
FIM DO RELATÓRIO DE CONSULTORIA
══════════════════════════════════════════════════`;












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


const systemPrompt = `Você é um Consultor Estratégico Sênior. 
Sua resposta deve ser extremamente organizada visualmente, fácil de ler em qualquer tela.

REGRAS DE FORMATAÇÃO VISUAL:
1. USE TÍTULOS EM CAIXA ALTA para seções (ex: === ANÁLISE DE VIABILIDADE ===).
2. USE ESPAÇAMENTOS: Deixe uma linha em branco entre cada item.
3. USE MARCADORES VISUAIS: Em vez de tabelas complexas, use blocos de texto estruturados.
4. EMOJIS: Use 🚩 para riscos, 💎 para oportunidades e 📈 para tendências.
5. NÃO USE barras verticais (|) ou tabelas Markdown complexas.`;

    const userPrompt = `Analise as ações SAEP abaixo e gere um RELATÓRIO EXECUTIVO ESTRATÉGICO.

DADOS: ${JSON.stringify(acoes)}

ESTRUTURE O TEXTO EXATAMENTE ASSIM:

==================================================
📊 DIAGNÓSTICO GERAL DA GESTÃO
==================================================
(Escreva aqui um resumo de 3 linhas sobre a saúde do plano)

--------------------------------------------------
🔍 CRUZAMENTO DE DADOS (PONTOS EM COMUM)
--------------------------------------------------
• PADRÃO IDENTIFICADO: [Nome]
• CURSOS: [Listar cursos]
• SUGESTÃO: [Sugestão de unificação]

(Repita para cada padrão)

--------------------------------------------------
🎯 ANÁLISE DE VIABILIDADE E MELHORIAS
--------------------------------------------------
AÇÃO: [Nome da Ação]
CURSO: [Nome]
VIABILIDADE: 🟢 Alta / 🟡 Média / 🔴 Baixa
POR QUE: [Explicação curta]
MELHORIA SUGERIDA: [Sugestão técnica]

--------------------------------------------------
💡 RECOMENDAÇÕES FINAIS (PRÓXIMOS PASSOS)
--------------------------------------------------
1. [Recomendação 1] - Urgência: Máxima
2. [Recomendação 2] - Urgência: Média
`;






});
