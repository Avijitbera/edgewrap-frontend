"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProjects, type Project } from "@/lib/queries/projects";
import { SidebarProjectSelector } from "@/components/layout/sidebar-project-selector";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Context so child pages can read the active project
import { createContext, useContext } from "react";

interface SidebarContextValue {
  currentProject: Project | null;
  setCurrentProject: (p: Project) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  currentProject: null,
  setCurrentProject: () => { },
});

export function useSidebarProject() {
  return useContext(SidebarContext);
}

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: projects } = useProjects();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Auto-select first project when projects load
  const resolvedProject =
    currentProject ?? (projects && projects.length > 0 ? projects[0] : null);

  return (
    <SidebarContext.Provider
      value={{
        currentProject: resolvedProject,
        setCurrentProject: (p) => setCurrentProject(p),
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        {/* ── Sidebar ─────────────────────────── */}
        <aside
          id="app-sidebar"
          className={cn(
            "flex flex-col border-r border-sidebar-border bg-sidebar",
            "transition-all duration-200 ease-in-out",
            collapsed ? "w-14" : "w-60"
          )}
        >
          {/* Logo + collapse toggle */}
          <div
            className={cn(
              "flex h-14 shrink-0 items-center border-b border-sidebar-border px-2",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-md">
                    <Image
                      src="/logo.png"
                      alt="EdgeWrap"
                      width={28}
                      height={28}
                      className="rounded"
                      priority
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">EdgeWrap</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="EdgeWrap"
                    width={28}
                    height={28}
                    className="rounded"
                    priority
                  />
                  <span className="text-sm font-semibold tracking-tight">
                    EdgeWrap
                  </span>
                </Link>
              </>
            )}

            {/* Collapse toggle always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  id="sidebar-collapse-toggle"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollapsed((c) => !c)}
                  className={cn("h-7 w-7 p-0", collapsed && "mt-0")}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {collapsed ? "Expand" : "Collapse"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Project selector */}
          <div className={cn("px-2 py-2", collapsed && "px-0 flex justify-center")}>
            <div className={cn("w-full", collapsed && "px-1")}>
              <SidebarProjectSelector
                collapsed={collapsed}
                currentProject={resolvedProject}
                onSelect={(p) => setCurrentProject(p)}
              />
            </div>
          </div>

          <Separator className="mx-2 w-auto" />

          {/* Service Navigation — scrollable */}
          <div className="flex-1 overflow-y-auto py-2">
            {!collapsed && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Services
              </p>
            )}
            <SidebarNav collapsed={collapsed} />
          </div>

          {/* User section at bottom */}
          <SidebarUser collapsed={collapsed} />
        </aside>

        {/* ── Main content ────────────────────── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
