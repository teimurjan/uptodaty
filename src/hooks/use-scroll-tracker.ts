"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollTracker(itemCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || itemCount === 0) return;

    const cards = container.querySelectorAll<HTMLElement>("[data-card]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setCurrentIndex(Number((entry.target as HTMLElement).dataset.card));
          }
        }
      },
      { root: container, threshold: 0.6 },
    );

    for (const card of cards) {
      observer.observe(card);
    }

    return () => observer.disconnect();
  }, [itemCount]);

  return { containerRef, currentIndex };
}
