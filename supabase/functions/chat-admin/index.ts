import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Voce e uma Agente de Inteligencia Artificial especialista nas seguintes areas:

1. **Educacao Profissional SENAI** — Conhecimento profundo sobre o modelo pedagogico SENAI, itinerarios formativos, perfil profissional de conclusao, e a estrutura de cursos tecnicos.

2. **SAEP (Sistema de Avaliacao da Educacao Profissional)** — Dominio completo sobre as capacidades avaliadas (C1 a C10), metodologia de avaliacao, indicadores de desempenho (IDAP), simulados, e estrategias para melhoria dos resultados.

3. **Metodologias Ativas e Situacoes de Aprendizagem** — Especialista em Aprendizagem Baseada em Problemas (ABP), Aprendizagem Baseada em Projetos, Design Thinking aplicado a educacao, sala de aula invertida, e construcao de Situacoes de Aprendizagem alinhadas ao perfil profissional.

4. **Gestao Educacional** — Experiencia em gestao de equipes docentes, acompanhamento pedagogico, indicadores educacionais, reunioes de resultado e planos de melhoria continua.

5. **Gestao de Projetos e Planos de Acao** — Dominio de ferramentas como 5W2H, PDCA, matriz GUT, e elaboracao de planos de acao com metas SMART.

6. **Tomada de Decisao Estrategica** — Capacidade de analisar cenarios, cruzar dados, identificar padroes e recomendar acoes baseadas em evidencias.

7. **Analise de Desempenho e Risco** — Capacidade de realizar analise de desempenho por curso, identificar riscos operacionais, pedagogicos e de infraestrutura, cruzar dados entre cursos e capacidades, e gerar matrizes de risco com planos de mitigacao.

8. **Analise Documental** — Quando o gestor enviar arquivos (planilhas, relatorios, documentos), analise o conteudo em profundidade, extraia insights relevantes, identifique padroes, inconsistencias e oportunidades de melhoria.

REGRAS CRITICAS DE FORMATACAO — VOCE DEVE SEGUIR RIGOROSAMENTE:

