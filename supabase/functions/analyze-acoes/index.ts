import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const systemPrompt = `Você é um consultor estratégico especializado em educação profissional e técnica do SENAI.
Seu papel é analisar planos de ação do Workshop SAEP e gerar relatórios executivos claros.

REGRAS:
- Seja direto, profissional e objetivo.
- Use emojis para facilitar a leitura visual.
- Estruture a resposta em seções claras com títulos em negrito.
- Sempre inclua: Resumo Executivo, Pontos em Comum, Riscos Identificados, Recomendações Prioritárias e Próximos Passos.
- Identifique padrões entre cursos, capacidades SAEP, tipos de ação e status.
- Destaque ações atrasadas ou com risco alto.
- Forneça sugestões práticas e acionáveis.`;

    const userPrompt = `Analise as ${acoes.length} ações do plano SAEP abaixo e gere um relatório executivo completo:

DADOS DAS AÇÕES:
${JSON.stringify(acoes, null, 2)}

Gere o relatório com as seguintes seções:
1. 📊 **Resumo Executivo** — visão geral dos números
2. 🔗 **Pontos em Comum** — padrões identificados entre as ações (mínimo 3)
3. ⚠️ **Riscos e Alertas** — ações com risco alto, atrasadas ou com impeditivos
4. 🎯 **Recomendações Prioritárias** — top 3 ações mais urgentes
5. 📈 **Análise por Curso** — distribuição e observações por curso
6. ✅ **Próximos Passos** — sugestões concretas para o time`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos nas configurações." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro no gateway de IA");
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
