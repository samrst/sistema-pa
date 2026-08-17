import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildColumnStyles, getPreferredPdfOrientation, parseReportHtml, stripPdfEmojis } from "@/lib/reportPdfHtml";

export function exportRelatorioPdf(markdownContent: string, totalAcoes: number) {
  const cleaned = stripPdfEmojis(markdownContent);
  const { blocks, tables } = parseReportHtml(cleaned);
  const orientation = getPreferredPdfOrientation(tables);
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ── COVER / HEADER ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SENAI Bahia", marginLeft, 18);

  doc.setFontSize(14);
  doc.text("Plano de Ação SAEP 2026", marginLeft, 27);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Relatório Executivo de Análise IA • ${totalAcoes} ações analisadas`, marginLeft, 35);

  doc.setFontSize(8);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - marginRight,
    35,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);

  let y = 55;

  const ensurePageSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
  };

  blocks.forEach((block) => {
    if (block.type === "heading") {
      const fontSize = block.level === 2 ? 12 : block.level === 3 ? 10 : 9;
      const accentHeight = block.level === 2 ? 7 : 0;
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(block.level === 2 ? 30 : block.level === 3 ? 37 : 80, block.level === 2 ? 30 : 99, block.level === 2 ? 30 : block.level === 3 ? 235 : 80);
      const wrapped = doc.splitTextToSize(block.text, block.level === 2 ? contentWidth - 6 : contentWidth);
      const estimatedHeight = wrapped.length * (block.level === 2 ? 5 : 4.5) + (block.level === 2 ? 6 : 4);
      ensurePageSpace(estimatedHeight);

      if (block.level === 2) {
        doc.setFillColor(37, 99, 235);
        doc.rect(marginLeft, y - 1, 3, accentHeight, "F");
        doc.text(wrapped, marginLeft + 6, y + 4);
        y += wrapped.length * 5 + 6;
      } else {
        doc.text(wrapped, marginLeft, y + 3);
        y += wrapped.length * 4.5 + 4;
      }

      return;
    }

    if (block.type === "table") {
      const table = tables[block.tableIndex];
      if (!table) return;
      ensurePageSpace(24);

      autoTable(doc, {
        startY: y,
        head: [table.headers],
        body: table.rows,
        margin: { left: marginLeft, right: marginRight },
        tableWidth: contentWidth,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: orientation === "landscape" ? 7.2 : 7.6,
          cellPadding: { top: 2.6, right: 2.4, bottom: 2.6, left: 2.4 },
          overflow: "linebreak",
          valign: "middle",
          lineColor: [220, 220, 220],
          lineWidth: 0.2,
          minCellHeight: 7,
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: orientation === "landscape" ? 7.1 : 7.4,
          halign: "left",
          valign: "middle",
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        bodyStyles: { textColor: [40, 40, 40] },
        columnStyles: buildColumnStyles(table.headers, contentWidth),
        rowPageBreak: "avoid",
        showHead: "everyPage",
      });

      y = (doc as any).lastAutoTable.finalY + 7;
      return;
    }

    if (block.type === "alert") {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      const wrapped = doc.splitTextToSize(block.text, contentWidth - 8);
      const boxHeight = wrapped.length * 4.2 + 6;
      ensurePageSpace(boxHeight + 2);

      if (block.tone === "critical") {
        doc.setFillColor(255, 240, 240);
        doc.setDrawColor(200, 80, 80);
        doc.setTextColor(180, 60, 60);
      } else if (block.tone === "success") {
        doc.setFillColor(239, 250, 244);
        doc.setDrawColor(60, 160, 95);
        doc.setTextColor(42, 109, 64);
      } else {
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(59, 130, 246);
        doc.setTextColor(30, 64, 175);
      }

      doc.roundedRect(marginLeft, y - 4, contentWidth, boxHeight, 2, 2, "F");
      doc.setLineWidth(0.6);
      doc.line(marginLeft, y - 4, marginLeft, y - 4 + boxHeight);
      doc.text(wrapped, marginLeft + 4, y);
      y += boxHeight + 2;
      return;
    }

    const isList = block.type === "bullet" || block.type === "numbered";
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const wrapped = doc.splitTextToSize(block.text, contentWidth - (isList ? 8 : 0));
    const textHeight = wrapped.length * 4.2 + 3;
    ensurePageSpace(textHeight);

    if (block.type === "bullet") {
      doc.setFillColor(37, 99, 235);
      doc.circle(marginLeft + 2, y + 0.6, 0.8, "F");
      doc.text(wrapped, marginLeft + 6, y + 2);
    } else if (block.type === "numbered") {
      doc.text(wrapped, marginLeft + 3, y + 2);
    } else {
      doc.text(wrapped, marginLeft, y + 2);
    }

    y += textHeight;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    const footerY = pageHeight - 8;
    doc.text("SENAI Bahia — Plano de Ação SAEP 2026 — Relatório IA", marginLeft, footerY);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginRight, footerY, { align: "right" });
  }

  doc.save(`Relatorio_IA_SAEP_${new Date().toISOString().slice(0, 10)}.pdf`);
}