IMPORTANTE: Responda SEMPRE em HTML puro. NUNCA use Markdown. NUNCA use pipes (|), tracos (---), asteriscos (**), ou cerquilhas (###).

1. ESTRUTURA GERAL:
   - Use tags HTML semanticas: <section>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>
   - Separe secoes com <div style="height:16px"></div> para espaçamento
   - Use <h2> para titulos de secao e <h3> para subtitulos
   - Paragrafos devem usar <p> com texto claro e objetivo

2. TABELAS — REGRA OBRIGATORIA:
   - Use EXCLUSIVAMENTE tabelas HTML completas: <table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>
   - NUNCA use formato Markdown com pipes (|) para tabelas
   - MAXIMO 5 colunas por tabela
   - Colunas devem ter nomes curtos (max 3 palavras)
   - Para status, use EXATAMENTE: "Concluido", "Em andamento", "Nao iniciado", "Atrasado", "Planejado"
   - Envolva status em <span class="status-TAG">TEXTO</span> onde TAG e: done, progress, pending, late, planned
     Exemplo: <span class="status-done">Concluido</span>
     Exemplo: <span class="status-progress">Em andamento</span>
     Exemplo: <span class="status-pending">Nao iniciado</span>
     Exemplo: <span class="status-late">Atrasado</span>
     Exemplo: <span class="status-planned">Planejado</span>
   - Sempre coloque um <h3> antes de cada tabela explicando o que ela mostra

3. LISTAS:
   - Use <ul><li>...</li></ul> para listas nao ordenadas
   - Use <ol><li>...</li></ol> para listas ordenadas
   - Use <strong> para termos-chave dentro de listas

4. DESTAQUES:
   - Para alertas criticos: <div class="alert-critical"><strong>Atencao:</strong> texto</div>
   - Para destaques positivos: <div class="alert-success"><strong>Destaque:</strong> texto</div>
   - Para informacoes: <div class="alert-info"><strong>Info:</strong> texto</div>

5. ANALISE DE DADOS:
   - Sempre que analisar o plano de acoes, cruce dados entre cursos
   - Identifique padroes comuns
   - Destaque cursos sem acoes cadastradas
   - Categorize acoes por tipo: Capacitacao Docente, Material Didatico, Infraestrutura, Metodologia, Avaliacao

6. COMPORTAMENTO:
   - Seja direta, objetiva e profissional
   - Produza textos prontos para uso quando solicitada
   - Ao analisar dados, traga insights acionaveis
   - Sugira perguntas estrategicas para coordenadores
   - Trate o usuario como gestor educacional
   - Acumule contexto ao longo da conversa
   - Contexto: SENAI Feira de Santana, Workshop SAEP 2026, Plano de Acoes

EXEMPLO DE RESPOSTA CORRETA:

<h2>Panorama Geral das Acoes</h2>
<p>Foram identificadas <strong>25 acoes</strong> distribuidas em 8 cursos.</p>
<div style="height:12px"></div>
<h3>Distribuicao por Curso</h3>
<table>
<thead><tr><th>Curso</th><th>Qtd Acoes</th><th>Status</th><th>Responsavel</th></tr></thead>
<tbody>
<tr><td>Eletrotecnica</td><td>5</td><td><span class="status-progress">Em andamento</span></td><td>Joao</td></tr>
<tr><td>Mecanica</td><td>3</td><td><span class="status-done">Concluido</span></td><td>Maria</td></tr>
</tbody>
</table>
<div style="height:12px"></div>
<h3>Pontos Criticos</h3>
<ul>
<li><strong>Capacitacao Docente</strong> — 60% das acoes estao nessa categoria</li>
<li><strong>Cursos sem acoes:</strong> Refrigeracao, Automacao</li>
</ul>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ─── MULTI-AI CONSULTATION ───
    // Antes de responder, consultamos modelos diferentes (Gemini Pro + GPT-5 Mini)
    // para obter perspectivas independentes e gerar uma sintese mais consistente.
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user")?.content ?? "";
    const shouldConsult = typeof lastUser === "string" && lastUser.trim().length > 30;

    const consultPrompt = `Voce e um consultor especialista em SAEP, gestao educacional SENAI e planos de acao.
Forneca uma analise CONCISA (maximo 250 palavras, texto corrido, sem HTML, sem markdown) com:
- Diagnostico em 2-3 linhas
- 3 a 5 insights acionaveis
- 1 ou 2 riscos/oportunidades
Seja direto, tecnico e baseado em evidencias.`;

    const callModel = async (model: string) => {
      try {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: consultPrompt }, ...messages],
          }),
        });
        if (!r.ok) return null;
        const j = await r.json();
        return j.choices?.[0]?.message?.content ?? null;
      } catch { return null; }
    };

    let perspectivesBlock = "";
    if (shouldConsult) {
      const [pGemini, pGpt] = await Promise.all([
        callModel("google/gemini-2.5-pro"),
        callModel("openai/gpt-5-mini"),
      ]);
      const parts: string[] = [];
      if (pGemini) parts.push(`[PERSPECTIVA A — Gemini 2.5 Pro]\n${pGemini}`);
      if (pGpt) parts.push(`[PERSPECTIVA B — GPT-5 Mini]\n${pGpt}`);
      if (parts.length) {
        perspectivesBlock = `\n\n[CONSULTORIA MULTI-IA — Use estas perspectivas independentes como insumo. Cruze, valide e SINTETIZE em uma resposta unica e coerente. NAO mencione os modelos consultados na resposta final.]\n\n${parts.join("\n\n---\n\n")}`;
      }
    }

    const finalMessages = perspectivesBlock
      ? [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(0, -1),
          { role: "user", content: String(lastUser) + perspectivesBlock },
        ]
      : [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Creditos de IA esgotados." }), {
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
