import type { VerticalId } from "@/lib/verticals";
import { VerticalSelector } from "./vertical-selector";

interface TopBarProps {
  currentIndex: number;
  totalItems: number;
  selectedVertical: VerticalId;
  onSelectVertical: (id: VerticalId) => void;
}

export function TopBar({
  currentIndex,
  totalItems,
  selectedVertical,
  onSelectVertical,
}: TopBarProps) {
  return (
    <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between bg-gradient-to-b from-bg-dark from-60% to-transparent px-6 py-4">
      <div className="-tracking-wide font-heading text-base font-bold text-accent">
        UPTODATY
      </div>
      <div className="flex items-center gap-3">
        <VerticalSelector
          selected={selectedVertical}
          onSelect={onSelectVertical}
        />
        <span className="font-mono text-xs tracking-[2px] text-text-secondary">
          {currentIndex + 1}/{totalItems}
        </span>
      </div>
    </div>
  );
}
