import React, { useState } from "react";
import { FileDown, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportChatResponsePdf, getChatResponsePlainText } from "@/lib/exportChatPdf";
import { toast } from "sonner";

interface AdminChatActionsProps {
  content: string;
}

const AdminChatActions: React.FC<AdminChatActionsProps> = ({ content }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Relatório Agente IA - SAEP 2026");

  const handleExportPdf = () => {
    try {
      exportChatResponsePdf(content);
      toast.success("PDF exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar PDF.");
    }
  };

  const handleSendEmail = () => {
    if (!email.trim()) {
      toast.error("Informe o endereço de e-mail.");
      return;
    }
    const plainText = getChatResponsePlainText(content);
    const body = encodeURIComponent(plainText);
    const subjectEnc = encodeURIComponent(subject);
    window.open(`mailto:${email}?subject=${subjectEnc}&body=${body}`, "_blank");
    toast.success("Cliente de e-mail aberto!");
    setShowEmailForm(false);
    setEmail("");
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 h-7 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
          onClick={handleExportPdf}
        >
          <FileDown size={13} /> Exportar PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 h-7 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
          onClick={() => setShowEmailForm(!showEmailForm)}
        >
          <Mail size={13} /> Enviar por E-mail
        </Button>
      </div>

      {showEmailForm && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Enviar por E-mail</span>
            <button onClick={() => setShowEmailForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <Input
            type="email"
            placeholder="Endereço de e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="text"
            placeholder="Assunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" className="w-full h-8 text-xs gap-1.5" onClick={handleSendEmail}>
            <Mail size={13} /> Enviar
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminChatActions;
