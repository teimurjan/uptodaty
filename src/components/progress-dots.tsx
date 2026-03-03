interface ProgressDotsProps {
  total: number;
  activeIndex: number;
  color: string;
}

export function ProgressDots({ total, activeIndex, color }: ProgressDotsProps) {
  return (
    <div className="absolute right-3 top-1/2 z-2 flex -translate-y-1/2 flex-col gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm transition-all duration-300"
          style={{
            height: i === activeIndex ? 24 : 8,
            background: i === activeIndex ? color : "rgba(136, 136, 136, 0.25)",
          }}
        />
      ))}
    </div>
  );
}
