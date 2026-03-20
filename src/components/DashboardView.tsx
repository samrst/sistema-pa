import { useAcoes } from "@/hooks/useAcoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ClipboardList, CheckCircle2, AlertTriangle, Clock, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";

const PIE_COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(160, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

function diasParaVencer(dataFim: string | null) {
  if (!dataFim) return null;
  return differenceInDays(parseISO(dataFim), new Date());
}

export default function DashboardView() {
  const { data: acoes } = useAcoes();
  const all = acoes || [];

  const total = all.length;
  const concluidas = all.filter((a) => a.status === "Concluído").length;
  const atrasadas = all.filter((a) => a.data_fim && new Date(a.data_fim) < new Date() && a.status !== "Concluído");
  const proximasVencer = all.filter((a) => {
    const dias = diasParaVencer(a.data_fim);
    return dias !== null && dias >= 0 && dias <= 7 && a.status !== "Concluído";
  });
  const emAndamento = all.filter((a) => a.status === "Em andamento").length;
  const pctConcluidas = total ? Math.round((concluidas / total) * 100) : 0;

  // Atrasadas agrupadas por curso
  const atrasadasPorCurso: Record<string, typeof atrasadas> = {};
  atrasadas.forEach((a) => {
    if (!atrasadasPorCurso[a.curso]) atrasadasPorCurso[a.curso] = [];
    atrasadasPorCurso[a.curso].push(a);
  });

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

  const stats = [
    { label: "Total de Ações", value: total, icon: ClipboardList, color: "text-primary" },
    { label: "Concluídas", value: `${pctConcluidas}%`, icon: CheckCircle2, color: "text-success" },
    { label: "Em Andamento", value: emAndamento, icon: Clock, color: "text-info" },
    { label: "Atrasadas", value: atrasadas.length, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-heading font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ALERTAS DE PRAZO */}
      {(atrasadas.length > 0 || proximasVencer.length > 0) && (
        <div className="space-y-4">
          {atrasadas.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading flex items-center gap-2 text-destructive">
                  <Siren className="h-5 w-5" /> Ações com Prazo Vencido ({atrasadas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(atrasadasPorCurso).map(([curso, items]) => (
                    <div key={curso}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="destructive" className="text-xs">{curso}</Badge>
                        <span className="text-xs text-muted-foreground">{items.length} ação(ões)</span>
                      </div>
                      <div className="ml-2 space-y-1">
                        {items.map((a) => {
                          const diasAtraso = Math.abs(diasParaVencer(a.data_fim) || 0);
                          return (
                            <div key={a.id} className="flex items-center gap-2 text-sm bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                              <span className="font-medium text-destructive truncate">{a.acao}</span>
                              <span className="ml-auto text-xs text-destructive font-semibold whitespace-nowrap">
                                {diasAtraso} dia(s) de atraso
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {proximasVencer.length > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading flex items-center gap-2 text-amber-600">
                  <Clock className="h-5 w-5" /> Ações Próximas ao Vencimento ({proximasVencer.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {proximasVencer.map((a) => {
                    const dias = diasParaVencer(a.data_fim) || 0;
                    return (
                      <div key={a.id} className="flex items-center gap-2 text-sm bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <Badge variant="outline" className="text-xs shrink-0">{a.curso}</Badge>
                        <span className="truncate">{a.acao}</span>
                        <span className="ml-auto text-xs font-semibold text-amber-600 whitespace-nowrap">
                          {dias === 0 ? "Vence hoje!" : `${dias} dia(s) restante(s)`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
