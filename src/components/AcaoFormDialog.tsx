import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCreateAcao, useUpdateAcao, type Acao } from "@/hooks/useAcoes";
import { toast } from "sonner";
import {
  UNIDADES, CURSOS, MODALIDADE, CAPACIDADES, TIPOS_ACAO, STATUS_OPTIONS,
  CRITICIDADE_OPTIONS, RISCO_OPTIONS, PRIORIDADE_OPTIONS,
  IMPACTO_OPTIONS, APOIOS_OPTIONS,
} from "@/lib/constants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Acao | null;
};

const defaultForm = {
  unidade: "",
  curso: "",
  modalidade: "",
  capacidade_saep: "",
  problema_identificado: "",
  evidencias: "",
  classificacao_criticidade: "Adequado",
  meta_objetiva: "",
  meta_pratica: "",
  meta_prazo: "",
  acao: "",
  tipo_acao: "",
  entregavel: "",
  responsavel_principal: "",
  funcao_cargo: "",
  co_responsaveis: "",
  apoios_necessarios: [] as string[],
  data_inicio: "",
  data_fim: "",
  status: "Não iniciado",
  risco: "Baixo",
  plano_mitigacao: "",
  custo_estimado: "",
  prioridade: "Média",
  impacto_saep: "Médio",
  observacoes: "",
};

