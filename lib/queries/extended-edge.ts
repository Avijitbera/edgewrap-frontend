import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── 1. GEO-FENCED DATA RESIDENCY & GDPR MASKING TYPES ────────────────────────

export interface GeoResidencyRule {
  id: string;
  projectId: string;
  countryCodes: string; // JSON string of string[]
  targetOriginId: string;
  isEnabled: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface GeoResidencyRulePayload {
  countryCodes: string[];
  targetOriginId: string;
  isEnabled?: boolean;
}

export interface DataPrivacyMask {
  id: string;
  projectId: string;
  pathPattern: string;
  jsonFieldName: string;
  maskType: "sha256_hash" | "redact_all" | "partial_reveal_ends" | "strip_field";
  isEnabled: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface DataPrivacyMaskPayload {
  pathPattern: string;
  jsonFieldName: string;
  maskType: DataPrivacyMask["maskType"];
  isEnabled?: boolean;
}

// ─── 2. SHADOW TRAFFIC ROUTING TYPES ─────────────────────────────────────────

export interface ShadowRoutingConfig {
  id: string;
  projectId: string;
  shadowOriginUrl: string;
  trafficPercent: number;
  excludePathPatterns: string | null; // JSON string of string[]
  maxConcurrentShadowRequests: number | null;
  isEnabled: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface ShadowRoutingConfigPayload {
  shadowOriginUrl: string;
  trafficPercent: number;
  excludePathPatterns?: string[];
  maxConcurrentShadowRequests?: number;
  isEnabled?: boolean;
}

export interface ShadowMismatch {
  id: string;
  projectId: string;
  path: string;
  mismatchType: "status_code" | "body_diff" | "headers_diff";
  primaryStatus: number;
  shadowStatus: number;
  diffPayload: string | null; // JSON string of differences
  createdAt: string | number;
}

// ─── 3. DYNAMIC IP THREAT FEEDS TYPES ────────────────────────────────────────

export interface ThreatFeed {
  id: string;
  projectId: string;
  feedName: string;
  feedType: "tor" | "proxy" | "vpn" | "botnet" | "custom";
  customFeedUrl: string | null;
  action: "block" | "challenge" | "log";
  updateIntervalMinutes: number;
  isEnabled: boolean;
  createdAt: string | number;
  updatedAt: string | number;
  lastUpdatedAt?: string | number | null;
}

export interface ThreatFeedPayload {
  feedName: string;
  feedType: ThreatFeed["feedType"];
  customFeedUrl?: string;
  action: ThreatFeed["action"];
  updateIntervalMinutes?: number;
  isEnabled?: boolean;
}

export interface ThreatIpRange {
  id: string;
  feedId: string;
  cidr: string;
  createdAt: string | number;
}

// ─── 4. REAL-TIME ALERTING ENGINE TYPES ──────────────────────────────────────

export interface AlertPolicy {
  id: string;
  projectId: string;
  name: string;
  triggerType: "waf_breach" | "ddos_attack" | "origin_down" | "latency_spike" | "billing_limit";
  threshold: number | null;
  isEnabled: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface AlertPolicyPayload {
  name: string;
  triggerType: AlertPolicy["triggerType"];
  threshold?: number;
  isEnabled?: boolean;
}

export interface AlertChannel {
  id: string;
  projectId: string;
  type: "slack" | "discord" | "pagerduty" | "email" | "webhook";
  config: string; // Dynamic configuration details
  isEnabled: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface AlertChannelPayload {
  type: AlertChannel["type"];
  config: string;
  isEnabled?: boolean;
}

export interface AlertDispatch {
  id: string;
  projectId: string;
  policyId: string;
  channelId: string;
  dispatchStatus: "success" | "failed";
  errorMessage: string | null;
  payloadSent: string | null;
  dispatchedAt: string | number;
}

// ─── 5. ADVANCED LOAD BALANCING TYPES ────────────────────────────────────────

export interface LoadBalancerPool {
  id: string;
  projectId: string;
  name: string;
  algorithm: "round_robin" | "weighted_round_robin" | "least_connections" | "ip_hash";
  sessionAffinityEnabled: boolean;
  stickyCookieName: string | null;
  stickyCookieTtlSec: number | null;
  origins?: Array<{ originId: string; weight: number }>;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface LoadBalancerPoolPayload {
  name: string;
  algorithm: LoadBalancerPool["algorithm"];
  sessionAffinityEnabled?: boolean;
  stickyCookieName?: string;
  stickyCookieTtlSec?: number;
  origins?: Array<{ originId: string; weight: number }>;
}

// ─── 6. STATEFUL THREAT SCORING TYPES ────────────────────────────────────────

export interface ThreatScoreRule {
  id: string;
  projectId: string;
  triggerEvent: string;
  pointsIncrement: number;
  decayHalfLifeHours: number;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface ThreatScoreRulePayload {
  triggerEvent: string;
  pointsIncrement: number;
  decayHalfLifeHours: number;
}

export interface ClientThreatLedgerEntry {
  id: string;
  projectId: string;
  clientIp: string;
  currentScore: number;
  blocklistStatus: "clear" | "challenged" | "blocked";
  blockedUntil: string | number | null;
  lastActiveAt: string | number;
}

// ─── 7. TIME-TRAVEL SANDBOX RECORDER TYPES ───────────────────────────────────

export interface SandboxSession {
  id: string;
  projectId: string;
  name: string;
  recordedPathPattern: string;
  status: "recording" | "serving" | "inactive";
  createdAt: string | number;
  updatedAt: string | number;
}

export interface SandboxSessionPayload {
  name: string;
  recordedPathPattern: string;
  status: SandboxSession["status"];
}

export interface SandboxMockTemplate {
  id: string;
  sessionId: string;
  method: string;
  path: string;
  queryString: string | null;
  requestHeaders: string | null; // JSON string
  responseStatusCode: number;
  responseHeaders: string | null; // JSON string
  responseBodyTemplate: string;
  createdAt: string | number;
}

export interface SandboxMockTemplatePayload {
  method: string;
  path: string;
  queryString?: string;
  requestHeaders?: Record<string, string>;
  responseStatusCode?: number;
  responseHeaders?: Record<string, string>;
  responseBodyTemplate: string;
}


// ============================================================================
// ─── HOOKS ───
// ============================================================================

// ─── 1. GEO-FENCED DATA RESIDENCY & GDPR MASKING HOOKS ───────────────────────

export function useGeoResidencyRules(projectId: string | null | undefined) {
  return useQuery<GeoResidencyRule[]>({
    queryKey: ["geo-rules", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/geo-residency/rules`),
    enabled: !!projectId,
  });
}

export function useCreateGeoResidencyRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GeoResidencyRulePayload) =>
      apiFetch<GeoResidencyRule>(`/projects/${projectId}/geo-residency/rules`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geo-rules", projectId] }),
  });
}

export function useUpdateGeoResidencyRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<GeoResidencyRulePayload> & { id: string }) =>
      apiFetch<GeoResidencyRule>(`/projects/${projectId}/geo-residency/rules/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geo-rules", projectId] }),
  });
}

export function useDeleteGeoResidencyRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiFetch(`/projects/${projectId}/geo-residency/rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geo-rules", projectId] }),
  });
}

export function useDataPrivacyMasks(projectId: string | null | undefined) {
  return useQuery<DataPrivacyMask[]>({
    queryKey: ["privacy-masks", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/geo-residency/masks`),
    enabled: !!projectId,
  });
}

export function useCreateDataPrivacyMask(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DataPrivacyMaskPayload) =>
      apiFetch<DataPrivacyMask>(`/projects/${projectId}/geo-residency/masks`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["privacy-masks", projectId] }),
  });
}

export function useUpdateDataPrivacyMask(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<DataPrivacyMaskPayload> & { id: string }) =>
      apiFetch<DataPrivacyMask>(`/projects/${projectId}/geo-residency/masks/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["privacy-masks", projectId] }),
  });
}

export function useDeleteDataPrivacyMask(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maskId: string) =>
      apiFetch(`/projects/${projectId}/geo-residency/masks/${maskId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["privacy-masks", projectId] }),
  });
}

