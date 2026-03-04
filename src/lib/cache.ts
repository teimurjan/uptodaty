import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Redis } from "@upstash/redis";
import {
  getItemsByDate,
  getRecentHeadlinesFromGraph,
  persistNewsItems,
} from "./graph";
import type { NewsItem } from "./types";

const CACHE_TTL = 86400;
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
const isDev = process.env.NODE_ENV === "development";

function todayCacheKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function cacheKeyForDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function devCacheDir(): string {
  const dir = join(process.cwd(), ".next", "cache", "news");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function devCachePath(): string {
  return join(devCacheDir(), `${todayCacheKey()}.json`);
}

function getDevCache(): NewsItem[] | null {
  const path = devCachePath();
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

function setDevCache(items: NewsItem[]): void {
  writeFileSync(devCachePath(), JSON.stringify(items));
}

export async function getCachedNews(): Promise<NewsItem[] | null> {
  if (redis) {
    try {
      const cached = await redis.get<NewsItem[]>(`news:${todayCacheKey()}`);
      if (cached) return cached;
    } catch {
      // fall through
    }
  }

  const fromGraph = await getItemsByDate(todayCacheKey());
  if (fromGraph.length > 0) {
    if (redis) {
      redis
        .set(`news:${todayCacheKey()}`, fromGraph, { ex: CACHE_TTL })
        .catch(() => {});
    }
    return fromGraph;
  }

  if (isDev) return getDevCache();
  return null;
}

export async function setCachedNews(items: NewsItem[]): Promise<void> {
  const writes: Promise<void>[] = [persistNewsItems(items)];

  if (redis) {
    writes.push(
      redis
        .set(`news:${todayCacheKey()}`, items, { ex: CACHE_TTL })
        .then(() => {}),
    );
  }

  await Promise.allSettled(writes);

  if (isDev) setDevCache(items);
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

async function getRedisHeadlines(days: number): Promise<string[]> {
  if (!redis) return [];
  const keys = pastDates(days).map((d) => `news:${cacheKeyForDate(d)}`);

  const results = await Promise.all(
    keys.map((key) => redis.get<NewsItem[]>(key).catch(() => null)),
  );

  return results
    .filter((items): items is NewsItem[] => items !== null)
    .flatMap((items) => items.map((item) => item.headline));
}

function getDevHeadlines(days: number): string[] {
  const dir = devCacheDir();
  return pastDates(days).flatMap((date) => {
    const path = join(dir, `${cacheKeyForDate(date)}.json`);
    if (!existsSync(path)) return [];
    const items: NewsItem[] = JSON.parse(readFileSync(path, "utf-8"));
    return items.map((item) => item.headline);
  });
}

export async function getRecentHeadlines(days = 7): Promise<string[]> {
  const fromGraph = await getRecentHeadlinesFromGraph(days);
  if (fromGraph.length > 0) return fromGraph;

  if (redis) return getRedisHeadlines(days);
  if (isDev) return getDevHeadlines(days);
  return [];
}
