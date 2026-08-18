import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, BrainCircuit, Trash2, Sparkles, Paperclip, Mic, MicOff, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DOMPurify from "dompurify";
import { useAcoes } from "@/hooks/useAcoes";
import AdminChatActions from "@/components/AdminChatActions";
import { API_BASE_URL, getAuthHeaders } from "@/services/api";

type Msg = { role: "user" | "assistant"; content: string };
type AttachedFile = { name: string; content: string };

const CHAT_URL = `${API_BASE_URL}/api/chat`;

const SUGGESTIONS = [
  "Quais ações cadastradas ainda não foram iniciadas e quais cursos concentram a maior quantidade dessas ações?",
  "Quais ações estão relacionadas à padronização de materiais e metodologias e qual o status de execução dessas ações?",
  "Quais são as ações relacionadas a reforço de competências básicas (leitura e matemática) e em quais cursos elas estão sendo aplicadas?",
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
    headers: getAuthHeaders(),
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

/* Sanitize config — allow our status classes and table tags */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr", "div", "span", "section",
    "strong", "em", "b", "i", "u",
    "ul", "ol", "li",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "a", "blockquote", "pre", "code",
  ],
  ALLOWED_ATTR: ["class", "style", "href", "target", "rel", "colspan", "rowspan"],
};

function sanitizeHtml(raw: string): string {
  return DOMPurify.sanitize(raw, SANITIZE_CONFIG);
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
          setMessages(prev => [...prev, { role: "assistant", content: `<p style="color:red">❌ ${msg}</p>` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: '<p style="color:red">❌ Erro de conexão com a IA.</p>' }]);
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
        <div className="p-2.5 bg-primary/10 rounded-[0.75rem] text-primary">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h2 className="text-base font-heading font-bold text-primary flex items-center gap-2">
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
            className="ml-auto text-xs text-muted-foreground hover:text-primary"
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
            <div className="p-4 bg-primary-soft rounded-[0.875rem]">
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
                  className="text-left text-xs p-3 rounded-[0.875rem] border border-border bg-card hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
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
                className={`max-w-[85%] rounded-[0.875rem] px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {m.role === "assistant" ? (
                  <div>
                    <div
                      className="agent-html"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.content) }}
                    />
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
            <div className="bg-muted rounded-[0.875rem] rounded-bl-md px-4 py-3">
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
            <div key={i} className="flex items-center gap-1.5 text-xs bg-muted rounded-[0.75rem] px-2.5 py-1.5 border border-border">
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
          />

          <Button
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
            onClick={() => send(input)}
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            title="Enviar mensagem"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
