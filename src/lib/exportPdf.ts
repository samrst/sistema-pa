import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Acao } from "@/hooks/useAcoes";

export function exportAcoesPdf(acoes: Acao[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(16);
  doc.text("Workshop SAEP 2026 — Plano de Ações", 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`SENAI Feira de Santana • Exportado em ${new Date().toLocaleDateString("pt-BR")}`, 14, 21);
  doc.setTextColor(0);

  // Summary table
  autoTable(doc, {
    startY: 27,
    head: [[
      "Curso", "Cap.", "Ação", "Problema Identificado", "Tipo", "Responsável",
      "Status", "Prioridade", "Início", "Prazo",
    ]],
    body: acoes.map((a) => [
      a.curso.replace("Técnico em ", ""),
      a.capacidade_saep,
      a.acao,
      a.problema_identificado,
      a.tipo_acao,
      a.responsavel_principal,
      a.status,
      a.prioridade || "—",
      a.data_inicio ? new Date(a.data_inicio).toLocaleDateString("pt-BR") : "—",
      a.data_fim ? new Date(a.data_fim).toLocaleDateString("pt-BR") : "—",
    ]),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [37, 99, 235], fontSize: 7.5, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  // Detailed pages — one per action
  acoes.forEach((a) => {
    doc.addPage("a4", "portrait");
    let y = 20;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(a.acao, 14, y);
    y += 8;

    const lines: [string, string][] = [
      ["Curso", a.curso],
      ["Capacidade SAEP", a.capacidade_saep],
      ["UC / Componente", a.uc_componente || "—"],
      ["Problema Identificado", a.problema_identificado],
      ["Evidências", a.evidencias || "—"],
      ["Criticidade", a.classificacao_criticidade || "—"],
      ["Meta Objetiva", a.meta_objetiva || "—"],
      ["Meta Prática", a.meta_pratica || "—"],
      ["Meta Prazo", a.meta_prazo || "—"],
      ["Tipo de Ação", a.tipo_acao],
      ["Entregável", a.entregavel || "—"],
      ["Responsável", a.responsavel_principal],
      ["Função/Cargo", a.funcao_cargo || "—"],
      ["Co-responsáveis", a.co_responsaveis || "—"],
      ["Apoios", a.apoios_necessarios?.join(", ") || "—"],
      ["Data Início", a.data_inicio ? new Date(a.data_inicio).toLocaleDateString("pt-BR") : "—"],
      ["Data Fim", a.data_fim ? new Date(a.data_fim).toLocaleDateString("pt-BR") : "—"],
      ["Status", a.status],
      ["Risco", a.risco || "—"],
      ["Plano de Mitigação", a.plano_mitigacao || "—"],
      ["Custo Estimado", a.custo_estimado ? `R$ ${a.custo_estimado.toLocaleString("pt-BR")}` : "—"],
      ["Prioridade", a.prioridade || "—"],
      ["Impacto SAEP", a.impacto_saep || "—"],
      ["Observações", a.observacoes || "—"],
    ];

    autoTable(doc, {
      startY: y,
      body: lines.map(([label, value]) => [label, value]),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
        1: { cellWidth: "auto" },
      },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      theme: "plain",
      margin: { left: 14, right: 14 },
    });
  });

  doc.save(`Acoes_SAEP_${new Date().toISOString().slice(0, 10)}.pdf`);
}
