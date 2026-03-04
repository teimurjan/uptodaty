export type NewsCategory =
  | "LLMs"
  | "Open Source"
  | "Funding"
  | "Infra"
  | "Research"
  | "Product"
  | "Regulation"
  | "Robotics"
  | "Vision"
  | "GitHub Trending"
  | "General";

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  takeaway?: string;
  category: NewsCategory;
  source?: string;
  url?: string;
  date?: string;
  relatedTo?: string[];
}
