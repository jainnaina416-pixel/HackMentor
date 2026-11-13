import { useState, useEffect } from "react";
import type { ResourceItem } from "../types";

export function useResources(query: string, category: string) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Reset when query or category changes
  useEffect(() => {
    setResources([]);
    setPage(1);
  }, [query, category]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    async function fetchResources() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q: query,
          category,
          page: String(page),
          page_size: "20",
        });
        const resp = await fetch(`/api/resources/search?${params}`, { signal: controller.signal });
        if (!resp.ok) throw new Error(`Server responded ${resp.status}`);
        const data = await resp.json();
        setResources(prev => [...prev, ...data.results]);
        setHasMore(data.results.length === 20);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
    return () => controller.abort();
  }, [query, category, page]);

  const loadMore = () => setPage(p => p + 1);

  return { resources, loading, error, loadMore, hasMore };
}
