import type { NewsCategory } from "./types";

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  LLMs: "#c8ff00",
  "Open Source": "#00d4ff",
  Funding: "#ff6b9d",
  Infra: "#ffa64d",
  Research: "#b388ff",
  Product: "#4dd0e1",
  Regulation: "#ff8a80",
  Robotics: "#69f0ae",
  Vision: "#ffd740",
  "GitHub Trending": "#f78166",
  General: "#e0e0e0",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as NewsCategory] ?? CATEGORY_COLORS.General;
}
