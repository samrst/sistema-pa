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

    // Identify courses with no actions
    const cursosComAcoes = [...new Set(acoes.map((a: any) => a.curso))];
    const cursosSemAcoes = CURSOS_CADASTRADOS.filter(c => !cursosComAcoes.includes(c));

    const systemPrompt = `Você é um consultor executivo sênior de gestão educacional do SENAI, especialista em análise estratégica de planos de ação SAEP.
Seu público são gerentes e diretores que precisam de uma visão clara, visual e acionável.

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
- Use EXCLUSIVAMENTE tabelas Markdown para apresentar dados (| col1 | col2 |).
- NUNCA use listas com traços (- item) para dados tabulares. SEMPRE tabelas.
- Cada seção DEVE ter uma tabela quando houver dados.
- Seja direto — frases curtas e objetivas.
- Use emojis como sinalizadores visuais: 🔴 crítico, 🟡 atenção, 🟢 ok, ⚠️ alerta, ✅ concluído, 📊 dados.
- Data de hoje: ${hoje}. Use para calcular atrasos.
- Separe cada seção com --- (linha horizontal).`;

    const userPrompt = `Analise profundamente as ${acoes.length} ações SAEP cadastradas. Data de hoje: ${hoje}.

DADOS DAS AÇÕES:
${JSON.stringify(acoes, null, 2)}

CURSOS SEM NENHUMA AÇÃO CADASTRADA: ${cursosSemAcoes.length > 0 ? cursosSemAcoes.join(", ") : "Nenhum — todos os cursos possuem ações."}

Gere o relatório executivo com EXATAMENTE estas seções, nesta ordem:

---

## 📊 VISÃO GERAL DO CENÁRIO

Tabela-resumo com indicadores consolidados:

| Indicador | Valor |
|-----------|-------|
| Total de ações cadastradas | X |
| Ações concluídas | X (Y%) |
| Ações em andamento | X (Y%) |
| Ações não iniciadas | X (Y%) |
| Ações com impeditivo | X (Y%) |
| Ações atrasadas (prazo vencido) | X |
| Cursos com ações cadastradas | X de 9 |
| Cursos SEM ações | X |

Escreva 2-3 frases de contexto sobre a situação geral.

---

## 🔗 PADRÕES EM COMUM ENTRE OS CURSOS

Esta é a seção MAIS IMPORTANTE. Analise PROFUNDAMENTE o que os cursos têm em comum.

Para cada padrão encontrado, crie uma subtabela:

**Padrão: [Nome do padrão identificado]**

| Curso | Ação relacionada | Capacidade SAEP | Status |
|-------|-----------------|-----------------|--------|
| ... | ... | ... | ... |

Depois de cada tabela, escreva 1-2 frases explicando POR QUE esse padrão é relevante para a gestão.

Identifique pelo menos:
- Problemas/dores que aparecem em mais de um curso
- Ações de mesmo tipo repetidas entre cursos
- Capacidades SAEP que concentram mais problemas
- Responsáveis que aparecem em múltiplos cursos

---

## 🎯 FOCO DAS AÇÕES: PARA ONDE ESTÃO OLHANDO?

Classifique TODAS as ações por foco e apresente em tabela:

| Foco | Quantidade | % do Total | Cursos envolvidos |
|------|-----------|------------|-------------------|
| 👨‍🏫 Capacitação Docente | X | Y% | ... |
| 👨‍🎓 Desenvolvimento do Aluno | X | Y% | ... |
| 📝 Avaliação/Instrumentos | X | Y% | ... |
| 📚 Currículo/Metodologia | X | Y% | ... |
| 🏗️ Infraestrutura/Material | X | Y% | ... |
| 🤝 Parcerias/Gestão | X | Y% | ... |

Analise: o foco está equilibrado? Há excesso em alguma área? Há lacunas?

---

## 🔴 AÇÕES CRÍTICAS E SENSÍVEIS

Tabela com TODAS as ações de criticidade "Crítico" ou risco "Alto" ou prioridade "Alta":

| Curso | Ação | Criticidade | Risco | Prioridade | Status | Prazo | Situação |
|-------|------|------------|-------|-----------|--------|-------|----------|

Onde "Situação" deve ser:
- 🔴 ATRASADA (data_fim < hoje e status ≠ Concluído)
- 🟡 PRAZO PRÓXIMO (até 7 dias)
- 🟢 NO PRAZO
- ⚠️ SEM PRAZO DEFINIDO

---

## ⚠️ CURSOS SEM CADASTRO DE AÇÕES

${cursosSemAcoes.length > 0 ? `Os seguintes cursos NÃO cadastraram nenhuma ação no plano SAEP:

| Curso | Situação |
|-------|----------|
${cursosSemAcoes.map(c => `| ${c} | 🔴 Sem ações cadastradas |`).join("\n")}

Explique por que isso é preocupante e o que a gestão deve fazer.` : "Todos os 9 cursos possuem ações cadastradas. ✅"}

---

## 📋 PANORAMA INDIVIDUAL POR CURSO

Para CADA curso que possui ações, crie uma mini-seção:

### [Nome do Curso]

| Ação | Tipo | Capacidade | Status | Risco | Prazo |
|------|------|-----------|--------|-------|-------|
| ... | ... | ... | ... | ... | ... |

**Ponto de atenção:** [1 frase sobre o principal risco ou destaque deste curso]

---

## 💡 RECOMENDAÇÕES ESTRATÉGICAS

Baseado em TODA a análise acima, apresente:

| # | Recomendação | Justificativa | Urgência |
|---|-------------|---------------|----------|
| 1 | ... | ... | 🔴 Alta / 🟡 Média / 🟢 Baixa |
| 2 | ... | ... | ... |
| 3 | ... | ... | ... |
| 4 | ... | ... | ... |
| 5 | ... | ... | ... |

Inclua recomendações sobre:
- Ações que podem ser unificadas entre cursos
- Capacitações que beneficiariam múltiplas equipes
- Cursos que precisam de atenção imediata
- Riscos sistêmicos

---

IMPORTANTE: Use APENAS tabelas Markdown para dados. Nunca use listas com traços para apresentar dados que caberiam em tabela. Mantenha frases analíticas curtas e diretas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
