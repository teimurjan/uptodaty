import { getCategoryColor } from "@/lib/constants";

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = getCategoryColor(category);

  return (
    <div
      className="inline-block rounded-sm px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[2px]"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
      }}
    >
      {category}
    </div>
  );
}
