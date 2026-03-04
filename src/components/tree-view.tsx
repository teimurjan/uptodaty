"use client";

import dagre from "@dagrejs/dagre";
import { IconMinus, IconPlus, IconX } from "@tabler/icons-react";
import {
  type Edge,
  type Node,
  ReactFlow,
  type ReactFlowInstance,
  SmoothStepEdge,
} from "@xyflow/react";
import { type MouseEvent, useCallback, useMemo, useRef } from "react";
import type { NewsItem } from "@/lib/types";
import { TreeViewNode } from "./tree-view-node";
import "@xyflow/react/dist/style.css";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 150;

const nodeTypes = { treeNode: TreeViewNode };
const edgeTypes = { smoothstep: SmoothStepEdge };

function buildGraph(
  items: NewsItem[],
  focusedItemId: string,
): { nodes: Node[]; edges: Edge[] } {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const connectedIds = new Set<string>();

  const focusedItem = itemMap.get(focusedItemId);
  if (focusedItem) {
    connectedIds.add(focusedItemId);
    for (const targetId of focusedItem.relatedTo ?? []) {
      if (itemMap.has(targetId)) connectedIds.add(targetId);
    }
  }

  for (const item of items) {
    if (item.relatedTo?.includes(focusedItemId)) {
      connectedIds.add(item.id);
    }
  }

  const relevantItems = items.filter((item) => connectedIds.has(item.id));

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];
  for (const item of relevantItems) {
    for (const targetId of item.relatedTo ?? []) {
      if (!connectedIds.has(targetId)) continue;
      const edgeKey = [item.id, targetId].sort().join("--");
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);
      edges.push({
        id: `${item.id}-${targetId}`,
        source: item.id,
        target: targetId,
        type: "smoothstep",
        animated: item.id === focusedItemId || targetId === focusedItemId,
        style: { stroke: "var(--color-border)", strokeWidth: 1.5 },
      });
    }
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  for (const item of relevantItems) {
    g.setNode(item.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const nodes: Node[] = relevantItems.map((item) => {
    const pos = g.node(item.id);
    return {
      id: item.id,
      type: "treeNode",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        headline: item.headline,
        summary: item.summary,
        url: item.url,
        category: item.category,
        date: item.date ?? new Date().toISOString().slice(0, 10),
        isFocused: item.id === focusedItemId,
      },
      draggable: false,
      selectable: false,
    };
  });

  return { nodes, edges };
}

interface TreeViewProps {
  items: NewsItem[];
  focusedItemId: string;
  onClose: () => void;
}

export function TreeView({ items, focusedItemId, onClose }: TreeViewProps) {
  const rfRef = useRef<ReactFlowInstance | null>(null);

  const { nodes, edges } = useMemo(
    () => buildGraph(items, focusedItemId),
    [items, focusedItemId],
  );

  const fitViewOptions = useMemo(
    () => ({ padding: 0.3, maxZoom: nodes.length <= 2 ? 0.85 : 0.65 }),
    [nodes.length],
  );

  const zoomIn = useCallback(
    () => rfRef.current?.zoomIn({ duration: 200 }),
    [],
  );
  const zoomOut = useCallback(
    () => rfRef.current?.zoomOut({ duration: 200 }),
    [],
  );

  const handleNodeClick = useCallback((event: MouseEvent, node: Node) => {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-source-link]")) return;
    const url = node.data.url as string | undefined;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={zoomIn}
          className="rounded-full bg-bg-card p-1.5 text-text-secondary transition-colors hover:text-text-primary"
        >
          <IconPlus size={16} />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="rounded-full bg-bg-card p-1.5 text-text-secondary transition-colors hover:text-text-primary"
        >
          <IconMinus size={16} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-bg-card p-1.5 text-text-secondary transition-colors hover:text-text-primary"
        >
          <IconX size={16} />
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          rfRef.current = instance;
        }}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={fitViewOptions}
        panOnDrag
        zoomOnScroll
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--color-bg-dark)" }}
      />
    </div>
  );
}
