import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Voce e um Consultor Estrategico Senior do SENAI.
Sua resposta deve ser um RELATORIO EXECUTIVO em HTML puro.

REGRAS CRITICAS DE FORMATACAO — SIGA RIGOROSAMENTE:

IMPORTANTE: Responda SEMPRE em HTML puro. NUNCA use Markdown. NUNCA use pipes (|), tracos (---), asteriscos (**), ou cerquilhas (###).

1. ESTRUTURA GERAL:
   - Use tags HTML semanticas: <section>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>
   - Separe secoes com <div style="height:20px"></div> para espacamento amplo
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
   - Sempre coloque um <h3> antes de cada tabela explicando o que ela mostra

3. LISTAS:
   - Use <ul><li>...</li></ul> para listas nao ordenadas
   - Use <ol><li>...</li></ol> para listas ordenadas
   - Use <strong> para termos-chave dentro de listas

4. DESTAQUES:
   - Para alertas criticos: <div class="alert-critical"><strong>Atencao:</strong> texto</div>
   - Para destaques positivos: <div class="alert-success"><strong>Destaque:</strong> texto</div>
   - Para informacoes: <div class="alert-info"><strong>Info:</strong> texto</div>

5. ESTRUTURA DO RELATORIO:
   - Secao 1: <h2>Diagnostico Estrategico do Plano</h2> — resumo executivo de 4-5 linhas
   - Secao 2: <h2>Cruzamento de Dados e Sinergias</h2> — padroes em comum entre cursos, com tabela
   - Secao 3: <h2>Analise de Viabilidade por Acao</h2> — cada acao analisada com status, critica e melhoria, com tabela
   - Secao 4: <h2>Recomendacoes Finais</h2> — proximos passos priorizados

6. COMPORTAMENTO:
   - Seja direto, objetivo e profissional
   - Ao analisar dados, traga insights acionaveis
   - Identifique cursos sem acoes cadastradas
   - Categorize acoes por tipo
   - Use espacamento generoso entre secoes`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { acoes } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("LOVABLE_API_KEY nao configurada no Supabase Secrets.");
    }

    if (!acoes || acoes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma acao para analisar." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const userPrompt = `Analise as ${acoes.length} acoes do plano SAEP para viabilidade e cruzamento de dados.

DADOS PARA ANALISE:
${JSON.stringify(acoes, null, 2)}

Gere o relatorio executivo completo em HTML puro seguindo as regras do sistema.`;

    // Chamada oficial da API do Gemini usando a SDK
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    const content =
      response.text || "<p>Nao foi possivel gerar a analise.</p>";

    // Retorna a chave "analise" exatamente como o seu frontend espera
    return new Response(JSON.stringify({ analise: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-acoes error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});