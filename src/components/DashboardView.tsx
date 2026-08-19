import React, { useState, useMemo } from "react";
import { useAcoesFilter } from "@/hooks/useAcoesFilter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ClipboardList, CheckCircle2, AlertTriangle, Clock, X, Pencil, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import AcaoFormDialog from "@/components/AcaoFormDialog";
import type { Acao } from "@/hooks/useAcoes";

const PIE_COLORS = [
  "rgb(22, 65, 148)",   
  "rgb(37, 99, 235)",   
  "rgb(96, 165, 250)",  
  "rgb(251, 146, 60)",
  "rgb(232, 75, 16)",
];

const statusColor: Record<string, string> = {
  "Não iniciado": "bg-muted text-muted-foreground",
  "Em andamento": "bg-info/15 text-info border-info/30",
  "Concluído": "bg-success/15 text-success border-success/30",
  "Impeditivo": "bg-destructive/15 text-destructive border-destructive/30",
};

type DrilldownType = "total" | "concluidas" | "emAndamento" | "atrasadas" | null;

export default function DashboardView() {
  const { user, isAdmin, isMacroprocesso, isUsuario } = useAuth();
  const { filteredAcoes, totalAcoes, hasActiveFilters } = useAcoesFilter();

  const [activeDrilldown, setActiveDrilldown] = useState<DrilldownType>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<Acao | null>(null);

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

  // KPIs derived strictly from filteredAcoes
  const total = filteredAcoes.length;
  const concluidas = useMemo(() => filteredAcoes.filter((a) => a.status === "Concluído").length, [filteredAcoes]);
  const emAndamento = useMemo(() => filteredAcoes.filter((a) => a.status === "Em andamento").length, [filteredAcoes]);
  const atrasadas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return filteredAcoes.filter((a) => {
      if (!a.data_fim || a.status === "Concluído") return false;
      const datePart = a.data_fim.includes("T") ? a.data_fim.split("T")[0] : a.data_fim;
      const [y, m, d] = datePart.split("-");
      const dataFim = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      dataFim.setHours(0, 0, 0, 0);
      return dataFim < hoje;
    }).length;
  }, [filteredAcoes]);

  const pctConcluidas = total ? Math.round((concluidas / total) * 100) : 0;

  const stats = [
    { key: "total" as DrilldownType, label: "Total de Ações", value: total, icon: ClipboardList, color: "text-primary", activeBg: "ring-2 ring-primary bg-primary/5" },
    { key: "concluidas" as DrilldownType, label: "Concluídas", value: `${pctConcluidas}%`, rawValue: concluidas, icon: CheckCircle2, color: "text-success", activeBg: "ring-2 ring-success bg-success/5" },
    { key: "emAndamento" as DrilldownType, label: "Em Andamento", value: emAndamento, icon: Clock, color: "text-info", activeBg: "ring-2 ring-info bg-info/5" },
    { key: "atrasadas" as DrilldownType, label: "Atrasadas", value: atrasadas, icon: AlertTriangle, color: "text-destructive", activeBg: "ring-2 ring-destructive bg-destructive/5" },
  ];

  // Drilldown list derived from filteredAcoes
  const drilldownAcoes = useMemo(() => {
    if (!activeDrilldown) return [];
    if (activeDrilldown === "total") return filteredAcoes;
    if (activeDrilldown === "concluidas") return filteredAcoes.filter((a) => a.status === "Concluído");
    if (activeDrilldown === "emAndamento") return filteredAcoes.filter((a) => a.status === "Em andamento");
    if (activeDrilldown === "atrasadas") {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return filteredAcoes.filter((a) => {
        if (!a.data_fim || a.status === "Concluído") return false;
        const datePart = a.data_fim.includes("T") ? a.data_fim.split("T")[0] : a.data_fim;
        const [y, m, d] = datePart.split("-");
        const dataFim = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        dataFim.setHours(0, 0, 0, 0);
        return dataFim < hoje;
      });
    }
    return [];
  }, [activeDrilldown, filteredAcoes]);

  // Chart 1: By Unidade
  const unidadeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAcoes.forEach((a) => {
      const name = a.unidade || "Não informada";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAcoes]);

  // Chart 2: By Modalidade
  const modalidadeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAcoes.forEach((a) => {
      const name = a.modalidade || "Presencial";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredAcoes]);

  // Chart 3: By Curso
  const cursoData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAcoes.forEach((a) => {
      const name = (a.curso || "Não informado").replace("Técnico em ", "");
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAcoes]);

  // Chart 4: By Status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAcoes.forEach((a) => {
      const name = a.status || "Indefinido";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredAcoes]);

  // Chart 5: By Tipo de Ação
  const tipoData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAcoes.forEach((a) => {
      const name = a.tipo_acao || "Outros";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAcoes]);

  const drilldownTitle: Record<NonNullable<DrilldownType>, string> = {
    total: "Todas as Ações Filtradas",
    concluidas: "Ações Concluídas",
    emAndamento: "Ações em Andamento",
    atrasadas: "Ações Atrasadas",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards Superiores (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card
            key={s.key}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg border border-border",
              activeDrilldown === s.key ? s.activeBg : ""
            )}
            onClick={() => setActiveDrilldown(activeDrilldown === s.key ? null : s.key)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.color)} />
                <div>
                  <p className="text-2xl font-heading font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de Detalhamento / Drilldown do KPI Ativo */}
      {activeDrilldown && (
        <Card className="border border-border animate-fade-in shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
            <CardTitle className="text-base font-heading text-primary">
              {drilldownTitle[activeDrilldown]} <span className="text-muted-foreground font-normal">({drilldownAcoes.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveDrilldown(null)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-[0.75rem] hover:bg-primary/10"
                title="Fechar detalhamento"
              >
                <FilterX className="h-3.5 w-3.5" />
                Fechar
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {drilldownAcoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ação encontrada para esta seleção.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Ação</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead className="w-10 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drilldownAcoes.map((acao) => (
                      <TableRow key={acao.id}>
                        <TableCell className="font-semibold text-sm text-primary max-w-[300px] truncate" title={acao.acao}>
                          {acao.acao}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{acao.unidade}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {(acao.curso || "").replace("Técnico em ", "")}
                        </TableCell>
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
                        <TableCell className="text-center">
                          {canEditAcao(acao) && (
                            <button
                              onClick={() => {
                                setEditData(acao);
                                setEditOpen(true);
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-[0.75rem] hover:bg-primary/10"
                              title="Editar ação"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* Grid de Gráficos Reativos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Ações por Unidade (Barras Horizontais) */}
        <Card className="border border-border shadow-md">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-heading text-primary">Ações por Unidade</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {unidadeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível para os filtros ativos</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={unidadeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgb(22, 65, 148)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 2: Ações por Modalidade (Pizza/Donut) */}
        <Card className="border border-border shadow-md">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-heading text-primary">Ações por Modalidade</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {modalidadeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível para os filtros ativos</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={modalidadeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {modalidadeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {modalidadeData.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span>
                        {m.name}: <strong className="text-primary">{m.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 3: Ações por Curso */}
        <Card className="border border-border shadow-md">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-heading text-primary">Ações por Curso</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {cursoData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível para os filtros ativos</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cursoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgb(232, 75, 16)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 4: Ações por Status */}
        <Card className="border border-border shadow-md">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-heading text-primary">Ações por Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível para os filtros ativos</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {statusData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span>
                        {s.name}: <strong className="text-primary">{s.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 5: Ações por Tipo (Ocupa 2 colunas) */}
        <Card className="border border-border shadow-md lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-heading text-primary">Ações por Tipo de Ação</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {tipoData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível para os filtros ativos</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tipoData} margin={{ bottom: 60 }}>
                  <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} height={80} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgb(37, 99, 235)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <AcaoFormDialog open={editOpen} onOpenChange={setEditOpen} editData={editData} />
    </div>
  );
}