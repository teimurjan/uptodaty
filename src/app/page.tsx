"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { NewsFeed } from "@/components/news-feed";
import { TreeOverlay } from "@/components/tree-overlay";
import { TreeView } from "@/components/tree-view";
import { prefetchNeighborhood } from "@/hooks/use-graph-neighborhood";
import { useNewsFeed } from "@/hooks/use-news-feed";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export default function Home() {
  const [verticalId, setVerticalId] = useState<VerticalId>(DEFAULT_VERTICAL_ID);
  const feedState = useNewsFeed(verticalId);
  const [treeItem, setTreeItem] = useState<string | null>(null);
  const treeOpen = treeItem !== null;
  const currentIndexRef = useRef(0);

  const handleCurrentItemChange = useCallback(
    (itemId: string | null, index?: number) => {
      if (treeOpen && itemId) setTreeItem(itemId);

      if (index !== undefined) {
        currentIndexRef.current = index;
        const { news } = feedState;
        for (const offset of [-1, 0, 1]) {
          const neighbor = news[index + offset];
          if (neighbor) prefetchNeighborhood(neighbor.id);
        }
      }
    },
    [treeOpen, feedState],
  );

  return (
    <div className="flex h-dvh items-center justify-center overflow-hidden bg-black md:gap-6 md:p-8">
      <motion.div
        layout
        transition={springTransition}
        className="relative h-full w-full shrink-0 overflow-hidden bg-bg-dark md:h-[844px] md:max-h-[calc(100dvh-4rem)] md:w-[390px] md:rounded-[40px] md:border md:border-white/10 md:shadow-2xl"
      >
        <NewsFeed
          {...feedState}
          onOpenTree={setTreeItem}
          onCurrentItemChange={handleCurrentItemChange}
          selectedVertical={verticalId}
          onSelectVertical={setVerticalId}
        />
      </motion.div>

      <AnimatePresence mode="popLayout">
        {treeOpen && treeItem && (
          <motion.div
            key="tree-panel"
            layout
            className="hidden max-w-[1000px] shrink-0 overflow-hidden rounded-2xl border border-white/10 md:flex md:h-[844px] md:max-h-[calc(100dvh-4rem)] md:w-[calc(100vw-390px-5rem)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springTransition}
          >
            <TreeView
              feedItems={feedState.news}
              focusedItemId={treeItem}
              onClose={() => setTreeItem(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {treeOpen && treeItem && (
          <TreeOverlay
            key="tree-overlay"
            feedItems={feedState.news}
            focusedItemId={treeItem}
            onClose={() => setTreeItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
