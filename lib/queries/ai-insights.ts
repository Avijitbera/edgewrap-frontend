import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type InsightType =
  | "traffic_summary"
  | "anomaly_detected"
  | "cache_optimization"
  | "routing_recommendation"
  | "security_alert"
  | "cost_optimization"
  | "error_pattern"
  | "bot_pattern"
  | "geo_insight"
  | "email_deliverability";

export type InsightSeverity = "info" | "warning" | "critical";

export interface AiInsight {
  id: string;
  projectId: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  summary: string;
  recommendation: string | null;
  data: string | null; // JSON string for chart drilldowns
  acknowledgedAt: string | number | null;
  acknowledgedBy: string | null;
  createdAt: string | number;
  periodStart?: string | number | null;
  periodEnd?: string | number | null;
}

export interface AiInsightsMeta {
  total: number;
  page: number;
  limit: number;
}

export interface AiInsightsResponse {
  data: AiInsight[];
  meta: AiInsightsMeta;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAiInsights(
  projectId: string | null | undefined,
  params?: {
    type?: InsightType;
    severity?: InsightSeverity;
    page?: number;
    limit?: number;
  }
) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.severity) qs.set("severity", params.severity);
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 20));

  return useQuery<AiInsightsResponse>({
    queryKey: ["ai-insights", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<AiInsight[] | AiInsightsResponse>(
        `/projects/${projectId}/insights?${qs.toString()}`
      );
      if (Array.isArray(res)) {
        return { data: res, meta: { total: res.length, page: 1, limit: 20 } };
      }
      return res as AiInsightsResponse;
    },
    enabled: !!projectId,
    refetchInterval: 60_000,
  });
}

export function useAcknowledgeInsight(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (insightId: string) =>
      apiFetch<{ message: string }>(
        `/projects/${projectId}/insights/${insightId}/acknowledge`,
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-insights", projectId] });
    },
  });
}

export function useGenerateInsights(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(
        `/projects/${projectId}/insights/generate`,
        { method: "POST" }
      ),
    onSuccess: () => {
      // Give the queue a moment, then refetch
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["ai-insights", projectId] });
      }, 3000);
    },
  });
}
