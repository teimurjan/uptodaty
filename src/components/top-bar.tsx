interface TopBarProps {
  currentIndex: number;
  totalItems: number;
}

export function TopBar({ currentIndex, totalItems }: TopBarProps) {
  return (
    <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between bg-gradient-to-b from-bg-dark from-60% to-transparent px-6 py-4">
      <div className="-tracking-wide font-heading text-base font-bold text-accent">
        UPTODATY
      </div>
      <span className="font-mono text-[10px] tracking-[2px] text-text-secondary">
        {currentIndex + 1}/{totalItems}
      </span>
    </div>
  );
}
