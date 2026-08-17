/**
 * Extract HTML or Markdown tables from AI response and export as CSV (semicolon-separated).
 */
function extractTables(content: string): { headers: string[]; rows: string[][] }[] {
  const tables: { headers: string[]; rows: string[][] }[] = [];

  // 1. Try extracting HTML tables if present
  if (typeof DOMParser !== "undefined" && content.includes("<table")) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${content}</div>`, "text/html");
      doc.querySelectorAll("table").forEach((table) => {
        const headers: string[] = [];
        table.querySelectorAll("thead th, thead td, tr:first-child th").forEach((th) => {
          headers.push((th.textContent || "").trim());
        });

        const rows: string[][] = [];
        const bodyRows = table.querySelectorAll("tbody tr");
        const targetRows = bodyRows.length > 0 ? bodyRows : table.querySelectorAll("tr:not(:first-child)");

        targetRows.forEach((tr) => {
          const row: string[] = [];
          tr.querySelectorAll("td, th").forEach((cell) => {
            row.push((cell.textContent || "").trim());
          });
          if (row.length > 0 && row.some((c) => c !== "")) {
            rows.push(row);
          }
        });

        if (headers.length > 0 && rows.length > 0) {
          tables.push({ headers, rows });
        }
      });

      if (tables.length > 0) {
        return tables;
      }
    } catch {
      // Fallback to markdown parser below
    }
  }

  // 2. Fallback: Parse Markdown tables with pipes (|)
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      let headers: string[] | null = null;
      const rows: string[][] = [];

      for (const tl of tableLines) {
        const cells = tl.split("|").filter(c => c.trim() !== "").map(c => c.trim().replace(/\*\*/g, ""));
        if (cells.some(c => /^[-:]+$/.test(c.trim()))) continue;
        if (!headers) {
          headers = cells;
        } else {
          rows.push(cells);
        }
      }

      if (headers && rows.length > 0) {
        tables.push({ headers, rows });
      }
      continue;
    }
    i++;
  }
  return tables;
}

export function exportChatCsv(content: string) {
  const tables = extractTables(content);
  if (tables.length === 0) {
    throw new Error("Nenhuma tabela encontrada na resposta.");
  }

  const csvParts: string[] = [];
  tables.forEach((table, idx) => {
    if (idx > 0) csvParts.push(""); // blank line separator
    csvParts.push(table.headers.join(";"));
    table.rows.forEach(row => {
      // Pad or trim row to match header length
      const padded = table.headers.map((_, ci) => (row[ci] || "").replace(/;/g, ","));
      csvParts.push(padded.join(";"));
    });
  });

  const csvContent = "\uFEFF" + csvParts.join("\n"); // BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `relatorio-agente-ia-${now}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportChatXlsxHtml(content: string) {
  const tables = extractTables(content);
  if (tables.length === 0) {
    throw new Error("Nenhuma tabela encontrada na resposta.");
  }

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:spreadsheet" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  th { background: #005A9C; color: #fff; font-weight: bold; padding: 6px 10px; border: 1px solid #003d6b; font-size: 11px; }
  td { padding: 5px 10px; border: 1px solid #ccc; font-size: 11px; }
  tr:nth-child(even) { background: #f0f4f8; }
</style>
</head><body>`;

  tables.forEach(table => {
    html += `<table border="1" cellspacing="0" cellpadding="4"><thead><tr>`;
    table.headers.forEach(h => { html += `<th>${h}</th>`; });
    html += `</tr></thead><tbody>`;
    table.rows.forEach(row => {
      html += `<tr>`;
      table.headers.forEach((_, ci) => { html += `<td>${row[ci] || ""}</td>`; });
      html += `</tr>`;
    });
    html += `</tbody></table><br/>`;
  });

  html += `</body></html>`;

  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `relatorio-agente-ia-${now}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
