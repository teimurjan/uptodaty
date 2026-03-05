"use client";

import { IconCheck } from "@tabler/icons-react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { RefObject } from "react";
import { useRef } from "react";

interface EndCardProps {
  itemCount: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function EndCard({ itemCount, scrollContainerRef }: EndCardProps) {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    container: scrollContainerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -60]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.95, 1, 1, 0.95],
  );

  return (
    <div
      ref={cardRef}
      className="flex h-full snap-start flex-col items-center justify-center p-8 font-heading"
    >
      <motion.div
        className="flex flex-col items-center"
        style={{ opacity, y, scale }}
      >
        <IconCheck className="mb-4" size={40} />
        <div className="mb-2 text-base font-bold text-text-primary">
          You&apos;re up to date
        </div>
        <div className="font-body text-sm text-text-secondary">
          {itemCount} signals processed · {dateLabel}
        </div>
      </motion.div>
    </div>
  );
}
