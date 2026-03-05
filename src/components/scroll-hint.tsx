interface ScrollHintProps {
  visible: boolean;
}

export function ScrollHint({ visible }: ScrollHintProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 font-mono text-xs tracking-[2px] text-text-secondary/40">
      SWIPE UP · ↓ · J
    </div>
  );
}
