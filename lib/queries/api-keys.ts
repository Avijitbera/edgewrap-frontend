import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  secretPrefix: string | null;
  environment: "live" | "test";
  allowMobile: boolean;
  allowWeb: boolean;
  allowDesktop: boolean;
  allowServer: boolean;
  allowedOrigins: string | null; // JSON string
  requestsPerMinute: number | null;
  requestsPerDay: number | null;
  status: "active" | "revoked";
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  totalRequestCount: number;
  createdAt: string;
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  environment: "live" | "test";
  key: string;        // shown once
  keyPrefix: string;
  secret: string | null; // shown once, null for non-server
  secretPrefix: string | null;
  platforms: { mobile: boolean; web: boolean; desktop: boolean; server: boolean };
  warning: string;
}

export interface ApiKeyRotated {
  id: string;
  key: string;       // shown once
  keyPrefix: string;
  secret: string | null;
  secretPrefix: string | null;
  warning: string;
}

export interface ApiKeyViolation {
  id: string;
  apiKeyId: string;
  projectId: string;
  violationType: string;
  ip: string | null;
  userAgent: string | null;
  detail: string | null;
  createdAt: string;
}

export interface ApiKeyRotation {
  id: string;
  apiKeyId: string;
  rotatedBy: string;
  oldKeyPrefix: string;
  reason: string | null;
  createdAt: string;
}

export interface CreateApiKeyBody {
  name: string;
  description?: string;
  environment: "live" | "test";
  allowMobile: boolean;
  allowWeb: boolean;
  allowDesktop: boolean;
  allowServer: boolean;
  allowedOrigins?: string[];
  requestsPerMinute?: number;
  requestsPerDay?: number;
  expiresAt?: string;
}

export interface UpdateApiKeyBody {
  name?: string;
  description?: string;
  allowMobile?: boolean;
  allowWeb?: boolean;
  allowDesktop?: boolean;
  allowServer?: boolean;
  allowedOrigins?: string[];
  requestsPerMinute?: number;
  requestsPerDay?: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useApiKeys(projectId: string | null | undefined) {
  return useQuery<ApiKey[]>({
    queryKey: ["api-keys", projectId],
    queryFn: async () => {
      const res = await apiFetch<ApiKey[] | { data: ApiKey[] }>(
        `/projects/${projectId}/api-keys`
      );
      return Array.isArray(res) ? res : (res as { data: ApiKey[] }).data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useCreateApiKey(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApiKeyBody) =>
      apiFetch<ApiKeyCreated>(`/projects/${projectId}/api-keys`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys", projectId] });
    },
  });
}

export function useUpdateApiKey(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, body }: { keyId: string; body: UpdateApiKeyBody }) =>
      apiFetch<{ message: string }>(`/projects/${projectId}/api-keys/${keyId}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys", projectId] });
    },
  });
}

export function useRevokeApiKey(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, reason }: { keyId: string; reason?: string }) =>
      apiFetch<{ message: string }>(`/projects/${projectId}/api-keys/${keyId}/revoke`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys", projectId] });
    },
  });
}

export function useRotateApiKey(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, reason }: { keyId: string; reason?: string }) =>
      apiFetch<ApiKeyRotated>(`/projects/${projectId}/api-keys/${keyId}/rotate`, {
        method: "POST",
        body: { reason },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys", projectId] });
    },
  });
}

export function useApiKeyViolations(
  projectId: string | null | undefined,
  keyId: string | null | undefined
) {
  return useQuery<ApiKeyViolation[]>({
    queryKey: ["api-key-violations", projectId, keyId],
    queryFn: async () => {
      const res = await apiFetch<ApiKeyViolation[] | { data: ApiKeyViolation[] }>(
        `/projects/${projectId}/api-keys/${keyId}/violations`
      );
      return Array.isArray(res)
        ? res
        : (res as { data: ApiKeyViolation[] }).data ?? [];
    },
    enabled: !!projectId && !!keyId,
  });
}

export function useApiKeyRotations(
  projectId: string | null | undefined,
  keyId: string | null | undefined
) {
  return useQuery<ApiKeyRotation[]>({
    queryKey: ["api-key-rotations", projectId, keyId],
    queryFn: async () => {
      const res = await apiFetch<ApiKeyRotation[] | { data: ApiKeyRotation[] }>(
        `/projects/${projectId}/api-keys/${keyId}/rotations`
      );
      return Array.isArray(res)
        ? res
        : (res as { data: ApiKeyRotation[] }).data ?? [];
    },
    enabled: !!projectId && !!keyId,
  });
}
