import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─── Emoji cleanup ─── */
function strip(text: string): string {
  return text
    .replace(/\u{2705}/gu, "[OK]")
    .replace(/\u{274C}/gu, "[X]")
    .replace(/\u{26A0}\u{FE0F}?/gu, "[!]")
    .replace(/\u{1F534}/gu, "[!]")
    .replace(/\u{1F7E1}/gu, "[-]")
    .replace(/\u{1F7E2}/gu, "[OK]")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{1FA00}-\u{1FA9F}]/gu, "")
    .trim();
}

/* ─── Parse markdown tables ─── */
function parseTables(lines: string[], startIdx: number): { headers: string[]; rows: string[][]; endIdx: number } | null {
  const tableLines: string[] = [];
  let i = startIdx;
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    tableLines.push(lines[i].trim());
    i++;
  }
  if (tableLines.length < 2) return null;

  let headers: string[] | null = null;
  const rows: string[][] = [];

  for (const tl of tableLines) {
    const cells = tl.split("|").filter(c => c.trim() !== "").map(c => c.trim().replace(/\*\*/g, ""));
    if (cells.some(c => /^[-:]+$/.test(c.trim()))) continue;
    if (!headers) headers = cells;
    else rows.push(cells);
  }

  if (!headers || rows.length === 0) return null;
  return { headers, rows, endIdx: i };
}

/* ─── Header/Footer ─── */
function addHeader(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(0, 82, 148);
  doc.rect(0, 0, pw, 22, "F");
  doc.setFillColor(0, 102, 178);
  doc.rect(0, 22, pw, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("SENAI Feira de Santana", 14, 11);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Plano de Acao SAEP 2026 — Relatorio do Agente IA", 14, 18);
  const now = new Date();
  doc.setFontSize(7);
  doc.text(
    `Gerado em: ${now.toLocaleDateString("pt-BR")} as ${now.toLocaleTimeString("pt-BR")}`,
    pw - 14, 18, { align: "right" }
  );
}

function addFooters(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.line(14, ph - 12, pw - 14, ph - 12);
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `SENAI Feira de Santana | Plano de Acao SAEP 2026 | Pagina ${i} de ${total}`,
      pw / 2, ph - 7, { align: "center" }
    );
  }
}

/* ─── Main export ─── */
export function exportChatResponsePdf(content: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 14;
  const mr = 14;
  const maxW = pw - ml - mr;

  addHeader(doc);
  let y = 32;

  const cleaned = strip(content);
  const lines = cleaned.split("\n");
  let li = 0;

  const checkPage = (need: number) => {
    if (y + need > ph - 16) {
      doc.addPage();
      y = 14;
    }
  };

  while (li < lines.length) {
    const raw = lines[li];
    const t = raw.trim();

    // ─── Table block → use autoTable ───
    if (t.startsWith("|")) {
      const table = parseTables(lines, li);
      if (table) {
        checkPage(20);

        autoTable(doc, {
          startY: y,
          head: [table.headers],
          body: table.rows.map(r => table.headers.map((_, ci) => r[ci] || "")),
          margin: { left: ml, right: mr },
          styles: {
            fontSize: 7.5,
            cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
            lineColor: [200, 210, 220],
            lineWidth: 0.25,
            overflow: "linebreak",
            font: "helvetica",
          },
          headStyles: {
            fillColor: [0, 82, 148],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
            halign: "left",
          },
          alternateRowStyles: {
            fillColor: [245, 247, 252],
          },
          bodyStyles: {
            textColor: [40, 40, 40],
          },
          tableLineColor: [200, 210, 220],
          tableLineWidth: 0.25,
          didDrawPage: () => {
            // Ensure header on new pages
          },
        });

        y = (doc as any).lastAutoTable.finalY + 6;
        li = table.endIdx;
        continue;
      }
    }

    // ─── Headings ───
    if (t.startsWith("# ")) {
      checkPage(12);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 72, 138);
      const wrapped = doc.splitTextToSize(t.replace(/^#+\s*/, ""), maxW);
      doc.text(wrapped, ml, y);
      y += wrapped.length * 6 + 3;
      // Underline
      doc.setDrawColor(0, 82, 148);
      doc.setLineWidth(0.6);
      doc.line(ml, y - 2, ml + 50, y - 2);
      y += 2;
    } else if (t.startsWith("## ")) {
      checkPage(10);
      doc.setFontSize(11.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 72, 138);
      const wrapped = doc.splitTextToSize(t.replace(/^#+\s*/, ""), maxW);
      doc.text(wrapped, ml, y);
      y += wrapped.length * 5.5 + 3;
      doc.setDrawColor(0, 102, 178);
      doc.setLineWidth(0.4);
      doc.line(ml, y - 2, ml + 40, y - 2);
      y += 1;
    } else if (t.startsWith("### ")) {
      checkPage(8);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      const wrapped = doc.splitTextToSize(t.replace(/^#+\s*/, ""), maxW);
      doc.text(wrapped, ml, y);
      y += wrapped.length * 5 + 2;
    }
    // ─── Bullets ───
    else if (t.startsWith("- ") || t.startsWith("* ")) {
      checkPage(6);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const bulletText = t.replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(bulletText, maxW - 8);
      doc.setFillColor(0, 82, 148);
      doc.circle(ml + 2, y - 1.2, 0.8, "F");
      doc.text(wrapped, ml + 6, y);
      y += wrapped.length * 4.2 + 2;
    }
    // ─── Numbered ───
    else if (/^\d+\.\s/.test(t)) {
      checkPage(6);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const numText = t.replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(numText, maxW - 4);
      doc.text(wrapped, ml + 2, y);
      y += wrapped.length * 4.2 + 2;
    }
    // ─── Blank ───
    else if (t === "") {
      y += 2.5;
    }
    // ─── Normal text ───
    else {
      checkPage(6);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const cleanLine = t.replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(cleanLine, maxW);
      doc.text(wrapped, ml, y);
      y += wrapped.length * 4.2 + 1.5;
    }

    li++;
  }

  addFooters(doc);

  const now = new Date();
  doc.save(`relatorio-agente-ia-${now.toISOString().slice(0, 10)}.pdf`);
  return doc;
}

export function getChatResponsePlainText(content: string): string {
  return strip(content)
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-*]\s*/gm, "- ");
}
