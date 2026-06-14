import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  originUrl: string | null;
  status: "active" | "readonly" | "deleted";
  statusReason: string | null;
  ownerId?: string;
  edgeUrl?: string;
  memberRole?: "owner" | "admin" | "developer" | "viewer";
  wafEnabled?: boolean;
  cacheEnabled?: boolean;
  ddosProtectionEnabled?: boolean;
  replayEnabled?: boolean;
  botDetectionEnabled?: boolean;
  aiInsightsEnabled?: boolean;
  secretShieldEnabled?: boolean;
  threatFeedsEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectsResponse {
  data: Project[];
  meta?: { total: number; page: number; limit: number };
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiFetch<ProjectsResponse | Project[]>("/projects");
      // Handle both array and wrapped { data: [] } shapes
      return Array.isArray(res) ? res : (res as ProjectsResponse).data ?? [];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description?: string;
      originUrl?: string;
    }) => apiFetch<Project>("/projects", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
