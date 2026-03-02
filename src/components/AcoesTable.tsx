import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcoes, useDeleteAcao, type Acao } from "@/hooks/useAcoes";
import AcaoFormDialog from "./AcaoFormDialog";
import { toast } from "sonner";
import { CURSOS, STATUS_OPTIONS } from "@/lib/constants";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const statusColor: Record<string, string> = {
  "Não iniciado": "bg-muted text-muted-foreground",
  "Em andamento": "bg-info/15 text-info border-info/30",
  "Concluído": "bg-success/15 text-success border-success/30",
  "Impeditivo": "bg-destructive/15 text-destructive border-destructive/30",
};

const prioridadeColor: Record<string, string> = {
  "Baixa": "bg-muted text-muted-foreground",
  "Média": "bg-warning/15 text-warning border-warning/30",
  "Alta": "bg-destructive/15 text-destructive border-destructive/30",
};

export default function AcoesTable() {
  const { data: acoes, isLoading } = useAcoes();
  const deleteMutation = useDeleteAcao();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Acao | null>(null);
  const [search, setSearch] = useState("");
  const [filterCurso, setFilterCurso] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = (acoes || []).filter((a) => {
    const matchSearch = !search || 
      a.acao.toLowerCase().includes(search.toLowerCase()) ||
      a.responsavel_principal.toLowerCase().includes(search.toLowerCase()) ||
      a.problema_identificado.toLowerCase().includes(search.toLowerCase());
    const matchCurso = filterCurso === "all" || a.curso === filterCurso;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchCurso && matchStatus;
  });

  const handleEdit = (acao: Acao) => {
    setEditData(acao);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Ação excluída.");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar ações..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCurso} onValueChange={setFilterCurso}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos os cursos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {CURSOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Nova Ação
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Cap.</TableHead>
              <TableHead className="min-w-[200px]">Ação</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma ação encontrada.</TableCell></TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-sm">{a.curso.replace("Técnico em ", "")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.capacidade_saep}</Badge></TableCell>
                  <TableCell className="text-sm font-medium">{a.acao}</TableCell>
                  <TableCell className="text-sm">{a.responsavel_principal}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[a.status] || ""}>{a.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={prioridadeColor[a.prioridade || ""] || ""}>{a.prioridade}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.data_fim ? new Date(a.data_fim).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir ação?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação será permanentemente removida.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(a.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AcaoFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editData={editData} />
    </div>
  );
}
