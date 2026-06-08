import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface EmailDeliverabilityConfig {
  id: string;
  projectId: string;
  domain: string;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  mxVerified: boolean;
  bounceRate: number;
  complaintRate: number;
  deliveryRate: number;
  reputationScore: number;
  spamScore: number;
  aiRecommendations: string | null; // JSON string of recommendations
  lastDnsCheckAt: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export function useEmailConfig(projectId: string | null | undefined) {
  return useQuery<EmailDeliverabilityConfig | null>({
    queryKey: ["email-config", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/email/config`),
    enabled: !!projectId,
  });
}

export function useUpdateEmailConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { domain: string }) =>
      apiFetch<EmailDeliverabilityConfig>(`/projects/${projectId}/email/config`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-config", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteEmailConfig(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${projectId}/email/config`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-config", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCheckEmailDeliverability(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/projects/${projectId}/email/check`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-config", projectId] });
    },
  });
}
