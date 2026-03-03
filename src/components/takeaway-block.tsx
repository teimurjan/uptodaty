interface TakeawayBlockProps {
  text: string;
  color: string;
}

export function TakeawayBlock({ text, color }: TakeawayBlockProps) {
  return (
    <div
      className="mb-5 px-4 py-3"
      style={{
        background: `${color}0a`,
        borderLeft: `2px solid ${color}60`,
      }}
    >
      <div
        className="mb-1.5 font-mono text-[9px] uppercase tracking-[2px]"
        style={{ color }}
      >
        Key Takeaway
      </div>
      <div className="font-body text-[13px] leading-relaxed text-text-primary">
        {text}
      </div>
    </div>
  );
}
