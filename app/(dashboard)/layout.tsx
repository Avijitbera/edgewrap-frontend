"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { useProjects } from "@/lib/queries/projects";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    if (projectsLoading) return;

    const projectCount = projects?.length ?? 0;
    if (projectCount === 0) {
      if (pathname !== "/onboarding") {
        router.replace("/onboarding");
      }
    } else {
      if (pathname === "/onboarding") {
        router.replace("/dashboard");
      }
    }
  }, [projects, projectsLoading, pathname, router]);

  if (typeof window !== "undefined" && !getToken()) {
    return null;
  }

  if (projectsLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Sidebar>{children}</Sidebar>;
}

