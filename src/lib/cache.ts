import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Redis } from "@upstash/redis";
import type { NewsItem } from "./types";

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
const isDev = process.env.NODE_ENV === "development";

function todayCacheKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function devCachePath(): string {
  const dir = join(process.cwd(), ".next", "cache", "news");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, `${todayCacheKey()}.json`);
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
      return await redis.get<NewsItem[]>(`news:${todayCacheKey()}`);
    } catch {
      return null;
    }
  }

  if (isDev) return getDevCache();
  return null;
}

export async function setCachedNews(items: NewsItem[]): Promise<void> {
  if (redis) {
    try {
      await redis.set(`news:${todayCacheKey()}`, items, { ex: 86400 });
    } catch {
      // best-effort
    }
    return;
  }

  if (isDev) setDevCache(items);
}
