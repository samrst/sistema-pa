import jsPDF from "jspdf";

function stripEmojis(text: string): string {
  return text
    .replace(/\u{2705}/gu, "[OK]")
    .replace(/\u{274C}/gu, "[X]")
    .replace(/\u{26A0}\u{FE0F}?/gu, "[!]")
    .replace(/\u{1F534}/gu, "[!]")
    .replace(/\u{1F7E1}/gu, "[-]")
    .replace(/\u{1F7E2}/gu, "[OK]")
    .replace(/\u{1F4CA}/gu, "")
    .replace(/\u{1F4CB}/gu, "")
    .replace(/\u{1F4DD}/gu, "")
    .replace(/\u{1F4A1}/gu, "")
    .replace(/\u{1F3AF}/gu, "")
    .replace(/\u{2B50}/gu, "*")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .trim();
}

export function exportChatResponsePdf(content: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const maxWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  // Header
  doc.setFillColor(0, 90, 156);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SENAI Feira de Santana", marginLeft, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Plano de Acao SAEP 2026 - Relatorio do Agente IA", marginLeft, 19);

  const now = new Date();
  doc.setFontSize(8);
  doc.text(
    `Gerado em: ${now.toLocaleDateString("pt-BR")} as ${now.toLocaleTimeString("pt-BR")}`,
    pageWidth - marginRight,
    24,
    { align: "right" }
  );

  y = 36;
  doc.setTextColor(0, 0, 0);

  const cleanContent = stripEmojis(content);
  const lines = cleanContent.split("\n");

  for (const line of lines) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 90, 156);
      const wrapped = doc.splitTextToSize(trimmed.replace(/^#+\s*/, ""), maxWidth);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 6 + 4;
    } else if (trimmed.startsWith("## ")) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 70, 130);
      const wrapped = doc.splitTextToSize(trimmed.replace(/^#+\s*/, ""), maxWidth);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 5.5 + 3;
    } else if (trimmed.startsWith("### ")) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      const wrapped = doc.splitTextToSize(trimmed.replace(/^#+\s*/, ""), maxWidth);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 5 + 2;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const bulletText = trimmed.replace(/^[-*]\s*/, "");
      const cleanBullet = bulletText.replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(cleanBullet, maxWidth - 8);
      doc.text("•", marginLeft + 2, y);
      doc.text(wrapped, marginLeft + 7, y);
      y += wrapped.length * 4.5 + 1.5;
    } else if (trimmed.startsWith("|")) {
      // Collect full table
      const tableLines: string[] = [];
      let tIdx = lines.indexOf(line);
      while (tIdx < lines.length && lines[tIdx].trim().startsWith("|")) {
        tableLines.push(lines[tIdx].trim());
        tIdx++;
      }
      // Skip already-processed table lines
      const remaining = tableLines.length - 1;
      for (let sk = 0; sk < remaining; sk++) {
        lines.splice(lines.indexOf(line) + 1, 0, "__SKIP__");
      }

      // Parse table
      const dataRows: string[][] = [];
      let headerRow: string[] | null = null;
      for (let ti = 0; ti < tableLines.length; ti++) {
        const cells = tableLines[ti].split("|").filter((c) => c.trim() !== "");
        if (cells.some((c) => /^[-:]+$/.test(c.trim()))) continue;
        const cleaned = cells.map((c) => c.trim().replace(/\*\*/g, ""));
        if (!headerRow) {
          headerRow = cleaned;
        } else {
          dataRows.push(cleaned);
        }
      }

      if (headerRow) {
        const numCols = headerRow.length;
        const colWidth = maxWidth / numCols;
        const rowH = 7;
        const cellPad = 2;

        // Check page space
        const tableHeight = (dataRows.length + 1) * rowH + 4;
        if (y + tableHeight > pageHeight - 20) {
          doc.addPage();
          y = 15;
        }

        // Draw header
        doc.setFillColor(0, 90, 156);
        doc.rect(marginLeft, y - 4, maxWidth, rowH, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        headerRow.forEach((cell, ci) => {
          const x = marginLeft + ci * colWidth + cellPad;
          doc.text(cell.substring(0, Math.floor(colWidth / 1.8)), x, y);
        });
        // Header borders
        doc.setDrawColor(0, 70, 130);
        doc.setLineWidth(0.2);
        for (let ci = 0; ci <= numCols; ci++) {
          const x = marginLeft + ci * colWidth;
          doc.line(x, y - 4, x, y - 4 + rowH);
        }
        doc.line(marginLeft, y - 4, marginLeft + maxWidth, y - 4);
        doc.line(marginLeft, y - 4 + rowH, marginLeft + maxWidth, y - 4 + rowH);
        y += rowH;

        // Draw data rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        dataRows.forEach((row, ri) => {
          if (y + rowH > pageHeight - 20) {
            doc.addPage();
            y = 15;
          }
          // Alternating row bg
          if (ri % 2 === 0) {
            doc.setFillColor(245, 247, 250);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          doc.rect(marginLeft, y - 4, maxWidth, rowH, "F");

          // Cell borders
          doc.setDrawColor(200, 210, 220);
          doc.setLineWidth(0.15);
          for (let ci = 0; ci <= numCols; ci++) {
            const x = marginLeft + ci * colWidth;
            doc.line(x, y - 4, x, y - 4 + rowH);
          }
          doc.line(marginLeft, y - 4 + rowH, marginLeft + maxWidth, y - 4 + rowH);

          // Cell text
          doc.setTextColor(30, 30, 30);
          row.forEach((cell, ci) => {
            const x = marginLeft + ci * colWidth + cellPad;
            const maxChars = Math.floor((colWidth - cellPad * 2) / 1.8);
            doc.text(cell.substring(0, maxChars), x, y);
          });
          y += rowH;
        });

        y += 3;
      }
      continue;
    } else if (trimmed === "") {
      y += 3;
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const cleanLine = trimmed.replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(cleanLine, maxWidth);
      doc.text(wrapped, marginLeft, y);
      y += wrapped.length * 4.5 + 1.5;
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `SENAI Feira de Santana | Plano de Acao SAEP 2026 | Pagina ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  doc.save(`relatorio-agente-ia-${now.toISOString().slice(0, 10)}.pdf`);
  return doc;
}

export function getChatResponsePlainText(content: string): string {
  return stripEmojis(content)
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-*]\s*/gm, "• ");
}
