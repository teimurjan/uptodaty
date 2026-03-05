import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { getItemsByDate, getRecentHeadlinesFromGraph } from "./graph";
import type { NewsItem } from "./types";

const isDev = process.env.NODE_ENV === "development";

function todayCacheKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function cacheKeyForDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function devCacheDir(verticalId: string): string {
  const dir = join(process.cwd(), ".next", "cache", "news", verticalId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function devCachePath(verticalId: string): string {
  return join(devCacheDir(verticalId), `${todayCacheKey()}.json`);
}

function getDevCache(verticalId: string): NewsItem[] | null {
  const path = devCachePath(verticalId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

function setDevCache(verticalId: string, items: NewsItem[]): void {
  writeFileSync(devCachePath(verticalId), JSON.stringify(items));
}

export async function getCachedNews(
  verticalId: string,
): Promise<NewsItem[] | null> {
  const dateKey = todayCacheKey();

  const fromGraph = await getItemsByDate(dateKey, verticalId);
  if (fromGraph.length > 0) return fromGraph;

  if (isDev) return getDevCache(verticalId);
  return null;
}

export async function setCachedNews(
  items: NewsItem[],
  verticalId: string,
): Promise<void> {
  if (isDev) setDevCache(verticalId, items);
}

export async function clearCache(verticalId: string): Promise<void> {
  if (isDev) {
    const path = devCachePath(verticalId);
    if (existsSync(path)) rmSync(path);
  }
}

function pastDates(days: number): Date[] {
  const dates: Date[] = [];
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates;
}

function getDevHeadlines(verticalId: string, days: number): string[] {
  const dir = devCacheDir(verticalId);
  return pastDates(days).flatMap((date) => {
    const path = join(dir, `${cacheKeyForDate(date)}.json`);
    if (!existsSync(path)) return [];
    const items: NewsItem[] = JSON.parse(readFileSync(path, "utf-8"));
    return items.map((item) => item.headline);
  });
}

export async function getRecentHeadlines(
  verticalId: string,
  days = 7,
): Promise<string[]> {
  const fromGraph = await getRecentHeadlinesFromGraph(days, verticalId);
  if (fromGraph.length > 0) return fromGraph;

  if (isDev) return getDevHeadlines(verticalId, days);
  return [];
}
