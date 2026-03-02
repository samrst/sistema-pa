import { useAcoes } from "@/hooks/useAcoes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ChecklistView() {
  const { data: acoes, isLoading } = useAcoes();

  // Group by curso
  const byCurso: Record<string, typeof acoes> = {};
  (acoes || []).forEach((a) => {
    if (!byCurso[a.curso]) byCurso[a.curso] = [];
    byCurso[a.curso]!.push(a);
  });

  const Check = ({ ok }: { ok: boolean }) => ok
    ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
    : <XCircle className="h-4 w-4 text-destructive mx-auto" />;

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-muted-foreground">Visão rápida para uso durante o workshop — verifica se cada ação tem meta, responsável e prazo definidos.</p>
      
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead className="text-center">Meta?</TableHead>
              <TableHead className="text-center">Responsável?</TableHead>
              <TableHead className="text-center">Prazo?</TableHead>
              <TableHead className="text-center">Status Geral</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : Object.keys(byCurso).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ação cadastrada.</TableCell></TableRow>
            ) : (
              Object.entries(byCurso).map(([curso, items]) =>
                items!.map((a, i) => {
                  const hasMeta = !!(a.meta_objetiva || a.meta_pratica);
                  const hasResp = !!a.responsavel_principal;
                  const hasPrazo = !!a.data_fim;
                  const allOk = hasMeta && hasResp && hasPrazo;

                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      {i === 0 ? (
                        <TableCell rowSpan={items!.length} className="font-medium text-sm align-top border-r">
                          {curso.replace("Técnico em ", "")}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-sm">{a.acao}</TableCell>
                      <TableCell className="text-center"><Check ok={hasMeta} /></TableCell>
                      <TableCell className="text-center"><Check ok={hasResp} /></TableCell>
                      <TableCell className="text-center"><Check ok={hasPrazo} /></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={allOk ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>
                          {allOk ? "OK" : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