// ─── 2. SHADOW TRAFFIC ROUTING HOOKS ─────────────────────────────────────────

export function useShadowRoutingConfig(projectId: string | null | undefined) {
  return useQuery<ShadowRoutingConfig>({
    queryKey: ["shadow-config", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/shadow-traffic/config`),
    enabled: !!projectId,
  });
}

export function useUpdateShadowRoutingConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ShadowRoutingConfigPayload>) =>
      apiFetch<ShadowRoutingConfig>(`/projects/${projectId}/shadow-traffic/config`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shadow-config", projectId] }),
  });
}

export function useShadowMismatches(
  projectId: string | null | undefined,
  params?: { type?: string; page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 10));

  return useQuery<{ data: ShadowMismatch[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["shadow-mismatches", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<ShadowMismatch[] | { data: ShadowMismatch[]; meta: any }>(
        `/projects/${projectId}/shadow-traffic/mismatches?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 10 } };
      return res as { data: ShadowMismatch[]; meta: any };
    },
    enabled: !!projectId,
  });
}

// ─── 3. DYNAMIC IP THREAT FEEDS HOOKS ────────────────────────────────────────

export function useThreatFeeds(projectId: string | null | undefined) {
  return useQuery<ThreatFeed[]>({
    queryKey: ["threat-feeds", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/threat-feeds`),
    enabled: !!projectId,
  });
}

export function useCreateThreatFeed(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ThreatFeedPayload) =>
      apiFetch<ThreatFeed>(`/projects/${projectId}/threat-feeds`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threat-feeds", projectId] }),
  });
}

export function useUpdateThreatFeed(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ThreatFeedPayload> & { id: string }) =>
      apiFetch<ThreatFeed>(`/projects/${projectId}/threat-feeds/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threat-feeds", projectId] }),
  });
}

export function useDeleteThreatFeed(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (feedId: string) =>
      apiFetch(`/projects/${projectId}/threat-feeds/${feedId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threat-feeds", projectId] }),
  });
}

export function useThreatIpRanges(
  projectId: string | null | undefined,
  feedId: string | null | undefined,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 10));

  return useQuery<{ data: ThreatIpRange[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["threat-ranges", feedId, params],
    queryFn: async () => {
      const res = await apiFetch<ThreatIpRange[] | { data: ThreatIpRange[]; meta: any }>(
        `/projects/${projectId}/threat-feeds/${feedId}/ranges?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 10 } };
      return res as { data: ThreatIpRange[]; meta: any };
    },
    enabled: !!projectId && !!feedId,
  });
}

