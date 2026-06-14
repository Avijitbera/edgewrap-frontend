import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Edge Rule Types ─────────────────────────────────────────────────────────

export interface EdgeRuleCondition {
  field: string;
  op: string;
  value: any;
}

export interface EdgeRule {
  id: string;
  projectId: string;
  createdBy: string;
  name: string;
  description: string | null;
  source: "manual" | "ai_suggested" | "imported";
  priority: number;
  conditions: string; // JSON string of EdgeRuleCondition[]
  action: "allow" | "block" | "challenge" | "rate_limit" | "redirect" | "rewrite" | "add_header" | "cache_override" | "log";
  actionConfig: string | null; // JSON string of action parameters
  isEnabled: boolean;
  matchCount: number;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface EdgeRulePayload {
  name: string;
  description?: string;
  priority: number;
  conditions: EdgeRuleCondition[];
  action: EdgeRule["action"];
  actionConfig?: Record<string, any>;
  isEnabled?: boolean;
}

// ─── Edge Rule Hooks ─────────────────────────────────────────────────────────

export function useEdgeRules(projectId: string | null | undefined) {
  return useQuery<EdgeRule[]>({
    queryKey: ["edge-rules", projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/rules`),
    enabled: !!projectId,
  });
}

export function useCreateEdgeRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EdgeRulePayload) =>
      apiFetch<EdgeRule>(`/projects/${projectId}/rules`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edge-rules", projectId] }),
    onError: (err: any) => {
      alert(err.message || "Failed to create edge rule");
    },
  });
}

export function useUpdateEdgeRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<EdgeRulePayload> & { id: string }) =>
      apiFetch<EdgeRule>(`/projects/${projectId}/rules/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edge-rules", projectId] }),
    onError: (err: any) => {
      alert(err.message || "Failed to update edge rule");
    },
  });
}

export function useDeleteEdgeRule(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      apiFetch(`/projects/${projectId}/rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edge-rules", projectId] }),
    onError: (err: any) => {
      alert(err.message || "Failed to delete edge rule");
    },
  });
}
