import React from "react";
import type { Components } from "react-markdown";

const MarkdownTable: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ children, ...props }) => (
  <div className="relatorio-table-wrapper">
    <table {...props}>{children}</table>
  </div>
);

const MarkdownThead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => (
  <thead {...props}>{children}</thead>
);

const MarkdownTr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, ...props }) => (
  <tr {...props}>{children}</tr>
);

const MarkdownTh: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => (
  <th {...props}>{children}</th>
);

const MarkdownTd: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => {
  const text = String(children ?? "");
  let badge: React.ReactNode = null;

  if (/conclu[ií]d[oa]/i.test(text)) {
    badge = <span className="status-badge status-done">{text}</span>;
  } else if (/em andamento/i.test(text)) {
    badge = <span className="status-badge status-progress">{text}</span>;
  } else if (/n[aã]o iniciad[oa]/i.test(text)) {
    badge = <span className="status-badge status-pending">{text}</span>;
  } else if (/atrasad[oa]|vencid[oa]|cr[ií]tic[oa]/i.test(text)) {
    badge = <span className="status-badge status-critical">{text}</span>;
  }

  return <td {...props}>{badge || children}</td>;
};

export const markdownComponents: Partial<Components> = {
  table: MarkdownTable as any,
  thead: MarkdownThead as any,
  tr: MarkdownTr as any,
  th: MarkdownTh as any,
  td: MarkdownTd as any,
};
