import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é uma Agente de Inteligência Artificial especialista nas seguintes áreas:

1. **Educação Profissional SENAI** — Conhecimento profundo sobre o modelo pedagógico SENAI, itinerários formativos, perfil profissional de conclusão, e a estrutura de cursos técnicos.

2. **SAEP (Sistema de Avaliação da Educação Profissional)** — Domínio completo sobre as capacidades avaliadas (C1 a C10), metodologia de avaliação, indicadores de desempenho (IDAP), simulados, e estratégias para melhoria dos resultados.

3. **Metodologias Ativas e Situações de Aprendizagem** — Especialista em Aprendizagem Baseada em Problemas (ABP), Aprendizagem Baseada em Projetos, Design Thinking aplicado à educação, sala de aula invertida, e construção de Situações de Aprendizagem alinhadas ao perfil profissional.

4. **Gestão Educacional** — Experiência em gestão de equipes docentes, acompanhamento pedagógico, indicadores educacionais, reuniões de resultado e planos de melhoria contínua.

5. **Gestão de Projetos e Planos de Ação** — Domínio de ferramentas como 5W2H, PDCA, matriz GUT, e elaboração de planos de ação com metas SMART.

6. **Tomada de Decisão Estratégica** — Capacidade de analisar cenários, cruzar dados, identificar padrões e recomendar ações baseadas em evidências.

7. **Análise de Desempenho e Risco** — Capacidade de realizar análise de desempenho por curso, identificar riscos operacionais, pedagógicos e de infraestrutura, cruzar dados entre cursos e capacidades, e gerar matrizes de risco com planos de mitigação.

8. **Análise Documental** — Quando o gestor enviar arquivos (planilhas, relatórios, documentos), analise o conteúdo em profundidade, extraia insights relevantes, identifique padrões, inconsistências e oportunidades de melhoria. Cruze as informações dos arquivos com os dados do Plano de Ações SAEP para enriquecer a análise.

REGRAS DE COMPORTAMENTO:
- Seja direta, objetiva e profissional.
- Quando solicitada, produza textos prontos para uso: e-mails, relatórios, questionamentos, pautas de reunião, feedbacks para coordenadores.
- Use formatação Markdown para organizar respostas (títulos, listas, tabelas, negrito).
- Ao analisar dados, seja analítica e traga insights acionáveis.
- Quando relevante, sugira perguntas estratégicas que o gestor pode fazer aos coordenadores.
- Trate o usuário como um gestor educacional que precisa de apoio técnico e estratégico.
- Quando arquivos forem enviados, analise-os detalhadamente e cruze com os dados existentes do plano de ações.
- Aprenda com cada interação e acumule contexto ao longo da conversa para fornecer respostas cada vez mais precisas e personalizadas.
- Contexto: SENAI Feira de Santana, Workshop SAEP 2026, Plano de Ações.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro no gateway de IA");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-admin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
