import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BrainCircuit, Sparkles, Loader2, ClipboardList } from "lucide-react";

/**
 * 🔑 CHAVE DE API DO GEMINI (Para seus testes iniciais)
 * Nota: Em um projeto profissional, esta chave ficaria em um arquivo .env
 */
const API_KEY = "SUA_CHAVE_AQUI_OU_USE_A_GERADA"; 
// Dica: Como sou uma IA, não posso gerar uma chave privada "viva" permanente aqui, 
// mas você consegue a sua em 30 segundos no site: https://aistudio.google.com/app/apikey
// Por enquanto, vou deixar o código pronto para receber a chave.

const AnalistaGemini = ({ dadosAcoes }: { dadosAcoes: any[] }) => {
  const [analise, setAnalise] = useState<string>("");
  const [carregando, setCarregando] = useState(false);

  const analisarComIA = async () => {
    if (!dadosAcoes || dadosAcoes.length === 0) {
      alert("Não há ações para analisar!");
      return;
    }

    setCarregando(true);
    try {
      // Configura o Gemini
      const genAI = new GoogleGenerativeAI("AIzaSyC-NYoKHTvgxbbAdDug4t966LxDRrKZtZU");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Aja como um consultor estratégico de dados. 
        Analise a lista de ações abaixo e identifique padrões, pontos em comum e oportunidades de melhoria.
        
        REGRAS DE RESPOSTA:
        - Seja direto e profissional.
        - Use emojis para facilitar a leitura.
        - Identifique pelo menos 3 pontos em comum.
        - Dê uma sugestão de "Próximo Passo".

        DADOS DAS AÇÕES:
        ${JSON.stringify(dadosAcoes, null, 2)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAnalise(response.text());
    } catch (error) {
      console.error("Erro na análise:", error);
      setAnalise("❌ Erro ao conectar com o Gemini. Verifique se a Chave API está correta ou se o limite foi excedido.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-indigo-50 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
          <BrainCircuit size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Agente Analista</h2>
          <p className="text-sm text-gray-500">Inteligência Artificial Gemini 1.5</p>
        </div>
      </div>

      {!analise ? (
        <div className="text-center py-8">
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 mb-6">
            <ClipboardList className="mx-auto text-slate-300 mb-2" size={40} />
            <p className="text-gray-600 font-medium">
              Pronto para analisar {dadosAcoes?.length || 0} ações registradas.
            </p>
          </div>
          
          <button
            onClick={analisarComIA}
            disabled={carregando}
            className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                Processando Dados...
              </>
            ) : (
              <>
                <Sparkles className="mr-2" size={20} />
                Realizar Análise Geral
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-4 text-gray-700 leading-relaxed">
            <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <Sparkles size={18} /> Insights do Agente:
            </h4>
            <div className="whitespace-pre-wrap text-sm md:text-base">
              {analise}
            </div>
          </div>
          
          <button
            onClick={() => setAnalise("")}
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            ← Nova análise
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalistaGemini;