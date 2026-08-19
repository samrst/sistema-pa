import React from "react";
import { useAcoesFilter } from "@/hooks/useAcoesFilter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ChecklistView() {
  const { filteredAcoes, isLoading } = useAcoesFilter();

  // Agrupa primeiro por unidade e depois por curso utilizando o conjunto filtrado
  const byUnidade: Record<string, Record<string, typeof filteredAcoes>> = {};

  filteredAcoes.forEach((a) => {
    const unidade = a.unidade || "Sem Unidade";
    const curso = a.curso || "Sem Curso";

    if (!byUnidade[unidade]) byUnidade[unidade] = {};
    if (!byUnidade[unidade][curso]) byUnidade[unidade][curso] = [];

    byUnidade[unidade][curso]!.push(a);
  });

  const Check = ({ ok }: { ok: boolean }) =>
    ok ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive mx-auto" />
    );

  const hasData = Object.keys(byUnidade).length > 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        Visão rápida para acompanhamento — verifica se cada ação do conjunto selecionado possui meta, responsável e prazo definidos.
      </p>

      <div className="rounded-[0.875rem] border border-border bg-card overflow-x-auto shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead className="text-center">Meta</TableHead>
              <TableHead className="text-center">Responsável</TableHead>
              <TableHead className="text-center">Prazo</TableHead>
              <TableHead className="text-center">Status Geral</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando checklist...
                </TableCell>
              </TableRow>
            ) : !hasData ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma ação encontrada para os filtros ativos.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(byUnidade).flatMap(([unidade, cursos]) => {
                const totalLinhasUnidade = Object.values(cursos).reduce(
                  (acc, items) => acc + (items?.length || 0),
                  0
                );

                let renderizaraUnidade = true;

                return Object.entries(cursos).flatMap(([curso, items]) => {
                  const cursoFormatado = curso.replace("Técnico em ", "");
                  const totalLinhasCurso = items?.length || 0;

                  return (items || []).map((a, i) => {
                    const hasMeta = !!(a.meta_objetiva || a.meta_pratica);
                    const hasResp = !!a.responsavel_principal;
                    const hasPrazo = !!a.data_fim;
                    const allOk = hasMeta && hasResp && hasPrazo;

                    const showUnidadeCell = renderizaraUnidade;
                    if (renderizaraUnidade) renderizaraUnidade = false;

                    return (
                      <TableRow key={a.id} className="hover:bg-primary/5 transition-colors duration-200">
                        {/* Célula de Unidade com rowSpan para cobrir todas as ações da unidade */}
                        {showUnidadeCell && (
                          <TableCell
                            rowSpan={totalLinhasUnidade}
                            className="font-semibold text-sm text-foreground align-top border-r border-border bg-muted/20"
                          >
                            {unidade}
                          </TableCell>
                        )}

                        {/* Célula de Curso com rowSpan para cobrir todas as ações do curso */}
                        {i === 0 && (
                          <TableCell
                            rowSpan={totalLinhasCurso}
                            className="font-semibold text-sm text-primary align-top border-r border-border"
                          >
                            {cursoFormatado}
                          </TableCell>
                        )}

                        <TableCell className="text-sm font-medium text-foreground">{a.acao}</TableCell>
                        <TableCell className="text-center"><Check ok={hasMeta} /></TableCell>
                        <TableCell className="text-center"><Check ok={hasResp} /></TableCell>
                        <TableCell className="text-center"><Check ok={hasPrazo} /></TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              allOk
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                            }
                          >
                            {allOk ? "OK" : "Pendente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  });
                });
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}