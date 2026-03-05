import type { VerticalId } from "@/lib/verticals";

export interface RawArticle {
  title: string;
  url: string | null;
  score: number;
  commentCount: number;
  author: string;
  publishedAt: Date;
  body: string | null;
  sourceName: string;
  sourceUrl: string;
  vertical?: VerticalId;
}

export interface SourceResult {
  sourceName: string;
  articles: RawArticle[];
  fetchedAt: Date;
  error: string | null;
}

export interface Source {
  name: string;
  fetch: (limit: number) => Promise<SourceResult>;
}
