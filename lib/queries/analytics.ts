import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DateRange = "1d" | "7d" | "14d" | "30d";

export interface AnalyticsSummary {
  period: { from: string; to: string };
  requests: {
    total: number;
    errors: number;
    avgDuration: number;
    p95Duration: number;
    totalBandwidth: number;
  };
  cache: {
    hits: number;
    misses: number;
  };
  wafBlocked: number;
  botsDetected: number;
  sandboxCalls: number;
  dailyTrend: Array<{
    day: string;
    label: string;
    hits: number;
    misses: number;
    bypasses: number;
    totalRequests: number;
    sandboxCalls: number;
  }>;
}

export interface TopPath {
  path: string;
  total: number;
  avgDurationMs: number;
  errors: number;
  cacheHits: number;
  cacheHitRate: string;
}

export interface StatusCodeBreakdown {
  statusCodes: Array<{ code: number | null; total: number }>;
  buckets: { "2xx": number; "3xx": number; "4xx": number; "5xx": number; other: number };
  methods: Array<{ method: string; total: number }>;
}

export interface LatencyTrendPoint {
  day: string;
  label: string;
  avgDurationMs: number;
  p95DurationMs: number;
  avgOriginDurationMs: number;
  totalRequests: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDateRange(range: DateRange): { from: string; to: string } {
  const days = range === "1d" ? 1 : range === "7d" ? 7 : range === "14d" ? 14 : 30;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();
  return { from, to };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAnalyticsSummary(
  projectId: string | null | undefined,
  range: DateRange = "7d"
) {
  const { from, to } = buildDateRange(range);
  return useQuery<AnalyticsSummary>({
    queryKey: ["analytics-summary", projectId, range],
    queryFn: () =>
      apiFetch<AnalyticsSummary>(
        `/projects/${projectId}/analytics/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      ),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useAnalyticsTopPaths(
  projectId: string | null | undefined,
  range: DateRange = "7d",
  limit = 10
) {
  const { from, to } = buildDateRange(range);
  return useQuery<TopPath[]>({
    queryKey: ["analytics-top-paths", projectId, range, limit],
    queryFn: () =>
      apiFetch<TopPath[]>(
        `/projects/${projectId}/analytics/top-paths?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}`
      ),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useAnalyticsStatusCodes(
  projectId: string | null | undefined,
  range: DateRange = "7d"
) {
  const { from, to } = buildDateRange(range);
  return useQuery<StatusCodeBreakdown>({
    queryKey: ["analytics-status-codes", projectId, range],
    queryFn: () =>
      apiFetch<StatusCodeBreakdown>(
        `/projects/${projectId}/analytics/status-codes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      ),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useAnalyticsLatencyTrend(
  projectId: string | null | undefined,
  range: DateRange = "7d"
) {
  const { from, to } = buildDateRange(range);
  return useQuery<LatencyTrendPoint[]>({
    queryKey: ["analytics-latency-trend", projectId, range],
    queryFn: () =>
      apiFetch<LatencyTrendPoint[]>(
        `/projects/${projectId}/analytics/latency-trend?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      ),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}
