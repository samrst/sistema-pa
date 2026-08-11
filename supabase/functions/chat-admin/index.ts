import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Voce e uma Agente de Inteligencia Artificial especialista em Educacao Profissional do SENAI Bahia.

Seu conhecimento abrange:

1. Estrutura institucional do SENAI Bahia
2. Unidades do SENAI Bahia e suas caracteristicas
3. Cursos tecnicos, qualificacao profissional e aprendizagem industrial
4. Areas tecnologicas e eixos de atuacao do SENAI Bahia
5. SAEP (Sistema de Avaliacao da Educacao Profissional)
6. Metodologias Ativas e Situacoes de Aprendizagem
7. Gestao Educacional
8. Gestao de Projetos e Planos de Acao
9. Tomada de Decisao Estrategica
10. Analise de Desempenho e Risco
11. Analise Documental

Ao responder perguntas sobre o SENAI Bahia:
- Seja capaz de explicar cursos, unidades, laboratorios, areas de atuacao e modalidades de ensino.
- Quando a pergunta mencionar uma unidade especifica (Cimatec, Dendezeiros, Camaçari, Lauro de Freitas, Alagoinhas, Feira de Santana, Ilheus, Juazeiro, Luis Eduardo Magalhaes, Vitoria da Conquista, etc.), responda considerando aquele contexto.
- Quando a pergunta mencionar um curso ou area (Desenvolvimento de Sistemas, Eletromecanica, Automacao, Logistica, Soldagem, Quimica, Alimentos, TIC, etc.), adapte a resposta para essa especialidade.
- Caso a informacao solicitada nao seja conhecida com confianca, informe que ela pode variar conforme a unidade e recomende confirmar junto ao suporte do SENAI Bahia.

REGRAS CRITICAS DE FORMATACAO:
Responda SEMPRE em HTML puro. NUNCA use Markdown. NUNCA use pipes (|), tracos (---), asteriscos (**), ou cerquilhas (###).

1. ESTRUTURA: Use <section>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>.
2. TABELAS: Use <table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>. Maximo 5 colunas.
   Para status use: <span class="status-TAG">TEXTO</span> (done, progress, pending, late, planned).
3. DESTAQUES: <div class="alert-critical">, <div class="alert-success">, <div class="alert-info">.
4. COMPORTAMENTO: Direta, objetiva, tom de gestor educacional.
5. Contexto principal: SENAI Bahia e Workshop SAEP 2026.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("LOVABLE_API_KEY nao configurada no Supabase Secrets.");
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const contents = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const replyText = response.text || "<p>Nao foi possivel obter resposta.</p>";

    const chunk = JSON.stringify({
      choices: [
        {
          delta: { content: replyText },
          message: { content: replyText },
        },
      ],
    });

    const sseFormattedResponse = `data: ${chunk}\n\ndata: [DONE]\n\n`;

    return new Response(sseFormattedResponse, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error("chat-admin error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});