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
  CURSOS, CAPACIDADES, TIPOS_ACAO, STATUS_OPTIONS,
  CRITICIDADE_OPTIONS, RISCO_OPTIONS, PRIORIDADE_OPTIONS,
  IMPACTO_OPTIONS, APOIOS_OPTIONS,
} from "@/lib/constants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: Acao | null;
};

const defaultForm = {
  unidade: "FSA",
  curso: "",
  uc_componente: "",
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
        uc_componente: editData.uc_componente || "",
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
    if (!form.curso || !form.capacidade_saep || !form.problema_identificado || !form.acao || !form.tipo_acao || !form.responsavel_principal) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      ...form,
      custo_estimado: form.custo_estimado ? parseFloat(form.custo_estimado) : null,
      uc_componente: form.uc_componente || null,
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
    <h3 className="text-sm font-heading font-semibold text-primary tracking-wide uppercase mt-4 mb-2">{children}</h3>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-heading text-xl">{editData ? "Editar Ação" : "Nova Ação SAEP"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-3">
            <SectionTitle>1. Identificação</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unidade</Label>
                <Input value={form.unidade} onChange={(e) => set("unidade", e.target.value)} />
              </div>
              <div>
                <Label>Curso *</Label>
                <Select value={form.curso} onValueChange={(v) => set("curso", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{CURSOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>UC / Componente</Label>
                <Input value={form.uc_componente} onChange={(e) => set("uc_componente", e.target.value)} />
              </div>
              <div>
                <Label>Capacidade SAEP *</Label>
                <Select value={form.capacidade_saep} onValueChange={(v) => set("capacidade_saep", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{CAPACIDADES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <SectionTitle>2. Diagnóstico</SectionTitle>
            <div>
              <Label>Problema identificado *</Label>
              <Textarea value={form.problema_identificado} onChange={(e) => set("problema_identificado", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Evidências / Dados</Label>
              <Textarea value={form.evidencias} onChange={(e) => set("evidencias", e.target.value)} rows={2} placeholder="% acertos, IDAP, resultado SAEP anterior..." />
            </div>
            <div>
              <Label>Criticidade</Label>
              <Select value={form.classificacao_criticidade} onValueChange={(v) => set("classificacao_criticidade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CRITICIDADE_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Separator />
            <SectionTitle>3. Metas</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Meta Objetiva (% ou nota)</Label>
                <Input value={form.meta_objetiva} onChange={(e) => set("meta_objetiva", e.target.value)} />
              </div>
              <div>
                <Label>Meta Prática (% proficientes)</Label>
                <Input value={form.meta_pratica} onChange={(e) => set("meta_pratica", e.target.value)} />
              </div>
              <div>
                <Label>Meta Prazo</Label>
                <Input type="date" value={form.meta_prazo} onChange={(e) => set("meta_prazo", e.target.value)} />
              </div>
            </div>

            <Separator />
            <SectionTitle>4. Ação Planejada</SectionTitle>
            <div>
              <Label>Ação *</Label>
              <Textarea value={form.acao} onChange={(e) => set("acao", e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Ação *</Label>
                <Select value={form.tipo_acao} onValueChange={(v) => set("tipo_acao", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{TIPOS_ACAO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Entregável</Label>
                <Input value={form.entregavel} onChange={(e) => set("entregavel", e.target.value)} placeholder="Rubrica, relatório, foto..." />
              </div>
            </div>

            <Separator />
            <SectionTitle>5. Responsáveis</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Responsável principal *</Label>
                <Input value={form.responsavel_principal} onChange={(e) => set("responsavel_principal", e.target.value)} />
              </div>
              <div>
                <Label>Função / Cargo</Label>
                <Input value={form.funcao_cargo} onChange={(e) => set("funcao_cargo", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Co-responsáveis</Label>
              <Input value={form.co_responsaveis} onChange={(e) => set("co_responsaveis", e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Apoios necessários</Label>
              <div className="flex flex-wrap gap-3">
                {APOIOS_OPTIONS.map((a) => (
                  <label key={a} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={form.apoios_necessarios.includes(a)} onCheckedChange={() => toggleApoio(a)} />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            <Separator />
            <SectionTitle>6. Prazos</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de Início</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
              </div>
              <div>
                <Label>Data de Fim</Label>
                <Input type="date" value={form.data_fim} onChange={(e) => set("data_fim", e.target.value)} />
              </div>
            </div>
            {form.data_inicio && form.data_fim && (
              <p className="text-sm text-muted-foreground">
                Duração: {Math.max(0, Math.ceil((new Date(form.data_fim).getTime() - new Date(form.data_inicio).getTime()) / 86400000))} dias
              </p>
            )}

            <Separator />
            <SectionTitle>7. Acompanhamento</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Risco</Label>
                <Select value={form.risco} onValueChange={(v) => set("risco", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISCO_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => set("prioridade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADE_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Impacto SAEP</Label>
                <Select value={form.impacto_saep} onValueChange={(v) => set("impacto_saep", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{IMPACTO_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Plano de mitigação</Label>
              <Textarea value={form.plano_mitigacao} onChange={(e) => set("plano_mitigacao", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Custo estimado (R$)</Label>
              <Input type="number" step="0.01" value={form.custo_estimado} onChange={(e) => set("custo_estimado", e.target.value)} />
            </div>

            <Separator />
            <SectionTitle>8. Observações</SectionTitle>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} placeholder="Anotações, pontos de atenção, decisões..." />

            <div className="flex justify-end gap-2 pt-4">
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