// ─── 4. REAL-TIME ALERTING ENGINE HOOKS ──────────────────────────────────────

export function useAlertPolicies(projectId: string | null | undefined) {
  return useQuery<AlertPolicy[]>({
    queryKey: ["alert-policies", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/alerts/policies`),
    enabled: !!projectId,
  });
}

export function useCreateAlertPolicy(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AlertPolicyPayload) =>
      apiFetch<AlertPolicy>(`/projects/${projectId}/alerts/policies`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-policies", projectId] }),
  });
}

export function useUpdateAlertPolicy(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<AlertPolicyPayload> & { id: string }) =>
      apiFetch<AlertPolicy>(`/projects/${projectId}/alerts/policies/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-policies", projectId] }),
  });
}

export function useDeleteAlertPolicy(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) =>
      apiFetch(`/projects/${projectId}/alerts/policies/${policyId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-policies", projectId] }),
  });
}

export function useAlertChannels(projectId: string | null | undefined) {
  return useQuery<AlertChannel[]>({
    queryKey: ["alert-channels", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/alerts/channels`),
    enabled: !!projectId,
  });
}

export function useCreateAlertChannel(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AlertChannelPayload) =>
      apiFetch<AlertChannel>(`/projects/${projectId}/alerts/channels`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-channels", projectId] }),
  });
}

export function useUpdateAlertChannel(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<AlertChannelPayload> & { id: string }) =>
      apiFetch<AlertChannel>(`/projects/${projectId}/alerts/channels/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-channels", projectId] }),
  });
}

export function useDeleteAlertChannel(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      apiFetch(`/projects/${projectId}/alerts/channels/${channelId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-channels", projectId] }),
  });
}

export function useAlertDispatches(
  projectId: string | null | undefined,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 10));

  return useQuery<{ data: AlertDispatch[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["alert-dispatches", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<AlertDispatch[] | { data: AlertDispatch[]; meta: any }>(
        `/projects/${projectId}/alerts/dispatches?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 10 } };
      return res as { data: AlertDispatch[]; meta: any };
    },
    enabled: !!projectId,
  });
}

// ─── 5. ADVANCED LOAD BALANCING HOOKS ────────────────────────────────────────

export function useLoadBalancerPools(projectId: string | null | undefined) {
  return useQuery<LoadBalancerPool[]>({
    queryKey: ["lb-pools", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/load-balancer/pools`),
    enabled: !!projectId,
  });
}

