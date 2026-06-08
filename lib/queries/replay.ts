import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RequestLog {
  id: string;
  projectId: string;
  apiKeyId: string | null;
  method: string;
  path: string;
  requestHeaders: string | null;      // JSON string
  requestBodyRef: string | null;      // R2 key
  requestBodySize: number | null;
  ip: string | null;
  country: string | null;
  cfRay: string | null;
  cfColo: string | null;
  statusCode: number | null;
  responseBodyRef: string | null;     // R2 key
  responseBodySize: number | null;
  cacheStatus: "HIT" | "MISS" | "BYPASS" | "STALE" | "REVALIDATED" | "DYNAMIC" | null;
  durationMs: number | null;
  ttfbMs: number | null;
  originDurationMs: number | null;
  originId: string | null;
  originUrl: string | null;
  queryString: string | null;
  wafAction: "allowed" | "blocked" | "challenged" | null;
  botScore: number | null;
  isFraud: boolean | null;
  isReplayable: boolean;
  replayCount: number;
  lastReplayedAt: string | null;
  aiHealerTriggered?: boolean | null;
  aiHealerAction?: string | null;
  createdAt: string;

  // Populated for single log details
  clientIp?: string | null;
  requestUrl?: string | null;
  userAgent?: string | null;
  requestBody?: string | null;
  responseBody?: string | null;
}

export interface ReplayJob {
  id: string;
  projectId: string;
  requestLogId: string;
  triggeredBy: string;
  overrideHeaders: string | null;    // JSON string
  overrideBody: string | null;
  targetOriginId: string | null;
  status: "pending" | "running" | "completed" | "failed";
  resultLogId: string | null;
  diffSummary: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useRequestLogs(
  projectId: string | null | undefined,
  params?: { method?: string; statusCode?: number; cacheStatus?: string; page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.method && params.method !== "all") qs.set("method", params.method);
  if (params?.statusCode && !isNaN(params.statusCode)) qs.set("status", String(params.statusCode));
  if (params?.cacheStatus && params.cacheStatus !== "all") qs.set("cacheStatus", params.cacheStatus);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit ?? 20));

  return useQuery<{ data: RequestLog[]; meta: PaginationMeta }>({
    queryKey: ["request-logs", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<RequestLog[] | { data: RequestLog[]; meta: PaginationMeta }>(
        `/projects/${projectId}/logs?${qs.toString()}`
      );
      if (Array.isArray(res)) {
        return {
          data: res,
          meta: { total: res.length, page: 1, limit: params?.limit ?? 20, totalPages: 1, hasNext: false, hasPrev: false },
        };
      }
      return res as { data: RequestLog[]; meta: PaginationMeta };
    },
    enabled: !!projectId,
    refetchInterval: 15_000, // Refresh log list every 15s
  });
}

export function useRequestLogDetails(
  projectId: string | null | undefined,
  logId: string | null | undefined
) {
  return useQuery<RequestLog>({
    queryKey: ["request-log-details", projectId, logId],
    queryFn: () => apiFetch<RequestLog>(`/projects/${projectId}/logs/${logId}`),
    enabled: !!projectId && !!logId,
  });
}

export function useReplayJobs(
  projectId: string | null | undefined,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit ?? 20));

  return useQuery<{ data: ReplayJob[]; meta: PaginationMeta }>({
    queryKey: ["replay-jobs", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<ReplayJob[] | { data: ReplayJob[]; meta: PaginationMeta }>(
        `/projects/${projectId}/replay-jobs?${qs.toString()}`
      );
      if (Array.isArray(res)) {
        return {
          data: res,
          meta: { total: res.length, page: 1, limit: params?.limit ?? 20, totalPages: 1, hasNext: false, hasPrev: false },
        };
      }
      return res as { data: ReplayJob[]; meta: PaginationMeta };
    },
    enabled: !!projectId,
    refetchInterval: 5_000, // Poll replay job updates every 5s while in view
  });
}

export function useTriggerReplay(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      logId,
      overrideHeaders,
      overrideBody,
      targetOriginId,
    }: {
      logId: string;
      overrideHeaders?: Record<string, string>;
      overrideBody?: string;
      targetOriginId?: string;
    }) =>
      apiFetch<{ jobId: string; status: string; message: string }>(
        `/projects/${projectId}/logs/${logId}/replay`,
        {
          method: "POST",
          body: {
            overrideHeaders,
            overrideBody,
            targetOriginId: targetOriginId || undefined,
          },
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["replay-jobs", projectId] });
      qc.invalidateQueries({ queryKey: ["request-logs", projectId] });
    },
  });
}
