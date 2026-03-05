"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getVertical,
  VERTICAL_IDS,
  VERTICALS,
  type VerticalId,
} from "@/lib/verticals";

interface VerticalSelectorProps {
  selected: VerticalId;
  onSelect: (id: VerticalId) => void;
}

export function VerticalSelector({
  selected,
  onSelect,
}: VerticalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () =>
        document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [isOpen, handleOutsideClick]);

  const current = getVertical(selected);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-white/10"
      >
        <span className="max-w-32 truncate">{current.label}</span>
        <IconChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-bg-card shadow-2xl"
          >
            {VERTICAL_IDS.map((id) => {
              const vertical = VERTICALS[id];
              const isSelected = id === selected;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onSelect(id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    isSelected ? "bg-white/5" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium ${
                        isSelected ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {vertical.label}
                    </div>
                    <div className="truncate text-xs text-text-tertiary">
                      {vertical.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
