import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CircuitBreakerState = "closed" | "open" | "half_open";

export interface CircuitBreakerStatus {
  id: string;
  projectId: string;
  originId: string | null;
  state: CircuitBreakerState;
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  failureCount: number;
  successCount: number;
  requestCount: number;
  openedAt: string | null;
  aiDiagnosis: string | null;
  updatedAt: string;
}

export interface CircuitBreakerEvent {
  id: string;
  projectId: string;
  originId: string | null;
  fromState: CircuitBreakerState;
  toState: CircuitBreakerState;
  reason: string | null;
  aiTriggered: boolean;
  createdAt: string;
}

export interface CircuitBreakerEventsMeta {
  total: number;
  page: number;
  limit: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCircuitBreakerState(projectId: string | null | undefined) {
  return useQuery<CircuitBreakerStatus | null>({
    queryKey: ["circuit-breaker", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/circuit-breaker`),
    enabled: !!projectId,
    refetchInterval: 15_000,
  });
}

export function useResetCircuitBreaker(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${projectId}/circuit-breaker/reset`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["circuit-breaker", projectId] });
      qc.invalidateQueries({ queryKey: ["circuit-breaker-events", projectId] });
    },
  });
}

export function useCircuitBreakerEvents(
  projectId: string | null | undefined,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit ?? 20));

  return useQuery<{ data: CircuitBreakerEvent[]; meta: CircuitBreakerEventsMeta }>({
    queryKey: ["circuit-breaker-events", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<CircuitBreakerEvent[] | { data: CircuitBreakerEvent[]; meta: CircuitBreakerEventsMeta }>(
        `/projects/${projectId}/circuit-breaker/events?${qs.toString()}`
      );
      if (Array.isArray(res)) {
        return { data: res, meta: { total: res.length, page: 1, limit: 20 } };
      }
      return res as { data: CircuitBreakerEvent[]; meta: CircuitBreakerEventsMeta };
    },
    enabled: !!projectId,
    refetchInterval: 15_000,
  });
}