export function useCreateLoadBalancerPool(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoadBalancerPoolPayload) =>
      apiFetch<LoadBalancerPool>(`/projects/${projectId}/load-balancer/pools`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb-pools", projectId] }),
  });
}

export function useUpdateLoadBalancerPool(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<LoadBalancerPoolPayload> & { id: string }) =>
      apiFetch<LoadBalancerPool>(`/projects/${projectId}/load-balancer/pools/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb-pools", projectId] }),
  });
}

export function useDeleteLoadBalancerPool(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poolId: string) =>
      apiFetch(`/projects/${projectId}/load-balancer/pools/${poolId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lb-pools", projectId] }),
  });
}

// ─── 6. STATEFUL THREAT SCORING HOOKS ────────────────────────────────────────

export function useThreatScoreRules(projectId: string | null | undefined) {
  return useQuery<ThreatScoreRule[]>({
    queryKey: ["reputation-rules", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/reputation/rules`),
    enabled: !!projectId,
  });
}

export function useCreateThreatScoreRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ThreatScoreRulePayload) =>
      apiFetch<ThreatScoreRule>(`/projects/${projectId}/reputation/rules`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reputation-rules", projectId] }),
  });
}

export function useUpdateThreatScoreRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ThreatScoreRulePayload> & { id: string }) =>
      apiFetch<ThreatScoreRule>(`/projects/${projectId}/reputation/rules/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reputation-rules", projectId] }),
  });
}

export function useDeleteThreatScoreRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiFetch(`/projects/${projectId}/reputation/rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reputation-rules", projectId] }),
  });
}

export function useClientThreatLedger(
  projectId: string | null | undefined,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 10));

  return useQuery<{ data: ClientThreatLedgerEntry[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["threat-ledger", projectId, params],
    queryFn: async () => {
      const res = await apiFetch<ClientThreatLedgerEntry[] | { data: ClientThreatLedgerEntry[]; meta: any }>(
        `/projects/${projectId}/reputation/ledger?${qs.toString()}`
      );
      if (Array.isArray(res)) return { data: res, meta: { total: res.length, page: 1, limit: 10 } };
      return res as { data: ClientThreatLedgerEntry[]; meta: any };
    },
    enabled: !!projectId,
  });
}

// ─── 7. TIME-TRAVEL SANDBOX RECORDER HOOKS ───────────────────────────────────

export function useSandboxSessions(projectId: string | null | undefined) {
  return useQuery<SandboxSession[]>({
    queryKey: ["sandbox-sessions", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/sandbox/sessions`),
    enabled: !!projectId,
  });
}

export function useCreateSandboxSession(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SandboxSessionPayload) =>
      apiFetch<SandboxSession>(`/projects/${projectId}/sandbox/sessions`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sandbox-sessions", projectId] }),
  });
}

export function useUpdateSandboxSession(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<SandboxSessionPayload> & { id: string }) =>
      apiFetch<SandboxSession>(`/projects/${projectId}/sandbox/sessions/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sandbox-sessions", projectId] }),
  });
}

export function useDeleteSandboxSession(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch(`/projects/${projectId}/sandbox/sessions/${sessionId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sandbox-sessions", projectId] }),
  });
}

export function useSandboxMockTemplates(
  projectId: string | null | undefined,
  sessionId: string | null | undefined
) {
  return useQuery<SandboxMockTemplate[]>({
    queryKey: ["sandbox-templates", sessionId],
    queryFn: () => apiFetch(`/projects/${projectId}/sandbox/sessions/${sessionId}/templates`),
    enabled: !!projectId && !!sessionId,
  });
}

export function useCreateSandboxMockTemplate(
  projectId: string | null | undefined,
  sessionId: string | null | undefined
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SandboxMockTemplatePayload) =>
      apiFetch<SandboxMockTemplate>(`/projects/${projectId}/sandbox/sessions/${sessionId}/templates`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sandbox-templates", sessionId] }),
  });
}

export function useDeleteSandboxMockTemplate(
  projectId: string | null | undefined,
  sessionId: string | null | undefined
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      apiFetch(`/projects/${projectId}/sandbox/sessions/${sessionId}/templates/${templateId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sandbox-templates", sessionId] }),
  });
}
