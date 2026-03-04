"use client";

import { motion } from "framer-motion";
import type { NewsItem } from "@/lib/types";
import { TreeView } from "./tree-view";

interface TreeOverlayProps {
  feedItems: NewsItem[];
  focusedItemId: string;
  onClose: () => void;
}

export function TreeOverlay({
  feedItems,
  focusedItemId,
  onClose,
}: TreeOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-bg-dark md:hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <TreeView
        feedItems={feedItems}
        focusedItemId={focusedItemId}
        onClose={onClose}
      />
    </motion.div>
  );
}
