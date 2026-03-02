import { useAcoes } from "@/hooks/useAcoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ClipboardList, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const PIE_COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(160, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

export default function DashboardView() {
  const { data: acoes } = useAcoes();
  const all = acoes || [];

  const total = all.length;
  const concluidas = all.filter((a) => a.status === "Concluído").length;
  const atrasadas = all.filter((a) => a.data_fim && new Date(a.data_fim) < new Date() && a.status !== "Concluído").length;
  const emAndamento = all.filter((a) => a.status === "Em andamento").length;
  const pctConcluidas = total ? Math.round((concluidas / total) * 100) : 0;

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
    { label: "Atrasadas", value: atrasadas, icon: AlertTriangle, color: "text-destructive" },
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
