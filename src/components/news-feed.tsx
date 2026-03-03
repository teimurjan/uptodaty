"use client";

import { useKeyboardNav } from "@/hooks/use-keyboard-nav";
import { useNewsFeed } from "@/hooks/use-news-feed";
import { useScrollTracker } from "@/hooks/use-scroll-tracker";
import { useWheelNav } from "@/hooks/use-wheel-nav";
import { EndCard } from "./end-card";
import { ErrorScreen } from "./error-screen";
import { LoadingScreen } from "./loading-screen";
import { NewsCard } from "./news-card";
import { ScrollHint } from "./scroll-hint";
import { TopBar } from "./top-bar";

export function NewsFeed() {
  const { news, loading, progress, error, refresh } = useNewsFeed();
  const totalCards = news.length + 1;
  const { containerRef, currentIndex } = useScrollTracker(totalCards);
  useKeyboardNav(containerRef, currentIndex, totalCards);
  useWheelNav(containerRef, currentIndex, totalCards);

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
          />

          <div
            ref={containerRef}
            className="scrollbar-none h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth"
          >
            {news.map((item, i) => (
              <div key={item.headline} data-card={i} className="h-full">
                <NewsCard
                  item={item}
                  index={i}
                  total={news.length}
                  scrollContainerRef={containerRef}
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
