"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Zap,
  GitBranch,
  ScrollText,
  CircuitBoard,
  ShieldAlert,
  BarChart2,
  KeyRound,
  Settings,
  Bot,
  EyeOff,
  Sparkles,
  Database,
  Mail,
  CreditCard,
  Globe,
  Users,
  RefreshCw,
  Network,
  Bell,
  Eye,
  Terminal,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Nav groups ─────────────────────────────────────────────────────
export const NAV_GROUPS = [
  {
    label: "General",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Security",
    items: [
      { label: "WAF", href: "/dashboard/waf", icon: Shield },
      { label: "DDoS", href: "/dashboard/ddos", icon: ShieldAlert },
      { label: "Bot Detection", href: "/dashboard/bot-detection", icon: Bot },
      { label: "Secret Shield", href: "/dashboard/secret-shield", icon: EyeOff },
      { label: "Threat Feeds", href: "/dashboard/threat-feeds", icon: ShieldAlert },
      { label: "IP Reputation", href: "/dashboard/ip-reputation", icon: Shield },
      { label: "Rules", href: "/dashboard/rules", icon: GitBranch },
    ],
  },
  {
    label: "Performance",
    items: [
      { label: "Cache", href: "/dashboard/cache", icon: Zap },
      { label: "Circuit Breaker", href: "/dashboard/circuit-breaker", icon: CircuitBoard },
      { label: "Geo Residency", href: "/dashboard/geo-residency", icon: Globe },
      { label: "Load Balancer", href: "/dashboard/load-balancer", icon: Network },
      { label: "Origins", href: "/dashboard/origins", icon: Globe },
      // { label: "DB Pooling", href: "/dashboard/db-pooling", icon: Database },
    ],
  },
  {
    label: "Observability",
    items: [
      { label: "Logs", href: "/dashboard/logs", icon: ScrollText },
      { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
      { label: "Request Replay", href: "/dashboard/replay", icon: RefreshCw },
      { label: "Shadow Traffic", href: "/dashboard/shadow-traffic", icon: Eye },
      { label: "Sandbox Mocking", href: "/dashboard/sandbox", icon: Terminal },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
      { label: "AI Insights", href: "/dashboard/ai-insights", icon: Sparkles },
    ],
  },
  {
    label: "Delivery",
    items: [
      { label: "Email", href: "/dashboard/email", icon: Mail },
    ],
  },
  {
    label: "Project",
    items: [
      { label: "API Keys", href: "/dashboard/api-keys", icon: KeyRound },
      { label: "Members", href: "/dashboard/members", icon: Users },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
] as const;

// Flat list for collapsed view
export const ALL_NAV_ITEMS: Array<{ label: string; href: string; icon: React.ElementType; exact?: boolean }> =
  NAV_GROUPS.flatMap((g) => (g.items as unknown) as Array<{ label: string; href: string; icon: React.ElementType; exact?: boolean }>);

interface SidebarNavProps {
  collapsed: boolean;
}

function NavItem({
  item,
  collapsed,
}: {
  item: { label: string; href: string; icon: React.ElementType; exact?: boolean };
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    "exact" in item && item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);

  const link = (
    <Link
      id={`nav-${item.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium",
        "transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        collapsed && "justify-center px-0 py-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "opacity-100" : "opacity-55"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className={cn("flex flex-col", collapsed ? "gap-0 px-1" : "gap-0 px-2")}
    >
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label}>
          {gi > 0 && !collapsed && (
            <Separator className="my-2 opacity-60" />
          )}
          {gi > 0 && collapsed && <div className="my-1" />}

          {!collapsed && (
            <p className="mb-0.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </p>
          )}

          <div className={cn("flex flex-col", collapsed ? "gap-0.5" : "gap-0.5")}>
            {group.items.map((item) => (
              <NavItem key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
