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
      // Table row
      const cells = trimmed.split("|").filter((c) => c.trim() !== "");
      if (cells.some((c) => /^[-:]+$/.test(c.trim()))) continue; // separator
      const isHeader = lines[lines.indexOf(line) + 1]?.trim().startsWith("|") &&
        lines[lines.indexOf(line) + 1]?.includes("---");

      const colWidth = maxWidth / Math.max(cells.length, 1);

      if (isHeader) {
        doc.setFillColor(0, 90, 156);
        doc.rect(marginLeft, y - 3.5, maxWidth, 6, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
      } else {
        const rowIdx = lines.slice(0, lines.indexOf(line)).filter((l) => l.trim().startsWith("|") && !l.includes("---")).length;
        if (rowIdx % 2 === 0) {
          doc.setFillColor(240, 245, 250);
          doc.rect(marginLeft, y - 3.5, maxWidth, 6, "F");
        }
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }

      cells.forEach((cell, ci) => {
        const x = marginLeft + ci * colWidth + 1;
        const cleanCell = cell.trim().replace(/\*\*/g, "");
        doc.text(cleanCell.substring(0, Math.floor(colWidth / 2)), x, y);
      });
      y += 6;
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
