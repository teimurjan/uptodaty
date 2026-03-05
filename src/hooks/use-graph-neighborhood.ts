"use client";

import useSWR, { preload } from "swr";
import type { NewsItem } from "@/lib/types";

function neighborhoodUrl(itemId: string): string {
  return `/api/news/graph?mode=neighborhood&id=${encodeURIComponent(itemId)}&depth=2`;
}

async function fetcher(url: string): Promise<NewsItem[]> {
  const res = await fetch(url);
  const data = await res.json();
  return data.items ?? [];
}

export function useGraphNeighborhood(itemId: string) {
  const { data, isLoading } = useSWR(neighborhoodUrl(itemId), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60_000,
  });

  return {
    items: data ?? [],
    loading: isLoading,
  };
}

export function prefetchNeighborhood(itemId: string) {
  preload(neighborhoodUrl(itemId), fetcher);
}
