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

    const hoje = new Date().toISOString().slice(0, 10);

    const systemPrompt = `Você é um executivo de gestão educacional do SENAI, especialista em análise estratégica de planos de ação.
Seu papel é gerar relatórios gerenciais claros, diretos e acionáveis para a alta gestão.

REGRAS DE FORMATAÇÃO:
- Use tabelas Markdown sempre que possível para organizar dados (use | coluna1 | coluna2 |).
- Seja direto e objetivo — evite textos longos sem estrutura.
- Use emojis com moderação para sinalização visual (🔴 🟡 🟢 ⚠️ ✅).
- Estruture em seções claras com títulos em negrito.
- A data de hoje é: ${hoje}. Use isso para calcular atrasos e proximidade de prazos.`;

    const userPrompt = `Analise as ${acoes.length} ações do plano SAEP como um executivo de gestão educacional. Data de hoje: ${hoje}.

DADOS DAS AÇÕES:
${JSON.stringify(acoes, null, 2)}

Gere o relatório executivo com EXATAMENTE estas seções:

---

## 1. 📊 Painel Executivo
Tabela resumo com: Total de ações | Concluídas | Em andamento | Não iniciadas | Com impeditivo | Atrasadas (data_fim < hoje e status ≠ Concluído).
Calcule os percentuais.

## 2. 🔴 Monitoramento de Prazos (CRÍTICO)
Tabela com TODAS as ações que estão atrasadas ou com prazo próximo (até 7 dias), com colunas:
| Curso | Ação (resumida) | Responsável | Data Fim | Status | Situação |

Onde "Situação" é:
- 🔴 ATRASADA (data_fim < hoje e status ≠ Concluído)
- 🟡 PRAZO PRÓXIMO (data_fim nos próximos 7 dias)
- ⚠️ SEM PRAZO DEFINIDO (data_fim vazia)

Se não houver ações nessas condições, informe isso.

## 3. 🔗 Cruzamentos e Padrões Identificados
Analise cruzamentos entre cursos — o que os professores estão fazendo em comum? Quais ações se repetem? Quais capacidades SAEP concentram mais problemas?
Apresente em tabela quando possível:
| Padrão Identificado | Cursos Envolvidos | Frequência |

## 4. 📋 Panorama por Curso
Para cada curso com ações cadastradas, faça uma mini-tabela:
| Ação | Tipo | Status | Risco | Prazo |
Adicione uma linha de observação abaixo de cada tabela com o ponto de atenção principal daquele curso.

## 5. 💡 Sugestões Estratégicas da IA
Com base nos padrões identificados, sugira:
- Ações que poderiam ser unificadas entre cursos (economia de esforço)
- Capacitações que beneficiariam múltiplas equipes
- Riscos sistêmicos que precisam de atenção da gestão
- Oportunidades de melhoria baseadas no que está funcionando

## 6. ✅ Recomendações Imediatas para a Gestão
Lista numerada das 3-5 ações mais urgentes que a gestão deve tomar AGORA, com justificativa curta.

---
Seja direto, use tabelas, e foque no que a gestão precisa saber para tomar decisões.`;

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
