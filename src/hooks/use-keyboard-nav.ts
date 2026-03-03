"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

export function useKeyboardNav(
  containerRef: RefObject<HTMLDivElement | null>,
  currentIndex: number,
  totalItems: number,
) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const container = containerRef.current;
      if (!container) return;

      const cards = container.querySelectorAll<HTMLElement>("[data-card]");
      let targetIndex: number | null = null;

      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        targetIndex = Math.min(currentIndex + 1, totalItems - 1);
      } else if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        targetIndex = Math.max(currentIndex - 1, 0);
      }

      if (targetIndex !== null) {
        cards[targetIndex]?.scrollIntoView({ behavior: "smooth" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, currentIndex, totalItems]);
}