export default function AcaoFormDialog({ open, onOpenChange, editData }: Props) {
  const [form, setForm] = useState(defaultForm);
  const createMutation = useCreateAcao();
  const updateMutation = useUpdateAcao();

  useEffect(() => {
    if (editData) {
      setForm({
        unidade: editData.unidade,
        curso: editData.curso,
        modalidade: editData.modalidade,
        capacidade_saep: editData.capacidade_saep,
        problema_identificado: editData.problema_identificado,
        evidencias: editData.evidencias || "",
        classificacao_criticidade: editData.classificacao_criticidade || "Adequado",
        meta_objetiva: editData.meta_objetiva || "",
        meta_pratica: editData.meta_pratica || "",
        meta_prazo: editData.meta_prazo || "",
        acao: editData.acao,
        tipo_acao: editData.tipo_acao,
        entregavel: editData.entregavel || "",
        responsavel_principal: editData.responsavel_principal,
        funcao_cargo: editData.funcao_cargo || "",
        co_responsaveis: editData.co_responsaveis || "",
        apoios_necessarios: editData.apoios_necessarios || [],
        data_inicio: editData.data_inicio || "",
        data_fim: editData.data_fim || "",
        status: editData.status,
        risco: editData.risco || "Baixo",
        plano_mitigacao: editData.plano_mitigacao || "",
        custo_estimado: editData.custo_estimado?.toString() || "",
        prioridade: editData.prioridade || "Média",
        impacto_saep: editData.impacto_saep || "Médio",
        observacoes: editData.observacoes || "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [editData, open]);

  const set = (key: string, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleApoio = (apoio: string) => {
    setForm((f) => ({
      ...f,
      apoios_necessarios: f.apoios_necessarios.includes(apoio)
        ? f.apoios_necessarios.filter((a) => a !== apoio)
        : [...f.apoios_necessarios, apoio],
    }));
  };

  const handleSubmit = async () => {
    if (!form.unidade ||!form.modalidade ||!form.curso || !form.capacidade_saep || !form.problema_identificado || !form.acao || !form.tipo_acao || !form.responsavel_principal) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      ...form,
      custo_estimado: form.custo_estimado ? parseFloat(form.custo_estimado) : null,
      evidencias: form.evidencias || null,
      meta_objetiva: form.meta_objetiva || null,
      meta_pratica: form.meta_pratica || null,
      meta_prazo: form.meta_prazo || null,
      entregavel: form.entregavel || null,
      funcao_cargo: form.funcao_cargo || null,
      co_responsaveis: form.co_responsaveis || null,
      apoios_necessarios: form.apoios_necessarios.length ? form.apoios_necessarios : null,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      plano_mitigacao: form.plano_mitigacao || null,
      observacoes: form.observacoes || null,
    };

    try {
      if (editData) {
        await updateMutation.mutateAsync({ id: editData.id, ...payload });
        toast.success("Ação atualizada!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Ação cadastrada!");
      }
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar ação.");
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-heading font-bold text-primary tracking-widest uppercase mt-6 mb-3 pb-2 border-b-2 border-primary-light">{children}</h3>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0 border-b border-border">
          <DialogTitle className="font-heading text-xl text-primary">{editData ? "Editar Ação" : "Nova Ação SAEP"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-3">
            <SectionTitle>1. Identificação</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-primary font-semibold">Unidade *</Label>
                <Select value={form.unidade} onValueChange={(v) => set("unidade", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-semibold">Curso *</Label>
                <Select value={form.curso} onValueChange={(v) => set("curso", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{CURSOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-semibold">Modalidade *</Label>
                <Select value={form.modalidade} onValueChange={(v) => set("modalidade", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{MODALIDADE.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-semibold">Capacidade SAEP *</Label>
                <Select value={form.capacidade_saep} onValueChange={(v) => set("capacidade_saep", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{CAPACIDADES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-4" />
            <SectionTitle>2. Diagnóstico</SectionTitle>
            <div>
              <Label className="text-primary font-semibold">Problema identificado *</Label>
              <Textarea value={form.problema_identificado} onChange={(e) => set("problema_identificado", e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-primary font-semibold">Evidências / Dados</Label>
              <Textarea value={form.evidencias} onChange={(e) => set("evidencias", e.target.value)} rows={2} placeholder="% acertos, IDAP, resultado SAEP anterior..." />
            </div>
            <div>
              <Label className="text-primary font-semibold">Criticidade</Label>
              <Select value={form.classificacao_criticidade} onValueChange={(v) => set("classificacao_criticidade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CRITICIDADE_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <SectionTitle>3. Ação Planejada</SectionTitle>
            <div>
              <Label className="text-primary font-semibold">Ação *</Label>
              <Textarea value={form.acao} onChange={(e) => set("acao", e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-primary font-semibold">Tipo de Ação *</Label>
                <Select value={form.tipo_acao} onValueChange={(v) => set("tipo_acao", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{TIPOS_ACAO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-semibold">Entregável</Label>
                <Input value={form.entregavel} onChange={(e) => set("entregavel", e.target.value)} placeholder="Rubrica, relatório, foto..." />
              </div>
            </div>

            <Separator className="my-4" />
            <SectionTitle>4. Responsáveis</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-primary font-semibold">Responsável principal *</Label>
                <Input value={form.responsavel_principal} onChange={(e) => set("responsavel_principal", e.target.value)} />
              </div>
              <div>
                <Label className="text-primary font-semibold">Função / Cargo</Label>
                <Input value={form.funcao_cargo} onChange={(e) => set("funcao_cargo", e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-primary font-semibold">Co-responsáveis</Label>
              <Input value={form.co_responsaveis} onChange={(e) => set("co_responsaveis", e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block text-primary font-semibold">Apoios necessários</Label>
              <div className="flex flex-wrap gap-3">
                {APOIOS_OPTIONS.map((a) => (
                  <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer hover:text-primary transition-colors">
                    <Checkbox checked={form.apoios_necessarios.includes(a)} onCheckedChange={() => toggleApoio(a)} />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            <Separator className="my-4" />
            <SectionTitle>5. Prazos</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-primary font-semibold">Data de Início</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
              </div>
              <div>
                <Label className="text-primary font-semibold">Data de Fim</Label>
                <Input type="date" value={form.data_fim} onChange={(e) => set("data_fim", e.target.value)} />
              </div>
            </div>
            {form.data_inicio && form.data_fim && (
              <p className="text-sm text-muted-foreground">
                Duração: {Math.max(0, Math.ceil((new Date(form.data_fim).getTime() - new Date(form.data_inicio).getTime()) / 86400000))} dias
              </p>
            )}

            <Separator className="my-4" />
            <SectionTitle>6. Acompanhamento</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-primary font-semibold">Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-semibold">Risco</Label>
                <Select value={form.risco} onValueChange={(v) => set("risco", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISCO_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-semibold">Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => set("prioridade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADE_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-primary font-semibold">Impacto SAEP</Label>
                <Select value={form.impacto_saep} onValueChange={(v) => set("impacto_saep", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{IMPACTO_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-primary font-semibold">Custo estimado (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_estimado} onChange={(e) => set("custo_estimado", e.target.value)} />
            </div>

            <Separator className="my-4" />
            <SectionTitle>7. Observações</SectionTitle>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} placeholder="Anotações, pontos de atenção, decisões..." />

            <div className="flex justify-end gap-2 pt-6 border-t border-border mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editData ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
