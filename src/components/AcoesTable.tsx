import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, AlertTriangle, Clock, FilterX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeleteAcao, type Acao } from "@/hooks/useAcoes";
import { useAcoesFilter } from "@/hooks/useAcoesFilter";
import { useAuth } from "@/hooks/useAuth";
import AcaoFormDialog from "./AcaoFormDialog";
import { toast } from "sonner";
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

export type PrazoStatus = "concluido" | "sem_prazo" | "vencida" | "vencendo" | "normal";

export interface PrazoInfo {
  status: PrazoStatus;
  label: string;
  formattedDate: string;
  diasRestantes?: number;
}

export function getPrazoInfo(dataFimStr: string | null | undefined, acaoStatus: string): PrazoInfo {
  if (!dataFimStr) {
    return {
      status: "sem_prazo",
      label: "—",
      formattedDate: "—",
    };
  }

  const datePart = dataFimStr.includes("T") ? dataFimStr.split("T")[0] : dataFimStr;
  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const dataFim = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  dataFim.setHours(0, 0, 0, 0);

  const formattedDate = `${dayStr.padStart(2, "0")}/${monthStr.padStart(2, "0")}/${yearStr}`;

  if (acaoStatus === "Concluído") {
    return {
      status: "concluido",
      label: formattedDate,
      formattedDate,
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diffTime = dataFim.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "vencida",
      label: "Vencida",
      formattedDate,
      diasRestantes: diffDays,
    };
  }

  if (diffDays <= 7) {
    const texto = diffDays === 0
      ? "Vence hoje"
      : diffDays === 1
      ? "Vence em 1 dia"
      : `Vence em ${diffDays} dias`;
    return {
      status: "vencendo",
      label: texto,
      formattedDate,
      diasRestantes: diffDays,
    };
  }

  return {
    status: "normal",
    label: formattedDate,
    formattedDate,
    diasRestantes: diffDays,
  };
}

interface AcoesTableProps {
  isAdmin?: boolean;
  isReadOnly?: boolean;
  title?: string;
}

export default function AcoesTable({
  isAdmin: propIsAdmin,
  isReadOnly = false,
  title,
}: AcoesTableProps) {
  const { user, isAdmin: authIsAdmin, isMacroprocesso, isUsuario } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : authIsAdmin;

  const { filteredAcoes, isLoading, hasActiveFilters, clearFilters } = useAcoesFilter();
  const deleteMutation = useDeleteAcao();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Acao | null>(null);

  const canEditAcao = (a: Acao) => {
    if (isReadOnly) return false;
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

  const handleEdit = (acao: Acao) => {
    if (isReadOnly) return;
    setEditData(acao);
    setDialogOpen(true);
  };

  const handleNew = () => {
    if (isReadOnly) return;
    setEditData(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Ação excluída.");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const displayTitle = title || "Listagem de Ações";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary">
            {displayTitle} {filteredAcoes.length > 0 && `(${filteredAcoes.length})`}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <FilterX className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          )}
        </div>
        {!isReadOnly && (
          <div className="flex gap-2 shrink-0">
            <Button onClick={handleNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Cadastrar ação
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-[0.875rem] border border-border bg-card overflow-x-auto shadow-md">
        <ScrollArea className="h-[600px] w-full border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 z-10 shadow-sm bg-card">
              <TableRow>
                <TableHead>Unidade</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Cap.</TableHead>
                <TableHead className="min-w-[200px]">Ação</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Prazo</TableHead>
                {!isReadOnly && <TableHead className="w-[80px] text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isReadOnly ? 8 : 9} className="text-center py-8 text-muted-foreground">
                    Carregando ações...
                  </TableCell>
                </TableRow>
              ) : filteredAcoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isReadOnly ? 8 : 9} className="text-center py-8 text-muted-foreground">
                    Nenhuma ação encontrada para os filtros ativos.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAcoes.map((a) => (
                  <TableRow key={a.id} className="hover:bg-primary/5 transition-colors duration-200">
                    <TableCell className="text-sm">{a.unidade}</TableCell>
                    <TableCell className="text-sm">{(a.curso || "").replace("Técnico em ", "")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.capacidade_saep}</Badge></TableCell>
                    <TableCell className="text-sm font-semibold text-primary max-w-[250px] truncate" title={a.acao}>{a.acao}</TableCell>
                    <TableCell className="text-sm">{a.responsavel_principal}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[a.status] || ""}>{a.status}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={prioridadeColor[a.prioridade || ""] || ""}>{a.prioridade || "—"}</Badge></TableCell>
                    <TableCell className="text-sm">
                      {(() => {
                        const prazoInfo = getPrazoInfo(a.data_fim, a.status);
                        if (prazoInfo.status === "vencida") {
                          return (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">{prazoInfo.formattedDate}</span>
                              <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-[11px] w-fit flex items-center gap-1 font-medium py-0 px-1.5">
                                <AlertTriangle className="h-3 w-3" />
                                Vencida
                              </Badge>
                            </div>
                          );
                        }
                        if (prazoInfo.status === "vencendo") {
                          return (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">{prazoInfo.formattedDate}</span>
                              <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30 text-[11px] w-fit flex items-center gap-1 font-medium py-0 px-1.5">
                                <Clock className="h-3 w-3" />
                                {prazoInfo.label}
                              </Badge>
                            </div>
                          );
                        }
                        return <span className="text-muted-foreground">{prazoInfo.formattedDate}</span>;
                      })()}
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEditAcao(a) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleEdit(a)}
                              title="Editar ação"
                              aria-label={`Editar ação ${a.acao}`}
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
                                  className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  title="Excluir ação"
                                  aria-label={`Excluir ação ${a.acao}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Ação</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a ação <strong>"{a.acao}"</strong>? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(a.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {!isReadOnly && <AcaoFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editData={editData} />}
    </div>
  );
}
