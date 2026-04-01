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

/* ─── Parse HTML tables from content ─── */
function parseHtmlTables(html: string): { headers: string[]; rows: string[][] }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const tables: { headers: string[]; rows: string[][] }[] = [];

  doc.querySelectorAll("table").forEach(table => {
    const headers: string[] = [];
    table.querySelectorAll("thead th").forEach(th => {
      headers.push((th.textContent || "").trim());
    });

    const rows: string[][] = [];
    table.querySelectorAll("tbody tr").forEach(tr => {
      const row: string[] = [];
      tr.querySelectorAll("td").forEach(td => {
        row.push((td.textContent || "").trim());
      });
      rows.push(row);
    });

    if (headers.length > 0 && rows.length > 0) {
      tables.push({ headers, rows });
    }
  });

  return tables;
}

/* ─── Extract plain text blocks from HTML ─── */
function htmlToBlocks(html: string): { type: string; text: string; level?: number }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const blocks: { type: string; text: string; level?: number }[] = [];
  const root = doc.querySelector("div")!;

  function walk(node: Element) {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();

      if (tag === "table") {
        blocks.push({ type: "table-placeholder", text: "" });
        continue;
      }

      if (tag === "h2") {
        blocks.push({ type: "heading", text: (child.textContent || "").trim(), level: 2 });
      } else if (tag === "h3") {
        blocks.push({ type: "heading", text: (child.textContent || "").trim(), level: 3 });
      } else if (tag === "h4") {
        blocks.push({ type: "heading", text: (child.textContent || "").trim(), level: 4 });
      } else if (tag === "p") {
        const text = (child.textContent || "").trim();
        if (text) blocks.push({ type: "paragraph", text });
      } else if (tag === "ul" || tag === "ol") {
        child.querySelectorAll("li").forEach(li => {
          blocks.push({ type: tag === "ol" ? "numbered" : "bullet", text: (li.textContent || "").trim() });
        });
      } else if (tag === "div") {
        if (child.classList.contains("alert-critical") || child.classList.contains("alert-success") || child.classList.contains("alert-info")) {
          blocks.push({ type: "alert", text: (child.textContent || "").trim() });
        } else {
          walk(child);
        }
      } else if (tag === "section") {
        walk(child);
      }
    }
  }

  walk(root);
  return blocks;
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
  const blocks = htmlToBlocks(cleaned);
  const tables = parseHtmlTables(cleaned);
  let tableIdx = 0;

  const checkPage = (need: number) => {
    if (y + need > ph - 16) {
      doc.addPage();
      y = 14;
    }
  };

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        if (block.level === 2) {
          checkPage(12);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 72, 138);
          const wrapped = doc.splitTextToSize(block.text, maxW);
          doc.text(wrapped, ml, y);
          y += wrapped.length * 5.5 + 3;
          doc.setDrawColor(0, 82, 148);
          doc.setLineWidth(0.5);
          doc.line(ml, y - 2, ml + 45, y - 2);
          y += 2;
        } else if (block.level === 3) {
          checkPage(8);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 82, 148);
          const wrapped = doc.splitTextToSize(block.text, maxW);
          doc.text(wrapped, ml, y);
          y += wrapped.length * 5 + 2;
        } else {
          checkPage(7);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(50, 50, 50);
          const wrapped = doc.splitTextToSize(block.text, maxW);
          doc.text(wrapped, ml, y);
          y += wrapped.length * 4.5 + 2;
        }
        break;
      }

      case "table-placeholder": {
        if (tableIdx < tables.length) {
          const table = tables[tableIdx];
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
          });

          y = (doc as any).lastAutoTable.finalY + 6;
          tableIdx++;
        }
        break;
      }

      case "bullet": {
        checkPage(6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const wrapped = doc.splitTextToSize(block.text, maxW - 8);
        doc.setFillColor(0, 82, 148);
        doc.circle(ml + 2, y - 1.2, 0.8, "F");
        doc.text(wrapped, ml + 6, y);
        y += wrapped.length * 4.2 + 2;
        break;
      }

      case "numbered": {
        checkPage(6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const wrapped = doc.splitTextToSize(block.text, maxW - 4);
        doc.text(wrapped, ml + 2, y);
        y += wrapped.length * 4.2 + 2;
        break;
      }

      case "alert": {
        checkPage(10);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 60, 60);
        const wrapped = doc.splitTextToSize(block.text, maxW - 8);
        doc.setFillColor(255, 240, 240);
        doc.roundedRect(ml, y - 4, maxW, wrapped.length * 4.2 + 6, 2, 2, "F");
        doc.setDrawColor(200, 80, 80);
        doc.setLineWidth(0.6);
        doc.line(ml, y - 4, ml, y - 4 + wrapped.length * 4.2 + 6);
        doc.text(wrapped, ml + 4, y);
        y += wrapped.length * 4.2 + 6;
        break;
      }

      case "paragraph":
      default: {
        checkPage(6);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const wrapped = doc.splitTextToSize(block.text, maxW);
        doc.text(wrapped, ml, y);
        y += wrapped.length * 4.2 + 2;
        break;
      }
    }
  }

  addFooters(doc);

  const now = new Date();
  doc.save(`relatorio-agente-ia-${now.toISOString().slice(0, 10)}.pdf`);
  return doc;
}

export function getChatResponsePlainText(content: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${content}</div>`, "text/html");
  return strip(doc.body.textContent || "");
}
