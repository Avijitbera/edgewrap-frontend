import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── DDoS Types ───────────────────────────────────────────────────────────────

export interface DdosConfig {
  id: string;
  projectId: string;
  requestsPerSecondThreshold: number;
  uniqueIpsPerMinuteThreshold: number;
  adaptiveEnabled: boolean;
  challengeMode: "js_challenge" | "managed_challenge" | "block" | "captcha";
  challengeDurationSec: number;
  allowlistedIps: string;      // JSON string
  allowlistedCountries: string; // JSON string
  isConfigured: boolean;
  updatedAt: string;
}

export interface DdosStats {
  period: { from: string; to: string; days: number };
  total: number;
  actionBreakdown: Array<{ action: string; total: number }>;
  peakRps: number;
  totalRequests: number;
  uniqueIps: number;
  dailyTrend: Array<{ day: string; total: number }>;
}

export interface DdosEvent {
  id: string;
  projectId: string;
  startedAt: string | number;
  endedAt: string | number | null;
  peakRps: number | null;
  totalRequests: number | null;
  uniqueIps: number | null;
  topCountries: string | null;
  topPaths: string | null;
  action: string;
  aiConfidence: number | null;
  createdAt: string | number;
}

// ─── Bot Types ─────────────────────────────────────────────────────────────────

export interface BotStats {
  period: { from: string; to: string; days: number };
  total: number;
  fraudCount: number;
  botTypeBreakdown: Array<{ botType: string; total: number }>;
  actionBreakdown: Array<{ action: string; total: number }>;
  dailyTrend: Array<{ day: string; total: number }>;
}

export interface BotEvent {
  id: string;
  projectId: string;
  ip: string;
  userAgent: string | null;
  country: string | null;
  botScore: number;
  botType: string;
  action: string;
  isFraud: boolean;
  fraudType: string | null;
  createdAt: string | number;
}

// ─── DDoS Hooks ───────────────────────────────────────────────────────────────

export function useDdosConfig(projectId: string | null | undefined) {
  return useQuery<DdosConfig>({
    queryKey: ["ddos-config", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/ddos/config`),
    enabled: !!projectId,
  });
}

export function useDdosStats(projectId: string | null | undefined, days = 14) {
  return useQuery<DdosStats>({
    queryKey: ["ddos-stats", projectId, days],
    queryFn: () => apiFetch(`/projects/${projectId}/ddos/stats?days=${days}`),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useDdosEvents(
  projectId: string | null | undefined,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 10));

  return useQuery<{ data: DdosEvent[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["ddos-events", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<DdosEvent[] | { data: DdosEvent[]; meta: any }>(
        `/projects/${projectId}/ddos/events?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 10 } };
      return res as { data: DdosEvent[]; meta: any };
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useUpdateDdosConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Omit<DdosConfig, "id" | "projectId" | "updatedAt" | "isConfigured"> & {
      allowlistedIps?: string[];
      allowlistedCountries?: string[];
    }>) =>
      apiFetch<DdosConfig>(`/projects/${projectId}/ddos/config`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ddos-config", projectId] });
      qc.invalidateQueries({ queryKey: ["ddos-stats", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update DDoS configuration");
    },
  });
}

export function useResetDdosConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}/ddos/config`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ddos-config", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ─── Bot Hooks ────────────────────────────────────────────────────────────────

export function useBotStats(projectId: string | null | undefined, days = 14) {
  return useQuery<BotStats>({
    queryKey: ["bot-stats", projectId, days],
    queryFn: () => apiFetch(`/projects/${projectId}/bot-events/stats?days=${days}`),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useBotEvents(
  projectId: string | null | undefined,
  params?: { botType?: string; isFraud?: boolean; page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.botType) qs.set("botType", params.botType);
  if (params?.isFraud !== undefined) qs.set("isFraud", String(params.isFraud));
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 10));

  return useQuery<{ data: BotEvent[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["bot-events", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<BotEvent[] | { data: BotEvent[]; meta: any }>(
        `/projects/${projectId}/bot-events?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 10 } };
      return res as { data: BotEvent[]; meta: any };
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

// ─── Secret Shield Types ───────────────────────────────────────────────────────

export interface SecretShieldEvent {
  id: string;
  projectId: string;
  requestLogId: string | null;
  secretType:
    | "api_key"
    | "bearer_token"
    | "jwt"
    | "aws_key"
    | "stripe_key"
    | "github_token"
    | "private_key"
    | "password"
    | "credit_card"
    | "ssn"
    | "custom_pattern";
  location: "header" | "query_param" | "body" | "path" | "response";
  maskedValue: string;
  action: "masked" | "blocked" | "logged";
  createdAt: string | number;
}

export interface SecretShieldStats {
  period: { from: string; to: string; days: number };
  total: number;
  secretTypeBreakdown: Array<{ secretType: string; total: number }>;
  actionBreakdown: Array<{ action: string; total: number }>;
  locationBreakdown: Array<{ location: string; total: number }>;
  dailyTrend: Array<{ day: string; total: number }>;
}

// ─── Secret Shield Hooks ────────────────────────────────────────────────────────

export function useSecretShieldStats(projectId: string | null | undefined, days = 14) {
  return useQuery<SecretShieldStats>({
    queryKey: ["secret-shield-stats", projectId, days],
    queryFn: () => apiFetch(`/projects/${projectId}/secret-shield/stats?days=${days}`),
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export function useSecretShieldEvents(
  projectId: string | null | undefined,
  params?: { secretType?: string; action?: string; page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.secretType) qs.set("secretType", params.secretType);
  if (params?.action) qs.set("action", params.action);
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 10));

  return useQuery<{ data: SecretShieldEvent[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["secret-shield-events", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<SecretShieldEvent[] | { data: SecretShieldEvent[]; meta: any }>(
        `/projects/${projectId}/secret-shield/events?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 10 } };
      return res as { data: SecretShieldEvent[]; meta: any };
    },
    enabled: !!projectId,
    refetchInterval: 30_000,
  });
}

export interface CustomSecretPattern {
  regex: string;
  action: "masked" | "blocked" | "logged";
  severity: "block" | "mask" | "log";
}

export function useCustomSecretPatterns(projectId: string | null | undefined) {
  return useQuery<CustomSecretPattern[]>({
    queryKey: ["secret-shield-custom-patterns", projectId],
    queryFn: () => apiFetch<CustomSecretPattern[]>(`/projects/${projectId}/secret-shield/patterns`),
    enabled: !!projectId,
  });
}

export function useUpdateCustomSecretPatterns(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomSecretPattern[]) =>
      apiFetch<CustomSecretPattern[]>(`/projects/${projectId}/secret-shield/patterns`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secret-shield-custom-patterns", projectId] });
    },
  });
}
