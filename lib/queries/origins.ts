import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PaginationMeta } from "./replay";

// ─── Origin Types ─────────────────────────────────────────────────────────────

export interface Origin {
  id: string;
  projectId: string;
  label: string;
  url: string;
  isPrimary: boolean;
  weight: number;
  region: string | null;
  healthCheckPath: string | null;
  healthCheckIntervalSec: number;
  healthCheckTimeoutMs: number;
  isHealthy: boolean;
  lastCheckedAt: string | number | null;
  consecutiveFailures: number;
  status: "active" | "disabled";
  createdAt: string | number;
  updatedAt: string | number;
}

export interface OriginPayload {
  label: string;
  url: string;
  isPrimary?: boolean;
  weight?: number;
  region?: string;
  healthCheckPath?: string;
  healthCheckIntervalSec?: number;
  healthCheckTimeoutMs?: number;
}

// ─── Custom Domain Types ──────────────────────────────────────────────────────

export interface CustomDomain {
  id: string;
  projectId: string;
  domain: string;
  verificationToken: string;
  status: "pending" | "active" | "failed";
  verifiedAt: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

// ─── Origin Hooks ─────────────────────────────────────────────────────────────

export function useOrigins(projectId: string | null | undefined) {
  return useQuery<Origin[]>({
    queryKey: ["origins", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/origins`),
    enabled: !!projectId,
    refetchInterval: 10_000,
  });
}

export function useCreateOrigin(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OriginPayload) =>
      apiFetch<Origin>(`/projects/${projectId}/origins`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["origins", projectId] }),
  });
}

export function useUpdateOrigin(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<OriginPayload> & { id: string }) =>
      apiFetch<Origin>(`/projects/${projectId}/origins/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["origins", projectId] }),
  });
}

export function useDeleteOrigin(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (originId: string) =>
      apiFetch(`/projects/${projectId}/origins/${originId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["origins", projectId] }),
  });
}

// ─── Custom Domain Hooks ──────────────────────────────────────────────────────

export function useCustomDomains(projectId: string | null | undefined) {
  return useQuery<CustomDomain[]>({
    queryKey: ["custom-domains", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/custom-domains`),
    enabled: !!projectId,
  });
}

export function useAddCustomDomain(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) =>
      apiFetch<CustomDomain>(`/projects/${projectId}/custom-domains`, {
        method: "POST",
        body: { domain },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-domains", projectId] }),
  });
}

export function useVerifyCustomDomain(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) =>
      apiFetch<{ verified: boolean; status: string; message: string }>(
        `/projects/${projectId}/custom-domains/${domainId}/verify`,
        { method: "POST" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-domains", projectId] }),
  });
}

export function useDeleteCustomDomain(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) =>
      apiFetch(`/projects/${projectId}/custom-domains/${domainId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-domains", projectId] }),
  });
}

// ─── Origin Health Logs ──────────────────────────────────────────────────────

export interface OriginHealthLog {
  id: string;
  projectId: string;
  originId: string;
  url: string;
  isHealthy: boolean;
  latencyMs: number;
  statusCode: number | null;
  error: string | null;
  createdAt: string;
}

export function useOriginHealthLogs(
  projectId: string | null | undefined,
  originId: string | null | undefined,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit ?? 20));

  return useQuery<{ data: OriginHealthLog[]; meta: PaginationMeta }>({
    queryKey: ["origin-health-logs", projectId, originId, params],
    queryFn: async () => {
      const res = await apiFetch<OriginHealthLog[] | { data: OriginHealthLog[]; meta: PaginationMeta }>(
        `/projects/${projectId}/origins/${originId}/health-logs?${qs.toString()}`
      );
      if (Array.isArray(res)) {
        return {
          data: res,
          meta: { total: res.length, page: 1, limit: params?.limit ?? 20, totalPages: 1, hasNext: false, hasPrev: false },
        };
      }
      return res as { data: OriginHealthLog[]; meta: PaginationMeta };
    },
    enabled: !!projectId && !!originId,
    refetchInterval: 10_000, // Refresh logs list every 10s
  });
}

