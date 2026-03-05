"use client";

import { useEffect } from "react";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";
import { useScrollTracker } from "@/hooks/use-scroll-tracker";
import { useWheelNav } from "@/hooks/use-wheel-nav";
import type { NewsItem } from "@/lib/types";
import type { VerticalId } from "@/lib/verticals";
import { EndCard } from "./end-card";
import { ErrorScreen } from "./error-screen";
import { LoadingScreen } from "./loading-screen";
import { NewsCard } from "./news-card";
import { ScrollHint } from "./scroll-hint";
import { TopBar } from "./top-bar";

interface NewsFeedProps {
  news: NewsItem[];
  loading: boolean;
  progress: number;
  error: string | null;
  refresh: () => void;
  onOpenTree: (itemId: string) => void;
  onCurrentItemChange?: (itemId: string | null, index?: number) => void;
  selectedVertical: VerticalId;
  onSelectVertical: (id: VerticalId) => void;
}

export function NewsFeed({
  news,
  loading,
  progress,
  error,
  refresh,
  onOpenTree,
  onCurrentItemChange,
  selectedVertical,
  onSelectVertical,
}: NewsFeedProps) {
  const totalCards = news.length + 1;
  const { containerRef, currentIndex } = useScrollTracker(totalCards);
  useKeyboardNav(containerRef, currentIndex, totalCards);
  useWheelNav(containerRef, currentIndex, totalCards);

  useEffect(() => {
    const item = currentIndex < news.length ? news[currentIndex] : null;
    onCurrentItemChange?.(item?.id ?? null, currentIndex);
  }, [currentIndex, news, onCurrentItemChange]);

  return (
    <div className="relative h-full">
      {loading ? (
        <LoadingScreen progress={progress} />
      ) : error ? (
        <ErrorScreen message={error} onRetry={refresh} />
      ) : (
        <>
          <TopBar
            currentIndex={Math.min(currentIndex, news.length - 1)}
            totalItems={news.length}
            selectedVertical={selectedVertical}
            onSelectVertical={onSelectVertical}
          />

          <div
            ref={containerRef}
            className="scrollbar-none h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth"
          >
            {news.map((item, i) => (
              <div key={item.id} data-card={i} className="h-full">
                <NewsCard
                  item={item}
                  index={i}
                  total={news.length}
                  scrollContainerRef={containerRef}
                  onOpenTree={onOpenTree}
                />
              </div>
            ))}

            <div data-card={news.length} className="h-full">
              <EndCard
                itemCount={news.length}
                scrollContainerRef={containerRef}
              />
            </div>
          </div>

          <ScrollHint visible={currentIndex === 0} />
        </>
      )}
    </div>
  );
}
