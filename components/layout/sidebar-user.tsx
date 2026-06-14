"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMe } from "@/lib/queries/auth";
import { useLogout } from "@/lib/queries/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogOut, ChevronsUpDown, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarUserProps {
  collapsed: boolean;
}

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export function SidebarUser({ collapsed }: SidebarUserProps) {
  const router = useRouter();
  const { data: user } = useMe();
  const logout = useLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    router.push("/login");
  }

  const initials = getInitials(user?.name, user?.email);

  const avatarEl = (
    <Avatar className="h-7 w-7 shrink-0">
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />}
      <AvatarFallback className="text-[11px] font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-0 pb-2">
        <Separator className="mb-1" />
        <ThemeToggle collapsed />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              id="user-billing-collapsed"
              href="/dashboard/billing"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                "transition-colors"
              )}
              aria-label="Billing"
            >
              <CreditCard className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Billing</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              id="user-menu-trigger-collapsed"
              onClick={handleLogout}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                "transition-colors"
              )}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              id="user-avatar-collapsed"
              className="outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-full"
            >
              {avatarEl}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{user?.name ?? "Account"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-2 pb-2">
      <Separator />
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="user-menu-trigger"
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              )}
            >
              {avatarEl}
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <span className="truncate text-sm font-medium leading-none">
                  {user?.name ?? "Account"}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {user?.email ?? ""}
                </span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56 mb-1">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              id="user-billing-button"
              asChild
              className="gap-2 cursor-pointer"
            >
              <Link href="/dashboard/billing">
                <CreditCard className="h-4 w-4" />
                Billing & Subscriptions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              id="logout-button"
              onSelect={handleLogout}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
      </div>
    </div>
  );
}
