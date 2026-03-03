"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

export function useWheelNav(
  containerRef: RefObject<HTMLDivElement | null>,
  currentIndex: number,
  totalItems: number,
) {
  const isScrolling = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();

      if (isScrolling.current || !container) return;

      const threshold = 30;
      if (Math.abs(event.deltaY) < threshold) return;

      const cards = container.querySelectorAll<HTMLElement>("[data-card]");
      const targetIndex =
        event.deltaY > 0
          ? Math.min(currentIndex + 1, totalItems - 1)
          : Math.max(currentIndex - 1, 0);

      if (targetIndex === currentIndex) return;

      isScrolling.current = true;
      cards[targetIndex]?.scrollIntoView({ behavior: "smooth" });

      setTimeout(() => {
        isScrolling.current = false;
      }, 600);
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [containerRef, currentIndex, totalItems]);
}
