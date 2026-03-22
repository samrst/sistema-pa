import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Parses markdown content and generates a professional PDF report
 * with Excel-like tables for the AI analysis.
 */
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2702}-\u{27B0}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/[\u{20E3}]/gu, '')
    .replace(/[\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\u{2705}/gu, '[OK]')
    .replace(/\u{274C}/gu, '[X]')
    .replace(/\u{26A0}/gu, '[!]')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function exportRelatorioPdf(markdownContent: string, totalAcoes: number) {
  const cleaned = stripEmojis(markdownContent);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // ── COVER / HEADER ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SENAI Feira de Santana", marginLeft, 18);

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

  // Parse markdown into sections
  const lines = cleaned.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines and horizontal rules
    if (line === "" || line === "---") {
      i++;
      continue;
    }

    // Check page overflow
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // H2 - Section headers
    if (line.startsWith("## ")) {
      if (y > 250) { doc.addPage(); y = 20; }
      const title = line.replace("## ", "").replace(/[#]/g, "").trim();
      
      // Blue bar accent
      doc.setFillColor(37, 99, 235);
      doc.rect(marginLeft, y - 1, 3, 7, "F");
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(title, marginLeft + 6, y + 4);
      y += 12;
      i++;
      continue;
    }

    // H3 - Sub-section headers
    if (line.startsWith("### ")) {
      if (y > 255) { doc.addPage(); y = 20; }
      const title = line.replace("### ", "").trim();
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(title, marginLeft, y + 3);
      y += 8;
      i++;
      continue;
    }

    // H4
    if (line.startsWith("#### ")) {
      const title = line.replace("#### ", "").trim();
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(title, marginLeft, y + 3);
      y += 7;
      i++;
      continue;
    }

    // Bold standalone lines (like **Padrão: ...**)
    if (line.startsWith("**") && line.endsWith("**") && !line.includes("|")) {
      if (y > 260) { doc.addPage(); y = 20; }
      const text = line.replace(/\*\*/g, "").trim();
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text(text, marginLeft, y + 3);
      y += 7;
      i++;
      continue;
    }

    // TABLE detection
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // Parse table
      const rows = tableLines
        .filter(l => !l.match(/^\|[\s\-:|]+\|$/)) // skip separator
        .map(l =>
          l.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
        );

      if (rows.length > 0) {
        const head = rows[0];
        const body = rows.slice(1);

        if (y > 240) { doc.addPage(); y = 20; }

        autoTable(doc, {
          startY: y,
          head: [head],
          body: body,
          styles: { fontSize: 7.5, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.2 },
          headStyles: { fillColor: [37, 99, 235], fontSize: 7.5, fontStyle: "bold", textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { left: marginLeft, right: marginRight },
          tableWidth: contentWidth,
          theme: "grid",
          didDrawPage: () => { /* reset y on new page */ },
        });

        y = (doc as any).lastAutoTable.finalY + 6;
      }
      continue;
    }

    // Regular text / paragraphs
    if (line.length > 0) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      // Clean markdown bold/italic for plain text
      const cleanText = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const splitLines = doc.splitTextToSize(cleanText, contentWidth);
      
      if (y + splitLines.length * 4 > 275) { doc.addPage(); y = 20; }
      
      doc.text(splitLines, marginLeft, y + 3);
      y += splitLines.length * 4 + 3;
    }

    i++;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("SENAI Feira de Santana — Plano de Ação SAEP 2026 — Relatório IA", marginLeft, 290);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginRight, 290, { align: "right" });
  }

  doc.save(`Relatorio_IA_SAEP_${new Date().toISOString().slice(0, 10)}.pdf`);
}
