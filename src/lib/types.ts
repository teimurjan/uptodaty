export type ImpactLevel = "HIGH" | "MEDIUM" | "LOW";

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
  | "General";

export interface NewsItem {
  headline: string;
  summary: string;
  takeaway?: string;
  category: NewsCategory;
  source?: string;
  impact?: ImpactLevel;
}
