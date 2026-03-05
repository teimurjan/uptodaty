import type { NewsCategory } from "./types";

export const GRAPH_NAME = "uptodaty";
export const EMBEDDING_DIM = 1536;
export const DEDUP_THRESHOLD = 0.85;
export const RELATED_THRESHOLD = 0.7;

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
  Languages: "#4fc3f7",
  Tooling: "#81c784",
  Architecture: "#ffb74d",
  DevOps: "#ce93d8",
  Security: "#ff8a65",
  Protocols: "#64b5f6",
  DeFi: "#4db6ac",
  Infrastructure: "#7986cb",
  NFTs: "#f48fb1",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as NewsCategory] ?? CATEGORY_COLORS.General;
}
