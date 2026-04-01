import React from "react";
import type { Components } from "react-markdown";

/* ─── Status detection ─── */
function getStatusStyle(text: string): { bg: string; color: string; label: string } | null {
  const t = text.toLowerCase().trim();
  if (/conclu[ií]d[oa]/.test(t)) return { bg: "#e6f4ea", color: "#1e7e34", label: text };
  if (/em andamento/.test(t)) return { bg: "#e3f0ff", color: "#1a6dd4", label: text };
  if (/n[aã]o iniciad[oa]/.test(t)) return { bg: "#fff8e1", color: "#c77c00", label: text };
  if (/atrasad[oa]|vencid[oa]|cr[ií]tic[oa]/.test(t)) return { bg: "#fdecea", color: "#c62828", label: text };
  if (/planejad[oa]/.test(t)) return { bg: "#f3e8ff", color: "#7c3aed", label: text };
  return null;
}

/* ─── Table components ─── */
const MarkdownTable: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ children }) => (
  <div className="ai-table-wrap">
    <table className="ai-table">{children}</table>
  </div>
);

const MarkdownThead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children }) => (
  <thead className="ai-thead">{children}</thead>
);

const MarkdownTr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children }) => (
  <tr className="ai-tr">{children}</tr>
);

const MarkdownTh: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children }) => (
  <th className="ai-th">{children}</th>
);

const MarkdownTd: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children }) => {
  const text = String(children ?? "").trim();
  const status = getStatusStyle(text);

  if (status) {
    return (
      <td className="ai-td">
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: "12px",
            fontSize: "10.5px",
            fontWeight: 600,
            background: status.bg,
            color: status.color,
            whiteSpace: "nowrap",
          }}
        >
          {status.label}
        </span>
      </td>
    );
  }

  return <td className="ai-td">{children}</td>;
};

/* ─── Headings with visual hierarchy ─── */
const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children }) => (
  <h2 className="ai-h2">{children}</h2>
);

const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children }) => (
  <h3 className="ai-h3">{children}</h3>
);

const H4: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children }) => (
  <h4 className="ai-h4">{children}</h4>
);

export const markdownComponents: Partial<Components> = {
  table: MarkdownTable as any,
  thead: MarkdownThead as any,
  tr: MarkdownTr as any,
  th: MarkdownTh as any,
  td: MarkdownTd as any,
  h2: H2 as any,
  h3: H3 as any,
  h4: H4 as any,
};
