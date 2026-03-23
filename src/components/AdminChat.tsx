import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, BrainCircuit, Trash2, Sparkles, Paperclip, Mic, MicOff, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { useAcoes } from "@/hooks/useAcoes";
import AdminChatActions from "@/components/AdminChatActions";

type Msg = { role: "user" | "assistant"; content: string };
type AttachedFile = { name: string; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-admin`;

const SUGGESTIONS = [
  "Analise as ações cadastradas e identifique os 3 principais pontos críticos que devo abordar com os coordenadores.",
  "Elabore um e-mail para os coordenadores cobrando o preenchimento do plano de ações SAEP.",
  "Quais perguntas estratégicas devo fazer na próxima reunião de acompanhamento pedagógico?",
  "Crie uma pauta de reunião para discutir os resultados do SAEP com os coordenadores.",
];

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
    onError(err.error || "Erro ao conectar com a IA");
    return;
  }

  if (!resp.body) { onError("Sem resposta da IA"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

// ─── Speech Recognition Hook ───
function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        onResult(last[0].transcript);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, onResult]);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  return { isListening, toggle };
}

// ─── Main Component ───
const AdminChat = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: acoes } = useAcoes();

  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => prev ? prev + " " + text : text);
  }, []);

  const { isListening, toggle: toggleMic } = useSpeechRecognition(handleVoiceResult);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const content = await readFileAsText(file);
        setAttachedFiles(prev => [...prev, { name: file.name, content: content.slice(0, 50000) }]);
      } catch {
        setAttachedFiles(prev => [...prev, { name: file.name, content: `[Não foi possível ler o arquivo ${file.name}]` }]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const send = async (text: string) => {
    if ((!text.trim() && attachedFiles.length === 0) || isLoading) return;

    let fullContent = text;
    if (attachedFiles.length > 0) {
      const filesContext = attachedFiles.map(f =>
        `\n\n--- ARQUIVO ANEXADO: ${f.name} ---\n${f.content}\n--- FIM DO ARQUIVO ---`
      ).join("");
      fullContent = text + filesContext;
    }

    const userMsg: Msg = { role: "user", content: fullContent };
    const displayMsg: Msg = { role: "user", content: text || `📎 ${attachedFiles.map(f => f.name).join(", ")}` };

    // Build context messages
    const contextMessages = [...messages];
    if (contextMessages.length === 0 && acoes && acoes.length > 0) {
      contextMessages.push({
        role: "user",
        content: `[CONTEXTO DO SISTEMA - Dados atuais do Plano de Ações SAEP com ${acoes.length} ações cadastradas]:\n${JSON.stringify(acoes, null, 2)}\n\n[FIM DO CONTEXTO - A partir de agora, responda normalmente às perguntas do gestor.]`,
      });
      contextMessages.push({
        role: "assistant",
        content: "Entendido. Tenho acesso aos dados do Plano de Ações SAEP. Como posso ajudá-lo?",
      });
    }

    setMessages(prev => [...prev, displayMsg]);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...contextMessages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          setMessages(prev => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Erro de conexão com a IA." }]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            Agente IA — Assessoria Estratégica
            <Sparkles size={14} className="text-primary" />
          </h2>
          <p className="text-xs text-muted-foreground">
            Especialista em SAEP, Gestão Educacional e Planos de Ação
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs text-muted-foreground"
            onClick={() => setMessages([])}
          >
            <Trash2 size={14} className="mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
            <div className="p-4 bg-primary/5 rounded-2xl">
              <BrainCircuit size={40} className="text-primary/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Como posso ajudar na gestão?</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Posso analisar dados, elaborar e-mails, criar pautas de reunião e muito mais. Você pode digitar, usar o microfone ou anexar arquivos.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="text-left text-xs p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {m.role === "assistant" ? (
                  <div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    {!isLoading && m.content && <AdminChatActions content={m.content} />}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 px-1">
          {attachedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs bg-muted rounded-lg px-2.5 py-1.5 border border-border">
              <FileText size={12} className="text-primary shrink-0" />
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-3 mt-3">
        <div className="flex gap-2 items-end">
          {/* File attach */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.csv,.json,.xml,.md,.html,.log,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-[44px] w-[44px] text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Anexar arquivo"
          >
            <Paperclip size={18} />
          </Button>

          {/* Mic */}
          <Button
            variant={isListening ? "default" : "ghost"}
            size="icon"
            className={`shrink-0 h-[44px] w-[44px] ${isListening ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse" : "text-muted-foreground hover:text-primary"}`}
            onClick={toggleMic}
            disabled={isLoading}
            title={isListening ? "Parar gravação" : "Usar microfone"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "🎙️ Ouvindo... fale agora" : "Digite sua mensagem..."}
            className="resize-none min-h-[44px] max-h-[120px] text-sm"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={() => send(input)}
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
