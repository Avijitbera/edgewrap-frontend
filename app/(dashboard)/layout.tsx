"use client";

import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  const hasToken = mounted && !!getToken();
  const { data: projects, isLoading: projectsLoading } = useProjects({
    enabled: hasToken,
  });

  useEffect(() => {
    if (!hasToken || projectsLoading) return;

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
  }, [projects, projectsLoading, pathname, router, hasToken]);

  // If not mounted yet (SSR) or has no token, render a placeholder/loader to prevent hydration mismatch
  if (!mounted || !getToken()) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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


