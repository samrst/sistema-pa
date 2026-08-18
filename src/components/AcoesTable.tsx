import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcoes, useDeleteAcao, type Acao } from "@/hooks/useAcoes";
import { useAuth } from "@/hooks/useAuth";
import AcaoFormDialog from "./AcaoFormDialog";
import { toast } from "sonner";
import { CURSOS, STATUS_OPTIONS, UNIDADES } from "@/lib/constants";
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

interface AcoesTableProps {
  isAdmin?: boolean;
}

export default function AcoesTable({ isAdmin: propIsAdmin }: AcoesTableProps) {
  const { user, isAdmin: authIsAdmin, isMacroprocesso, isUsuario } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : authIsAdmin;

  const { data: acoes, isLoading } = useAcoes();
  const deleteMutation = useDeleteAcao();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Acao | null>(null);
  const [search, setSearch] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("all");
  const [filterCurso, setFilterCurso] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const availableFilterUnidades = useMemo(() => {
    if (isUsuario && user?.unidades?.length) {
      return user.unidades.map((u) => u.nome);
    }
    if (isMacroprocesso && user?.unidades?.length) {
      return user.unidades.map((u) => u.nome);
    }
    return UNIDADES;
  }, [user, isUsuario, isMacroprocesso]);

  const canEditAcao = (a: Acao) => {
    if (isAdmin) return true;
    if (isMacroprocesso) {
      return user?.unidades?.some(
        (u) => u.nome.toLowerCase() === a.unidade.toLowerCase() || (a.unidade_id && u.id === a.unidade_id)
      ) ?? false;
    }
    if (isUsuario) {
      return Boolean(a.usuario_criador_id && user?.id && a.usuario_criador_id === user.id);
    }
    return false;
  };

  const filtered = (acoes || []).filter((a) => {
    const matchSearch = !search || 
      a.acao.toLowerCase().includes(search.toLowerCase()) ||
      a.responsavel_principal.toLowerCase().includes(search.toLowerCase()) ||
      a.problema_identificado.toLowerCase().includes(search.toLowerCase());
    const matchUnidade = filterUnidade === "all" || a.unidade === filterUnidade;
    const matchCurso = filterCurso === "all" || a.curso === filterCurso;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchUnidade && matchCurso && matchStatus;
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
            <input
              placeholder="Buscar ações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg pl-8 h-10"
            />
          </div>
          <Select value={filterUnidade} onValueChange={setFilterUnidade}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todas as unidades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {availableFilterUnidades.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
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
        <div className="flex gap-2 shrink-0">
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" /> Cadastrar ação
          </Button>
        </div>
      </div>

      <div className="rounded-[0.875rem] border border-border bg-card overflow-x-auto shadow-md">
        <ScrollArea className="h-[600px] w-full border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead>Unidade</TableHead>
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
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma ação encontrada.</TableCell></TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={a.id} className="hover:bg-primary/5 transition-colors duration-200">
                  <TableCell className="text-sm">{a.unidade}</TableCell>
                  <TableCell className="text-sm">{a.curso.replace("Técnico em ", "")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.capacidade_saep}</Badge></TableCell>
                  <TableCell className="text-sm font-semibold text-primary">{a.acao}</TableCell>
                  <TableCell className="text-sm">{a.responsavel_principal}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[a.status] || ""}>{a.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={prioridadeColor[a.prioridade || ""] || ""}>{a.prioridade}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.data_fim ? new Date(a.data_fim).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canEditAcao(a) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEdit(a)}
                          title="Editar ação"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Excluir ação"
                            >
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
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </ScrollArea>
      </div>

      <AcaoFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editData={editData} />
    </div>
  );
}
