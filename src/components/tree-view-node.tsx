"use client";

import { IconExternalLink } from "@tabler/icons-react";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { getCategoryColor } from "@/lib/constants";

interface TreeNodeData {
  headline: string;
  summary: string;
  url?: string;
  category: string;
  date?: string;
  isFocused: boolean;
  [key: string]: unknown;
}

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TreeViewNode({ data }: NodeProps) {
  const { headline, summary, url, category, date, isFocused } =
    data as TreeNodeData;
  const color = getCategoryColor(category);

  return (
    <div
      className="w-[220px] rounded-lg border bg-bg-card px-3 py-2 text-left"
      style={{
        borderColor: isFocused ? color : "var(--color-border)",
        boxShadow: isFocused ? `0 0 16px ${color}30` : "none",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <p className="font-heading text-xs leading-snug text-text-primary">
        {headline}
      </p>
      {date && (
        <span className="inline-block font-mono text-[9px] tracking-wide text-text-secondary text-right">
          {formatDate(date)}
        </span>
      )}
      <p className="border-t border-border pt-2 font-body text-[10px] leading-relaxed text-text-secondary">
        {summary}
      </p>
      {url && (
        <span
          data-source-link
          className="mt-1.5 inline-flex cursor-pointer items-center gap-1 border-b font-mono text-[9px] text-text-secondary"
        >
          Source <IconExternalLink size={10} />
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}
