"use client";

import { IconExternalLink } from "@tabler/icons-react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { RefObject } from "react";
import { useRef } from "react";
import { getCategoryColor } from "@/lib/constants";
import type { NewsItem } from "@/lib/types";
import { CategoryBadge } from "./category-badge";
import { ProgressDots } from "./progress-dots";
import { TakeawayBlock } from "./takeaway-block";

interface NewsCardProps {
  item: NewsItem;
  index: number;
  total: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onOpenTree: (itemId: string) => void;
}

export function NewsCard({
  item,
  index,
  total,
  scrollContainerRef,
  onOpenTree,
}: NewsCardProps) {
  const color = getCategoryColor(item.category);
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
      className="relative box-border flex h-full w-full shrink-0 snap-start flex-col justify-end bg-bg-dark px-6 pb-24"
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${color}08 0%, transparent 60%),
                       radial-gradient(ellipse at 80% 80%, ${color}05 0%, transparent 50%)`,
        }}
      />

      <div
        className="absolute right-6 top-[72px] z-0 font-heading text-[80px] font-black leading-none"
        style={{ color: `${color}08` }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <motion.div className="relative z-1" style={{ opacity, y, scale }}>
        <div className="mb-4">
          <CategoryBadge category={item.category} />
        </div>

        <h1 className="mb-4 font-heading text-[clamp(22px,5vw,32px)] font-bold leading-[1.15] -tracking-wide text-text-primary">
          {item.headline}
        </h1>

        <p className="mb-6 font-body text-[15px] leading-relaxed text-text-secondary">
          {item.summary}
        </p>

        {item.takeaway && <TakeawayBlock text={item.takeaway} color={color} />}

        <div className="flex items-center gap-4 font-mono text-xs text-text-secondary">
          {item.source && (
            <span className="flex items-center gap-1.5">
              <span style={{ color }}>●</span>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-text-primary"
                >
                  {item.source}
                  <IconExternalLink size={11} />
                </a>
              ) : (
                item.source
              )}
            </span>
          )}

          <button
            type="button"
            onClick={() => onOpenTree(item.id)}
            className="ml-auto font-mono text-xs tracking-wide transition-colors hover:brightness-125 underline cursor-pointer"
            style={{ color }}
          >
            View Related
          </button>
        </div>
      </motion.div>

      <ProgressDots total={total} activeIndex={index} color={color} />
    </div>
  );
}
