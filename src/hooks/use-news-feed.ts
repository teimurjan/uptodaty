"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsItem } from "@/lib/types";
import type { VerticalId } from "@/lib/verticals";

const POLL_INTERVAL = 5000;
const MAX_POLLS = 60;

interface NewsFeedState {
  news: NewsItem[];
  loading: boolean;
  progress: number;
  error: string | null;
}

export function useNewsFeed(verticalId: VerticalId) {
  const [state, setState] = useState<NewsFeedState>({
    news: [],
    loading: true,
    progress: 0,
    error: null,
  });

  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = undefined;
    }
    pollCountRef.current = 0;
  }, []);

  const fetchNews = useCallback(
    async (isPoll = false) => {
      if (!isPoll) {
        setState({ news: [], loading: true, progress: 0, error: null });
        pollCountRef.current = 0;
      }

      try {
        const response = await fetch(`/api/news?vertical=${verticalId}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? `API returned ${response.status}`);
        }

        const data = (await response.json()) as {
          items: NewsItem[] | null;
          pending?: boolean;
        };

        if (data.pending) {
          pollCountRef.current++;
          if (pollCountRef.current >= MAX_POLLS) {
            throw new Error("Timed out waiting for news generation");
          }

          setState((prev) => ({
            ...prev,
            progress: Math.min(10 + pollCountRef.current * 1.5, 90),
          }));

          pollTimerRef.current = setTimeout(
            () => fetchNews(true),
            POLL_INTERVAL,
          );
          return;
        }

        const items = data.items ?? [];
        setState((prev) => ({ ...prev, progress: 100 }));
        setTimeout(() => {
          setState({ news: items, loading: false, progress: 100, error: null });
        }, 300);
      } catch (err) {
        stopPolling();
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    },
    [verticalId, stopPolling],
  );

  const refresh = useCallback(() => {
    stopPolling();
    fetchNews();
  }, [fetchNews, stopPolling]);

  useEffect(() => {
    refresh();
    return stopPolling;
  }, [refresh, stopPolling]);

  return { ...state, refresh };
}
