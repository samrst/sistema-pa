export type PdfTable = {
  headers: string[];
  rows: string[][];
};

export type ReportBlock =
  | { type: "heading"; text: string; level: 1 | 2 | 3 | 4 }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "numbered"; text: string }
  | { type: "alert"; text: string; tone: "critical" | "success" | "info" }
  | { type: "table"; tableIndex: number };

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n+ */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripPdfEmojis(text: string): string {
  return normalizeWhitespace(
    text
      .replace(/\u{2705}/gu, "[OK]")
      .replace(/\u{274C}/gu, "[X]")
      .replace(/\u{26A0}\u{FE0F}?/gu, "[!]")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{1FA00}-\u{1FAFF}]/gu, "")
  );
}

function getElementText(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return stripPdfEmojis(clone.textContent || "");
}

function parseTable(tableElement: Element): PdfTable | null {
  const headerCells = Array.from(tableElement.querySelectorAll("thead tr:first-child th, thead tr:first-child td"));
  const bodyRows = Array.from(tableElement.querySelectorAll("tbody tr"));
  const allRows = Array.from(tableElement.querySelectorAll("tr"));

  let headers = headerCells.map((cell) => getElementText(cell));
  let rowElements = bodyRows;

  if (!headers.length && allRows.length > 0) {
    const firstRowCells = Array.from(allRows[0].querySelectorAll("th, td"));
    headers = firstRowCells.map((cell) => getElementText(cell));
    rowElements = allRows.slice(1);
  }

  const rows = rowElements
    .map((row) => Array.from(row.querySelectorAll("th, td")).map((cell) => getElementText(cell)))
    .filter((row) => row.some(Boolean));

  if (!headers.length || !rows.length) return null;

  return {
    headers,
    rows: rows.map((row) => headers.map((_, index) => row[index] || "")),
  };
}

export function parseReportHtml(html: string): { blocks: ReportBlock[]; tables: PdfTable[] } {
  const parser = new DOMParser();
  const normalizedHtml = html.replace(/<br\s*\/?>/gi, "<br />");
  const doc = parser.parseFromString(`<div data-pdf-root="true">${normalizedHtml}</div>`, "text/html");
  const root = doc.querySelector("[data-pdf-root='true']");
  const blocks: ReportBlock[] = [];
  const tables: PdfTable[] = [];

  if (!root) return { blocks, tables };

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = stripPdfEmojis(child.textContent || "");
        if (text) blocks.push({ type: "paragraph", text });
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const element = child as Element;
      const tag = element.tagName.toLowerCase();

      if (tag === "table") {
        const table = parseTable(element);
        if (table) {
          tables.push(table);
          blocks.push({ type: "table", tableIndex: tables.length - 1 });
        }
        return;
      }

      if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
        const text = getElementText(element);
        if (text) blocks.push({ type: "heading", text, level: Number(tag[1]) as 1 | 2 | 3 | 4 });
        return;
      }

      if (tag === "p" || tag === "blockquote") {
        const text = getElementText(element);
        if (text) blocks.push({ type: "paragraph", text });
        return;
      }

      if (tag === "ul" || tag === "ol") {
        Array.from(element.querySelectorAll(":scope > li")).forEach((li) => {
          const text = getElementText(li);
          if (text) blocks.push({ type: tag === "ol" ? "numbered" : "bullet", text });
        });
        return;
      }

      if (["div", "section", "article", "header", "main"].includes(tag)) {
        const tone = element.classList.contains("alert-critical")
          ? "critical"
          : element.classList.contains("alert-success")
            ? "success"
            : element.classList.contains("alert-info")
              ? "info"
              : null;

        if (tone) {
          const text = getElementText(element);
          if (text) blocks.push({ type: "alert", text, tone });
          return;
        }

        walk(element);
        return;
      }

      const text = getElementText(element);
      if (text) blocks.push({ type: "paragraph", text });
    });
  };

  walk(root);

  return { blocks, tables };
}

export function getPreferredPdfOrientation(tables: PdfTable[]): "portrait" | "landscape" {
  const widestTable = tables.reduce((max, table) => Math.max(max, table.headers.length), 0);
  return widestTable >= 5 ? "landscape" : "portrait";
}

export function buildColumnStyles(headers: string[], availableWidth: number): Record<number, { cellWidth: number }> {
  const colCount = headers.length;
  if (colCount === 0) return {};
  if (colCount === 1) return { 0: { cellWidth: availableWidth } };

  // Calculate weights based on header text lengths
  const minWeight = 10;
  const weights = headers.map((header) => Math.min(Math.max(header.length, minWeight), 28));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  const styles: Record<number, { cellWidth: number }> = {};
  let accumulated = 0;

  for (let i = 0; i < colCount - 1; i++) {
    const w = Math.floor((weights[i] / totalWeight) * availableWidth * 10) / 10;
    styles[i] = { cellWidth: w };
    accumulated += w;
  }

  styles[colCount - 1] = { cellWidth: Math.max(10, Math.round((availableWidth - accumulated) * 10) / 10) };

  return styles;
}