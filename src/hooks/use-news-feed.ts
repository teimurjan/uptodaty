"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewsItem } from "@/lib/types";

interface NewsFeedState {
  news: NewsItem[];
  loading: boolean;
  progress: number;
  error: string | null;
}

export function useNewsFeed() {
  const [state, setState] = useState<NewsFeedState>({
    news: [],
    loading: true,
    progress: 0,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState({ news: [], loading: true, progress: 0, error: null });

    const progressInterval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        progress: Math.min(prev.progress + Math.random() * 8, 90),
      }));
    }, 400);

    try {
      const response = await fetch("/api/news");
      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? `API returned ${response.status}`);
      }

      const { items } = (await response.json()) as { items: NewsItem[] };

      setState((prev) => ({ ...prev, progress: 100 }));
      setTimeout(() => {
        setState({ news: items, loading: false, progress: 100, error: null });
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
