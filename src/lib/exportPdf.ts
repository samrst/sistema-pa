import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Acao } from "@/hooks/useAcoes";

/**
 * Exporta as ações em UMA ÚNICA página (paisagem A4) com tabela resumo.
 * Sem detalhamento por ação. Fonte auto-ajustada para caber tudo.
 */
export function exportAcoesPdf(acoes: Acao[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const marginBottom = 8;
  const headerHeight = 22;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const availableHeight = pageHeight - headerHeight - marginBottom - 4;

  // ── HEADER COMPACTO ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 16, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SENAI Feira de Santana — Plano de Ação SAEP 2026", marginLeft, 7);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Resumo de Ações • ${acoes.length} ações`, marginLeft, 12);
  doc.text(
    `Exportado em ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth - marginRight,
    12,
    { align: "right" }
  );
  doc.setTextColor(0, 0, 0);

  const headers = [
    "Curso", "Cap.", "Ação", "Problema", "Tipo", "Responsável",
    "Status", "Prio.", "Início", "Prazo",
  ];
  const body = acoes.map((a) => [
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
  ]);

  // Fonte dinâmica para caber em uma página
  const rowCount = body.length + 1;
  let fontSize = 7.5;
  let cellPaddingV = 1.4;
  const minFontSize = 4;

  while (fontSize > minFontSize) {
    const estimatedRowHeight = fontSize * 0.6 + cellPaddingV * 2;
    if (rowCount * estimatedRowHeight <= availableHeight) break;
    fontSize -= 0.25;
    if (fontSize < 6) cellPaddingV = 1;
    if (fontSize < 5) cellPaddingV = 0.6;
  }

  // Pesos de coluna (% do contentWidth) para distribuição inteligente
  const weights = [9, 5, 18, 22, 9, 11, 7, 5, 7, 7];
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const columnStyles = Object.fromEntries(
    weights.map((w, i) => [i, { cellWidth: (contentWidth * w) / totalWeight }])
  );

  autoTable(doc, {
    startY: headerHeight,
    head: [headers],
    body,
    margin: { left: marginLeft, right: marginRight, top: headerHeight, bottom: marginBottom },
    tableWidth: contentWidth,
    theme: "grid",
    pageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize,
      cellPadding: { top: cellPaddingV, right: 1.4, bottom: cellPaddingV, left: 1.4 },
      overflow: "linebreak",
      valign: "middle",
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      minCellHeight: fontSize * 0.6 + cellPaddingV * 2,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: Math.max(fontSize - 0.2, minFontSize),
      halign: "left",
      valign: "middle",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    bodyStyles: { textColor: [40, 40, 40] },
    columnStyles,
    rowPageBreak: "avoid",
    showHead: "everyPage",
  });

  // Footer
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(
    "SENAI Feira de Santana — Plano de Ação SAEP 2026",
    marginLeft,
    pageHeight - 3
  );
  doc.text(`${acoes.length} ações`, pageWidth - marginRight, pageHeight - 3, { align: "right" });

  // Garante uma única página: remove qualquer página extra que tenha sido criada
  const totalPages = doc.getNumberOfPages();
  for (let p = totalPages; p > 1; p--) {
    doc.deletePage(p);
  }

  doc.save(`Acoes_SAEP_${new Date().toISOString().slice(0, 10)}.pdf`);
}
