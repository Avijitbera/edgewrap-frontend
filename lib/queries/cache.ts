import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CacheConfig {
  id: string;
  projectId: string;
  defaultTtlSec: number;
  maxTtlSec: number;
  aiTtlOptimizerEnabled: boolean;
  varyByHeaders: string;       // JSON string
  varyByQueryParams: string;   // JSON string
  varyByCookies: string;       // JSON string
  staleWhileRevalidateSec: number;
  staleIfErrorSec: number;
  dbCacheEnabled: boolean;
  dbCacheDefaultTtlSec: number;
  isConfigured: boolean;
  updatedAt: string;
}

export interface CacheRule {
  id: string;
  projectId: string;
  pathPattern: string;
  method: string;
  ttlSec: number;
  bypassCache: boolean;
  priority: number;
  isEnabled: boolean;
  aiSuggestedTtlSec: number | null;
  aiSuggestionReason: string | null;
  aiSuggestionAccepted: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export type CacheStatus = "HIT" | "MISS" | "BYPASS" | "STALE" | "DYNAMIC";

export interface CacheSandboxResult {
  success: boolean;
  cacheKey: string;
  status: CacheStatus;
  ttlSec: number;
  bypass: boolean;
  matchedRule: {
    pathPattern: string;
    method: string;
    ttlSec: number;
    bypassCache: boolean;
    priority: number;
  } | null;
  varyBy: {
    headers: string[];
    queryParams: string[];
    cookies: string[];
  };
  request: {
    method: string;
    path: string;
    queryString: string;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    age?: number;
  } | null;
  latencyMs?: number;
}

export interface CacheStats {
  cacheHits: number;
  cacheMisses: number;
  cacheBypass: number;
  hitRate: number;
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

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCacheConfig(projectId: string | null | undefined) {
  return useQuery<CacheConfig>({
    queryKey: ["cache-config", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/cache/config`),
    enabled: !!projectId,
  });
}

export function useUpdateCacheConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Partial<
        Omit<CacheConfig, "id" | "projectId" | "isConfigured" | "updatedAt" | "varyByHeaders" | "varyByQueryParams" | "varyByCookies"> & {
          varyByHeaders?: string[];
          varyByQueryParams?: string[];
        }
      >
    ) =>
      apiFetch<CacheConfig>(`/projects/${projectId}/cache/config`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cache-config", projectId] });
    },
  });
}

export function useResetCacheConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${projectId}/cache/config`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cache-config", projectId] });
      qc.invalidateQueries({ queryKey: ["cache-rules", projectId] });
    },
  });
}

export function useCacheRules(projectId: string | null | undefined) {
  return useQuery<CacheRule[]>({
    queryKey: ["cache-rules", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/cache/rules`),
    enabled: !!projectId,
  });
}

export function useCreateCacheRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      pathPattern: string;
      method: string;
      ttlSec: number;
      bypassCache: boolean;
      priority: number;
    }) =>
      apiFetch<CacheRule>(`/projects/${projectId}/cache/rules`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cache-rules", projectId] });
    },
  });
}

export function useDeleteCacheRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiFetch<{ success: boolean }>(`/projects/${projectId}/cache/rules/${ruleId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cache-rules", projectId] });
    },
  });
}

export function useCacheStats(projectId: string | null | undefined) {
  return useQuery<CacheStats>({
    queryKey: ["cache-stats", projectId],
    queryFn: async () => {
      const res = await apiFetch<{
        requests?: { total: number };
        cache?: { hits: number; misses: number };
        sandboxCalls?: number;
        dailyTrend?: Array<{
          day: string;
          label: string;
          hits: number;
          misses: number;
          bypasses: number;
          totalRequests: number;
          sandboxCalls: number;
        }>;
      }>(`/projects/${projectId}/analytics/summary`);
      const hits = res.cache?.hits ?? 0;
      const misses = res.cache?.misses ?? 0;
      const totalRequests = res.requests?.total ?? 0;
      const bypass = Math.max(0, totalRequests - hits - misses);
      const totalCached = hits + misses;
      return {
        cacheHits: hits,
        cacheMisses: misses,
        cacheBypass: bypass,
        hitRate: totalCached > 0 ? (hits / totalCached) * 100 : 0,
        sandboxCalls: res.sandboxCalls ?? 0,
        dailyTrend: res.dailyTrend ?? [],
      };
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useCacheSandbox(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      method: string;
      path: string;
      queryString?: string;
      headers?: Record<string, string>;
    }) =>
      apiFetch<CacheSandboxResult>(`/projects/${projectId}/cache/sandbox-call`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cache-stats", projectId] });
    },
  });
}
