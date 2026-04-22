import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildColumnStyles, parseReportHtml, stripPdfEmojis, type PdfTable } from "@/lib/reportPdfHtml";

/**
 * Exporta um RESUMO de UMA PÁGINA contendo apenas as ações (tabelas).
 * Sem detalhamento, sem parágrafos longos, sem alertas — apenas o essencial.
 * Layout sempre paisagem para acomodar mais colunas, com fonte auto-ajustada.
 */
export function exportRelatorioPdf(markdownContent: string, totalAcoes: number) {
  const cleaned = stripPdfEmojis(markdownContent);
  const { tables } = parseReportHtml(cleaned);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 8;
  const marginBottom = 10;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ── HEADER COMPACTO ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SENAI Feira de Santana — Plano de Ação SAEP 2026", marginLeft, 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Resumo Executivo de Ações • ${totalAcoes} ações`, marginLeft, 14);

  doc.text(
    new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    pageWidth - marginRight,
    14,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);

  // Escolhe a tabela mais relevante (a que tem mais linhas — provavelmente o resumo de ações)
  const mainTable = pickMainTable(tables);

  if (!mainTable) {
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text("Nenhuma tabela de ações encontrada no relatório.", marginLeft, 40);
    doc.save(`Resumo_Acoes_SAEP_${new Date().toISOString().slice(0, 10)}.pdf`);
    return;
  }

  // Calcula tamanho de fonte dinâmico para caber em uma página
  const availableHeight = pageHeight - marginTop - marginBottom - 18 - 6;
  const rowCount = mainTable.rows.length + 1; // +1 cabeçalho
  // Estima altura por linha: ~5mm para 8pt, escala proporcional
  let fontSize = 8;
  let cellPaddingV = 1.8;
  const minFontSize = 4.5;

  // Iterativamente reduz fonte até caber
  while (fontSize > minFontSize) {
    const estimatedRowHeight = fontSize * 0.55 + cellPaddingV * 2;
    if (rowCount * estimatedRowHeight <= availableHeight) break;
    fontSize -= 0.3;
    if (fontSize < 6) cellPaddingV = 1.2;
    if (fontSize < 5) cellPaddingV = 0.8;
  }

  autoTable(doc, {
    startY: 24,
    head: [mainTable.headers],
    body: mainTable.rows,
    margin: { left: marginLeft, right: marginRight, top: 24, bottom: marginBottom },
    tableWidth: contentWidth,
    theme: "grid",
    pageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize,
      cellPadding: { top: cellPaddingV, right: 1.8, bottom: cellPaddingV, left: 1.8 },
      overflow: "linebreak",
      valign: "middle",
      lineColor: [220, 220, 220],
      lineWidth: 0.15,
      minCellHeight: fontSize * 0.55 + cellPaddingV * 2,
      cellWidth: "wrap",
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
    columnStyles: buildColumnStyles(mainTable.headers, contentWidth),
    rowPageBreak: "avoid",
    showHead: "everyPage",
  });

  // Footer compacto
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(
    "SENAI Feira de Santana — Plano de Ação SAEP 2026 — Resumo Executivo",
    marginLeft,
    pageHeight - 4
  );
  doc.text(`${totalAcoes} ações`, pageWidth - marginRight, pageHeight - 4, { align: "right" });

  // Mantém apenas a primeira página caso autoTable tenha criado mais
  const totalPages = doc.getNumberOfPages();
  for (let p = totalPages; p > 1; p--) {
    doc.deletePage(p);
  }

  doc.save(`Resumo_Acoes_SAEP_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** Escolhe a tabela principal de ações: a que tem mais linhas. */
function pickMainTable(tables: PdfTable[]): PdfTable | null {
  if (!tables.length) return null;
  return tables.reduce((best, current) =>
    current.rows.length > best.rows.length ? current : best
  );
}
