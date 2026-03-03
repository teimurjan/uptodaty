import type { NewsItem } from "./types";

export function parseNewsJson(text: string): NewsItem[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error(
      `Could not find JSON array in response: ${text.slice(0, 300)}`,
    );
  }

  const parsed: unknown = JSON.parse(match[0]);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("No news items in response");
  }

  return parsed as NewsItem[];
}
