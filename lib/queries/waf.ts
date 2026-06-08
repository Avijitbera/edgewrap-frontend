import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WafConfig {
  id: string;
  projectId: string;
  sensitivityScore: number;
  owaspSqlEnabled: boolean;
  owaspXssEnabled: boolean;
  owaspRceEnabled: boolean;
  owaspLfiEnabled: boolean;
  owaspScannerEnabled: boolean;
  aiAnomalyEnabled: boolean;
  aiAnomalyThreshold: number;
  promptInjectionEnabled: boolean;
  promptInjectionThreshold: number;
  blockedIps: string; // JSON string
  allowedIps: string; // JSON string
  blockedCountries: string; // JSON string
  blockedUserAgents: string; // JSON string
  updatedAt: string;
}

export interface WafStats {
  period: { from: string; to: string; days: number };
  total: number;
  threatBreakdown: Array<{ threatType: string; total: number }>;
  actionBreakdown: Array<{ action: string; total: number }>;
  dailyTrend: Array<{ day: string; total: number }>;
}

export interface WafEvent {
  id: string;
  projectId: string;
  requestId: string;
  method: string;
  path: string;
  ip: string;
  country: string | null;
  userAgent: string | null;
  threatType: string;
  aiConfidence: number | null;
  payload: string | null;
  action: string;
  createdAt: string;
  clientIp: string;
  requestMethod: string;
  requestUrl: string;
  score: number;
}

export interface WafSandboxResult {
  success: boolean;
  decision: {
    action: string;
    threatType: string | null;
    ruleId: string | null;
    score: number;
    reason: string;
    aiConfidence: number | null;
  };
  request: {
    method: string;
    path: string;
    queryString: string;
    ip: string;
    country: string;
    userAgent: string;
  };
}

export interface WafEventsMeta {
  total: number;
  page: number;
  limit: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useWafConfig(projectId: string | null | undefined) {
  return useQuery<WafConfig>({
    queryKey: ["waf-config", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/waf/config`),
    enabled: !!projectId,
  });
}

export function useWafStats(projectId: string | null | undefined, days = 14) {
  return useQuery<WafStats>({
    queryKey: ["waf-stats", projectId, days],
    queryFn: () => apiFetch(`/projects/${projectId}/waf/stats?days=${days}`),
    enabled: !!projectId,
    refetchInterval: 30_000, // refresh every 30s
  });
}

export function useWafEvents(
  projectId: string | null | undefined,
  params?: { threatType?: string; action?: string; page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.threatType) qs.set("threatType", params.threatType);
  if (params?.action) qs.set("action", params.action);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit ?? 20));

  return useQuery<{ data: WafEvent[]; meta: WafEventsMeta }>({
    queryKey: ["waf-events", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<WafEvent[] | { data: WafEvent[]; meta: WafEventsMeta }>(
        `/projects/${projectId}/waf/events?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 20 } };
      return res as { data: WafEvent[]; meta: WafEventsMeta };
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useUpdateWafConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Omit<WafConfig, "id" | "projectId" | "updatedAt" | "blockedIps" | "allowedIps" | "blockedCountries" | "blockedUserAgents"> & {
      blockedIps?: string[];
      allowedIps?: string[];
      blockedCountries?: string[];
      blockedUserAgents?: string[];
    }>) =>
      apiFetch<WafConfig>(`/projects/${projectId}/waf/config`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waf-config", projectId] });
      qc.invalidateQueries({ queryKey: ["waf-stats", projectId] });
    },
  });
}

export function useResetWafConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${projectId}/waf/config`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waf-config", projectId] });
    },
  });
}

export function useWafSandbox(projectId: string | null | undefined) {
  return useMutation({
    mutationFn: (body: {
      path: string;
      method?: string;
      headers?: Record<string, string>;
      queryString?: string;
      body?: string;
      ip?: string;
      country?: string;
      userAgent?: string;
    }) =>
      apiFetch<WafSandboxResult>(`/projects/${projectId}/waf/sandbox-call`, {
        method: "POST",
        body,
      }),
  });
}
