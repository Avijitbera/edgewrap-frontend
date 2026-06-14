import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { type Project } from "@/lib/queries/projects";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomDomain {
  id: string;
  projectId: string;
  domain: string;
  status: "pending" | "active" | "failed";
  verificationToken: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "admin" | "developer" | "viewer";
  invitedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
  user?: {
    name: string | null;
    email: string;
  };
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: "admin" | "developer" | "viewer";
  invitedBy: string;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface ProjectTransfer {
  id: string;
  projectId: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "canceled";
  expiresAt: string;
  acceptedAt: string | null;
  canceledAt: string | null;
  projectNameSnapshot: string;
  createdAt: string;
}

export interface UpdateProjectBody {
  name?: string;
  description?: string;
  originUrl?: string | null;
  originTimeoutMs?: number;
  wafEnabled?: boolean;
  ddosProtectionEnabled?: boolean;
  cacheEnabled?: boolean;
  replayEnabled?: boolean;
  botDetectionEnabled?: boolean;
  aiInsightsEnabled?: boolean;
  secretShieldEnabled?: boolean;
  threatFeedsEnabled?: boolean;
}

// ─── Project Hooks ────────────────────────────────────────────────────────────

export function useProject(projectId: string | null | undefined) {
  return useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: () => apiFetch<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
}

export function useUpdateProject(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProjectBody) =>
      apiFetch<Project>(`/projects/${projectId}`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function usePauseProject(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(`/projects/${projectId}/pause`, { method: "POST", body: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useResumeProject(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(`/projects/${projectId}/resume`, { method: "POST", body: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) =>
      apiFetch<{ message: string; purgeAfter: string; projectId: string }>(
        `/projects/${projectId}`,
        { method: "DELETE", body: { confirm: true, reason } }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ─── Custom Domains Hooks ─────────────────────────────────────────────────────

export function useCustomDomains(projectId: string | null | undefined) {
  return useQuery<CustomDomain[]>({
    queryKey: ["custom-domains", projectId],
    queryFn: async () => {
      const res = await apiFetch<CustomDomain[] | { data: CustomDomain[] }>(
        `/projects/${projectId}/custom-domains`
      );
      return Array.isArray(res) ? res : (res as { data: CustomDomain[] }).data ?? [];
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-domains", projectId] });
    },
  });
}

export function useRemoveCustomDomain(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) =>
      apiFetch<{ message: string }>(
        `/projects/${projectId}/custom-domains/${domainId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-domains", projectId] });
    },
  });
}

export function useVerifyCustomDomain(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) =>
      apiFetch<{ verified: boolean; status: string; message: string }>(
        `/projects/${projectId}/custom-domains/${domainId}/verify`,
        { method: "POST", body: {} }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-domains", projectId] });
    },
  });
}

// ─── Members Hooks ────────────────────────────────────────────────────────────

export function useProjectMembers(projectId: string | null | undefined) {
  return useQuery<ProjectMember[]>({
    queryKey: ["members", projectId],
    queryFn: async () => {
      const res = await apiFetch<ProjectMember[] | { data: ProjectMember[] }>(
        `/projects/${projectId}/members`
      );
      return Array.isArray(res) ? res : (res as { data: ProjectMember[] }).data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useInviteMember(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: "admin" | "developer" | "viewer" }) =>
      apiFetch<{ message: string }>(`/projects/${projectId}/invitations`, {
        method: "POST",
        body: { email, role },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", projectId] });
      qc.invalidateQueries({ queryKey: ["invitations", projectId] });
    },
  });
}

export function useProjectInvitations(projectId: string | null | undefined) {
  return useQuery<ProjectInvitation[]>({
    queryKey: ["invitations", projectId],
    queryFn: async () => {
      const res = await apiFetch<ProjectInvitation[] | { data: ProjectInvitation[] }>(
        `/projects/${projectId}/invitations`
      );
      return Array.isArray(res) ? res : (res as { data: ProjectInvitation[] }).data ?? [];
    },
    enabled: !!projectId,
  });
}

export function useRevokeInvitation(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      apiFetch<{ message: string }>(`/projects/${projectId}/invitations/${invitationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations", projectId] });
    },
  });
}

export function useUpdateMemberRole(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "admin" | "developer" | "viewer" }) =>
      apiFetch<{ message: string }>(`/projects/${projectId}/members/${memberId}`, {
        method: "PATCH",
        body: { role },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", projectId] });
    },
  });
}

export function useRemoveMember(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiFetch<{ message: string }>(`/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", projectId] });
    },
  });
}

// ─── Transfer Hooks ───────────────────────────────────────────────────────────

export function useInitiateTransfer(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toEmail: string) =>
      apiFetch<{ message: string; transferId: string; expiresAt: string }>(
        `/projects/${projectId}/transfer`,
        { method: "POST", body: { toEmail } }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}

export function useCancelTransfer(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(`/projects/${projectId}/transfer/cancel`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}
