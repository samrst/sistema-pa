import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildColumnStyles, getPreferredPdfOrientation, parseReportHtml, stripPdfEmojis } from "@/lib/reportPdfHtml";

function wrapTextSafe(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const safeWords: string[] = [];

  for (const word of words) {
    if (doc.getTextWidth(word) > maxWidth) {
      let chunk = "";
      for (const char of word) {
        if (doc.getTextWidth(chunk + char) > maxWidth) {
          if (chunk) safeWords.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      if (chunk) safeWords.push(chunk);
    } else {
      safeWords.push(word);
    }
  }

  return doc.splitTextToSize(safeWords.join(" "), maxWidth);
}

export function exportRelatorioPdf(markdownContent: string, totalAcoes: number, filtersSummary?: string) {
  const cleaned = stripPdfEmojis(markdownContent);
  const { blocks, tables } = parseReportHtml(cleaned);
  const orientation = getPreferredPdfOrientation(tables);
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 14;
  const marginRight = 14;
  const marginTop = 16;
  const marginBottom = 16;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ── HEADER BANNER ──
  const headerHeight = 44;
  doc.setFillColor(22, 65, 148); // SENAI Navy Blue (#164194)
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SENAI Bahia", marginLeft, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Plano de Ação SAEP 2026 — Relatório Executivo IA", marginLeft, 23);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(240, 244, 255);

  const scopeText = `${totalAcoes} ${totalAcoes === 1 ? "ação analisada" : "ações analisadas"}`;
  const filtersText = filtersSummary && filtersSummary !== "Todos" ? ` | Filtros: ${filtersSummary}` : "";
  const subtitleLine = `Escopo: ${scopeText}${filtersText}`;
  const maxSubtitleWidth = contentWidth - 50;
  const subtitleLines = wrapTextSafe(doc, subtitleLine, maxSubtitleWidth);

  for (let i = 0; i < Math.min(subtitleLines.length, 2); i++) {
    doc.text(subtitleLines[i], marginLeft, 31 + i * 4);
  }

  doc.setFontSize(8);
  doc.setTextColor(220, 230, 250);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - marginRight,
    31,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);

  let y = headerHeight + 10;

  blocks.forEach((block) => {
    // ── HEADINGS ──
    if (block.type === "heading") {
      const isPrimaryHeading = block.level === 1 || block.level === 2;
      const fontSize = isPrimaryHeading ? 12 : block.level === 3 ? 10 : 9;
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "bold");

      const maxHeadingWidth = isPrimaryHeading ? contentWidth - 8 : contentWidth;
      const lines = wrapTextSafe(doc, block.text, maxHeadingWidth);
      const lineHeight = isPrimaryHeading ? 5 : 4.5;
      const totalHeadingHeight = lines.length * lineHeight + (isPrimaryHeading ? 6 : 4);

      // Prevent orphaned heading at the bottom of the page
      if (y + totalHeadingHeight + 12 > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }

      if (isPrimaryHeading) {
        doc.setTextColor(22, 65, 148);
        doc.setFillColor(37, 99, 235);
        doc.rect(marginLeft, y, 3, Math.max(7, lines.length * lineHeight), "F");
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], marginLeft + 6, y + 4.5 + i * lineHeight);
        }
        y += totalHeadingHeight;
      } else {
        doc.setTextColor(block.level === 3 ? 37 : 80, block.level === 3 ? 99 : 80, block.level === 3 ? 235 : 80);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], marginLeft, y + 3.5 + i * lineHeight);
        }
        y += totalHeadingHeight;
      }
      return;
    }

    // ── TABLES ──
    if (block.type === "table") {
      const table = tables[block.tableIndex];
      if (!table || !table.headers.length) return;

      if (y + 20 > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }

      const columnStyles = buildColumnStyles(table.headers, contentWidth);

      autoTable(doc, {
        startY: y,
        head: [table.headers],
        body: table.rows,
        margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
        tableWidth: contentWidth,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: orientation === "landscape" ? 7 : 7.5,
          cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
          overflow: "linebreak",
          valign: "middle",
          lineColor: [220, 225, 230],
          lineWidth: 0.2,
          minCellHeight: 6,
        },
        headStyles: {
          fillColor: [22, 65, 148],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: orientation === "landscape" ? 7.2 : 7.6,
          halign: "left",
          valign: "middle",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        bodyStyles: { textColor: [30, 41, 59] },
        columnStyles,
        rowPageBreak: "avoid",
        showHead: "everyPage",
      });

      y = (doc as any).lastAutoTable.finalY + 6;
      return;
    }

    // ── ALERTS ──
    if (block.type === "alert") {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");

      const alertMaxWidth = contentWidth - 12;
      const lines = wrapTextSafe(doc, block.text, alertMaxWidth);
      const lineHeight = 4.2;
      const boxHeight = lines.length * lineHeight + 6;

      if (y + boxHeight <= pageHeight - marginBottom) {
        if (block.tone === "critical") {
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(239, 68, 68);
          doc.setTextColor(153, 27, 27);
        } else if (block.tone === "success") {
          doc.setFillColor(240, 253, 244);
          doc.setDrawColor(34, 197, 94);
          doc.setTextColor(22, 101, 52);
        } else {
          doc.setFillColor(239, 246, 255);
          doc.setDrawColor(59, 130, 246);
          doc.setTextColor(30, 64, 175);
        }

        doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 1.5, 1.5, "F");
        doc.setLineWidth(0.8);
        doc.line(marginLeft, y, marginLeft, y + boxHeight);

        doc.setFont("helvetica", "bold");
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], marginLeft + 5, y + 4.5 + i * lineHeight);
        }
        y += boxHeight + 4;
      } else {
        if (y + 16 > pageHeight - marginBottom) {
          doc.addPage();
          y = marginTop;
        }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(
          block.tone === "critical" ? 153 : block.tone === "success" ? 22 : 30,
          block.tone === "critical" ? 27 : block.tone === "success" ? 101 : 64,
          block.tone === "critical" ? 27 : block.tone === "success" ? 52 : 175
        );
        for (let i = 0; i < lines.length; i++) {
          if (y + lineHeight > pageHeight - marginBottom) {
            doc.addPage();
            y = marginTop;
          }
          doc.text(lines[i], marginLeft + 4, y + 2.5);
          y += lineHeight;
        }
        y += 3;
      }
      return;
    }

    // ── PARAGRAPHS & LIST ITEMS ──
    const isList = block.type === "bullet" || block.type === "numbered";
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    const indent = isList ? 6 : 0;
    const maxWidth = contentWidth - indent;
    const lines = wrapTextSafe(doc, block.text, maxWidth);
    const lineHeight = 4.2;

    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }

      if (i === 0 && block.type === "bullet") {
        doc.setFillColor(37, 99, 235);
        doc.circle(marginLeft + 2, y + 1.2, 0.8, "F");
      }

      doc.text(lines[i], marginLeft + indent, y + 2.5);
      y += lineHeight;
    }
    y += 2.5;
  });

  // ── FOOTER ON ALL PAGES ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    const footerY = pageHeight - 8;
    doc.text("SENAI Bahia — Plano de Ação SAEP 2026 — Relatório Executivo IA", marginLeft, footerY);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginRight, footerY, { align: "right" });
  }

  doc.save(`Relatorio_IA_SAEP_${new Date().toISOString().slice(0, 10)}.pdf`);
}
