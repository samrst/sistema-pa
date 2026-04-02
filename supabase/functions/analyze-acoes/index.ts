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

    // --- CONFIGURAÇÃO DO AGENTE (FORMATO ULTRA ESPAÇADO) ---
    const systemPrompt = `Você é um Consultor Estratégico Sênior do SENAI. 
Sua resposta deve ser um RELATÓRIO EXECUTIVO com ESPAÇAMENTO AMPLO e visual limpo.

REGRAS DE FORMATAÇÃO VISUAL (OBRIGATÓRIAS):
1. PULE DUAS LINHAS entre cada seção e entre cada item de análise.
2. NUNCA use tabelas Markdown (|---|).
3. Use LINHAS DIVISORAS LONGAS (════) para criar separação visual clara.
4. Use RECUOS e espaços para hierarquizar as informações.
5. Use emojis apenas como marcadores de status: 🔴, 🟡, 🟢.`;

    const userPrompt = `Analise as ${acoes.length} ações do plano SAEP para viabilidade e cruzamento de dados. 

DADOS PARA ANÁLISE:
${JSON.stringify(acoes, null, 2)}

ESTRUTURE O TEXTO EXATAMENTE ASSIM (RESPEITANDO OS ESPAÇOS DUPLOS):

══════════════════════════════════════════════════
📊  DIAGNÓSTICO ESTRATÉGICO DO PLANO
══════════════════════════════════════════════════


[Escreva aqui um resumo executivo de 4 linhas sobre a saúde do plano]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍  CRUZAMENTO DE DADOS E SINERGIAS (PONTOS EM COMUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


• PADRÃO IDENTIFICADO: [Nome do Padrão]

• CURSOS ENVOLVIDOS: [Lista de Cursos]

• ANÁLISE TÉCNICA: [Por que unificar e qual o ganho de eficiência?]


(Pule duas linhas antes do próximo padrão)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯  ANÁLISE DE VIABILIDADE E MELHORIAS POR AÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


• AÇÃO: [Nome]

• STATUS: 🔴/🟡/🟢

• CRÍTICA DO CONSULTOR: [Análise sobre prazo e viabilidade]

• PROPOSTA DE MELHORIA: [Como tornar essa ação mais estratégica]


(Pule duas linhas antes da próxima ação)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡  RECOMENDAÇÕES FINAIS (PRÓXIMOS PASSOS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


1. [Recomendação 1] - Prioridade Máxima

2. [Recomendação 2] - Prioridade Média


══════════════════════════════════════════════════
FIM DO RELATÓRIO DE CONSULTORIA
══════════════════════════════════════════════════`;

    // --- CHAMADA PARA A API ---
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
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