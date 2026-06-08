"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjects, type Project } from "@/lib/queries/projects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronsUpDown, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProjectSelectorProps {
  collapsed: boolean;
  currentProject: Project | null;
  onSelect: (project: Project) => void;
}

export function SidebarProjectSelector({
  collapsed,
  currentProject,
  onSelect,
}: SidebarProjectSelectorProps) {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="px-2">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500",
    readonly: "bg-amber-500",
    deleted: "bg-red-500",
  };

  const trigger = (
    <button
      id="project-selector-trigger"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed && "justify-center px-0"
      )}
      onClick={() => setOpen(!open)}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          "bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold"
        )}
      >
        {currentProject
          ? currentProject.name.charAt(0).toUpperCase()
          : <FolderOpen className="h-3.5 w-3.5" />}
      </span>

      {!collapsed && (
        <>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="truncate font-medium leading-none">
              {currentProject?.name ?? "Select project"}
            </span>
            {currentProject && (
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full",
                    statusColor[currentProject.status] ?? "bg-muted-foreground"
                  )}
                />
                {currentProject.status}
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </>
      )}
    </button>
  );

  const dropdown = (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={collapsed ? "right" : "bottom"}
        sideOffset={collapsed ? 8 : 4}
        className="w-64"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Projects
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects && projects.length > 0 ? (
          projects.map((p) => (
            <DropdownMenuItem
              key={p.id}
              id={`project-option-${p.id}`}
              onSelect={() => onSelect(p)}
              className="flex items-center gap-2"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold",
                  "bg-sidebar-primary text-sidebar-primary-foreground"
                )}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 truncate">{p.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "h-4 px-1 text-[10px]",
                  p.status === "active"
                    ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : p.status === "readonly"
                    ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "border-red-500/30 text-red-600 dark:text-red-400"
                )}
              >
                {p.status}
              </Badge>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-3 text-center text-xs text-muted-foreground">
            No projects yet
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          id="create-new-project"
          onSelect={() => router.push("/onboarding")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create new project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center">{dropdown}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {currentProject?.name ?? "Select project"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return dropdown;
}
