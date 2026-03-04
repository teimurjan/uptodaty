import type { NewsItem } from "./types";

function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

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

  const items = parsed as NewsItem[];

  const ids = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    if (!items[i].id) {
      items[i].id = toKebabCase(items[i].headline) || `item-${i}`;
    }
    if (ids.has(items[i].id)) {
      items[i].id = `${items[i].id}-${i}`;
    }
    ids.add(items[i].id);
  }

  for (const item of items) {
    if (item.relatedTo) {
      item.relatedTo = item.relatedTo.filter(
        (ref) => ids.has(ref) && ref !== item.id,
      );
      if (item.relatedTo.length === 0) {
        delete item.relatedTo;
      }
    }
  }

  return items;
}
