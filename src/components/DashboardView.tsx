import { useState } from "react";
import { useAcoes } from "@/hooks/useAcoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ClipboardList, CheckCircle2, AlertTriangle, Clock, X, Pencil, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import AcaoFormDialog from "@/components/AcaoFormDialog";
import type { Acao } from "@/hooks/useAcoes";

const PIE_COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(160, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

const statusColor: Record<string, string> = {
  "Não iniciado": "bg-muted text-muted-foreground",
  "Em andamento": "bg-info/15 text-info border-info/30",
  "Concluído": "bg-success/15 text-success border-success/30",
  "Impeditivo": "bg-destructive/15 text-destructive border-destructive/30",
};

type FilterType = "total" | "concluidas" | "emAndamento" | "atrasadas" | null;

export default function DashboardView() {
  const { data: acoes } = useAcoes();
  const all = acoes || [];
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const total = all.length;
  const concluidas = all.filter((a) => a.status === "Concluído").length;
  const atrasadas = all.filter((a) => a.data_fim && new Date(a.data_fim) < new Date() && a.status !== "Concluído").length;
  const emAndamento = all.filter((a) => a.status === "Em andamento").length;
  const pctConcluidas = total ? Math.round((concluidas / total) * 100) : 0;

  const stats = [
    { key: "total" as FilterType, label: "Total de Ações", value: total, icon: ClipboardList, color: "text-primary", activeBg: "ring-2 ring-primary bg-primary/5" },
    { key: "concluidas" as FilterType, label: "Concluídas", value: `${pctConcluidas}%`, rawValue: concluidas, icon: CheckCircle2, color: "text-success", activeBg: "ring-2 ring-success bg-success/5" },
    { key: "emAndamento" as FilterType, label: "Em Andamento", value: emAndamento, icon: Clock, color: "text-info", activeBg: "ring-2 ring-info bg-info/5" },
    { key: "atrasadas" as FilterType, label: "Atrasadas", value: atrasadas, icon: AlertTriangle, color: "text-destructive", activeBg: "ring-2 ring-destructive bg-destructive/5" },
  ];

  const filteredAcoes = activeFilter
    ? all.filter((a) => {
        if (activeFilter === "total") return true;
        if (activeFilter === "concluidas") return a.status === "Concluído";
        if (activeFilter === "emAndamento") return a.status === "Em andamento";
        if (activeFilter === "atrasadas") return a.data_fim && new Date(a.data_fim) < new Date() && a.status !== "Concluído";
        return false;
      })
    : [];

  // By curso
  const byCurso: Record<string, number> = {};
  all.forEach((a) => { byCurso[a.curso.replace("Técnico em ", "")] = (byCurso[a.curso.replace("Técnico em ", "")] || 0) + 1; });
  const cursoData = Object.entries(byCurso).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // By status
  const byStatus: Record<string, number> = {};
  all.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  // By tipo
  const byTipo: Record<string, number> = {};
  all.forEach((a) => { byTipo[a.tipo_acao] = (byTipo[a.tipo_acao] || 0) + 1; });
  const tipoData = Object.entries(byTipo).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const filterTitle: Record<NonNullable<FilterType>, string> = {
    total: "Todas as Ações",
    concluidas: "Ações Concluídas",
    emAndamento: "Ações em Andamento",
    atrasadas: "Ações Atrasadas",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card
            key={s.key}
            className={cn(
              "glass-card cursor-pointer transition-all hover:shadow-md",
              activeFilter === s.key ? s.activeBg : ""
            )}
            onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.color)} />
                <div>
                  <p className="text-2xl font-heading font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeFilter && (
        <Card className="glass-card animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-heading">
              {filterTitle[activeFilter]} <span className="text-muted-foreground font-normal">({filteredAcoes.length})</span>
            </CardTitle>
            <button
              onClick={() => setActiveFilter(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Fechar filtro"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            {filteredAcoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ação encontrada para este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Ação</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prazo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAcoes.map((acao) => (
                      <TableRow key={acao.id}>
                        <TableCell className="font-medium text-sm max-w-[300px] truncate" title={acao.acao}>
                          {acao.acao}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{acao.curso.replace("Técnico em ", "")}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{acao.responsavel_principal}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", statusColor[acao.status] || "")}>
                            {acao.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {acao.data_fim
                            ? new Date(acao.data_fim).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base font-heading">Ações por Curso</CardTitle></CardHeader>
          <CardContent>
            {cursoData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cursoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(215, 80%, 48%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base font-heading">Ações por Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {statusData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span>{s.name}: <strong>{s.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-heading">Ações por Tipo</CardTitle></CardHeader>
          <CardContent>
            {tipoData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tipoData} margin={{ bottom: 60 }}>
                  <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} height={80} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(160, 60%, 42%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
