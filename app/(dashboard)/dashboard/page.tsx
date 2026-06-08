"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CreditCard,
  Zap,
  Activity,
  Database,
  TrendingUp,
  Shield,
  ShieldCheck,
  Globe,
  Bot,
  CircuitBoard,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  Server,
  Cpu,
  BarChart2,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import { useProjects } from "@/lib/queries/projects";
import {
  useSubscription,
  useUsage,
  useInvoices,
  useBillingPortal,
  type Invoice,
} from "@/lib/queries/billing";
import { useWafStats } from "@/lib/queries/waf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCurrency(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(usd);
}

function formatDate(str: string | null | undefined): string {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UsageBar({
  used,
  limit,
  color = "primary",
}: {
  used: number;
  limit: number | null;
  color?: string;
}) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  const danger = pct >= 90;
  const warning = pct >= 70;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-foreground">{formatNumber(used)}</span>
        <span className="text-muted-foreground">
          {limit ? `of ${formatNumber(limit)}` : "Unlimited"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            danger ? "bg-red-500" : warning ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = "blue",
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  color?: "blue" | "green" | "purple" | "amber" | "rose" | "cyan";
  isLoading?: boolean;
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight font-mono">{value}</p>
            )}
            {sub && !isLoading && (
              <p className="text-xs text-muted-foreground truncate">{sub}</p>
            )}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && !isLoading && (
          <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InvoiceStatusBadge({ status }: { status: Invoice["status"] }) {
  const meta: Record<Invoice["status"], { label: string; className: string }> = {
    paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    open: { label: "Open", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
    uncollectible: { label: "Uncollectible", className: "bg-red-500/10 text-red-400 border-red-500/30" },
    void: { label: "Void", className: "bg-muted text-muted-foreground border-border" },
  };
  const m = meta[status] ?? meta.draft;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", m.className)}>
      {m.label}
    </span>
  );
}

function SubscriptionPlanBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    trialing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    past_due: "bg-red-500/10 text-red-400 border-red-500/30",
    canceled: "bg-muted text-muted-foreground border-border",
    incomplete: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", colors[status] ?? colors.canceled)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Quick Action Cards ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: "WAF",
    description: "Web Application Firewall rules & threat detection",
    href: "/dashboard/waf",
    icon: Shield,
    color: "rose",
  },
  {
    label: "Cache",
    description: "Edge caching configuration & rules",
    href: "/dashboard/cache",
    icon: Zap,
    color: "amber",
  },
  {
    label: "Analytics",
    description: "Traffic insights & performance metrics",
    href: "/dashboard/analytics",
    icon: BarChart2,
    color: "blue",
  },
  {
    label: "API Keys",
    description: "Manage project API access tokens",
    href: "/dashboard/api-keys",
    icon: KeyRound,
    color: "purple",
  },
  {
    label: "Bot Detection",
    description: "AI-powered bot mitigation & fingerprinting",
    href: "/dashboard/bot-detection",
    icon: Bot,
    color: "cyan",
  },
  {
    label: "AI Insights",
    description: "ML-powered anomaly detection & advisories",
    href: "/dashboard/ai-insights",
    icon: Sparkles,
    color: "green",
  },
] as const;

// ─── Cache Hit Donut ─────────────────────────────────────────────────────────

function CacheDonut({ hits, misses }: { hits: number; misses: number }) {
  const total = hits + misses;
  const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : "0.0";
  const data = total > 0
    ? [
        { name: "Hit", value: hits },
        { name: "Miss", value: misses },
      ]
    : [{ name: "No data", value: 1 }];

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-24 w-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={44}
              paddingAngle={total > 0 ? 2 : 0}
              dataKey="value"
              stroke="none"
            >
              {total > 0 ? (
                <>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </>
              ) : (
                <Cell fill="hsl(var(--muted))" />
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold font-mono leading-none">{hitRate}%</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">hit rate</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Hits</span>
          <span className="font-mono font-semibold ml-auto">{formatNumber(hits)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">Misses</span>
          <span className="font-mono font-semibold ml-auto">{formatNumber(misses)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: projects } = useProjects();
  const { data: subData, isLoading: subLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: wafStats, isLoading: wafStatsLoading } = useWafStats(projectId, 14);

  const billingPortal = useBillingPortal();

  const subscription = subData?.subscription ?? null;
  const plan = subData?.plan ?? null;

  const totals = usage?.totals;
  const periodEnd = usage?.periodEnd;
  const freeUsed = usage?.freeRequestsUsed ?? 0;
  const freeLimit = usage?.freeRequestsLimit ?? 10_000;

  const cacheHitRate = useMemo(() => {
    const hits = totals?.cacheHits ?? 0;
    const misses = totals?.cacheMisses ?? 0;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }, [totals]);

  const activeProjects = projects?.filter((p) => p.status === "active").length ?? 0;

  const wafThreats = wafStats?.total ?? 0;

  // Filled daily trend for last 14 days (WAF events as proxy for activity)
  const activityData = useMemo(() => {
    const map = new Map((wafStats?.dailyTrend ?? []).map((d) => [d.day, d.total]));
    const result: Array<{ label: string; events: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ label, events: map.get(key) ?? 0 });
    }
    return result;
  }, [wafStats]);

  const activityChartConfig = {
    events: {
      label: "Security Events",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const handleOpenPortal = async () => {
    try {
      const { portalUrl } = await billingPortal.mutateAsync(window.location.href);
      window.open(portalUrl, "_blank");
    } catch {
      // silently ignore — user may not have a billing account
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Overview</h1>
              <p className="text-xs text-muted-foreground">
                {currentProject
                  ? `Project: ${currentProject.name}`
                  : "Select a project to see project-level stats"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {periodEnd && (
              <span className="text-xs text-muted-foreground">
                Period resets{" "}
                <span className="font-medium text-foreground">{formatDate(periodEnd)}</span>
              </span>
            )}
            {subscription && (
              <Button
                id="overview-manage-billing"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleOpenPortal}
                disabled={billingPortal.isPending}
              >
                {billingPortal.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CreditCard className="h-3 w-3" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* ── Stat Cards Row ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={Activity}
            label="Total Requests"
            value={formatNumber(totals?.totalRequests ?? 0)}
            sub="this billing period"
            color="blue"
            isLoading={usageLoading}
          />
          <StatCard
            icon={Zap}
            label="Cache Hits"
            value={`${cacheHitRate.toFixed(1)}%`}
            sub={`${formatNumber(totals?.cacheHits ?? 0)} hits`}
            color="amber"
            isLoading={usageLoading}
          />
          <StatCard
            icon={Database}
            label="Bandwidth"
            value={formatBytes(totals?.totalBandwidthBytes ?? 0)}
            sub="transferred this month"
            color="cyan"
            isLoading={usageLoading}
          />
          <StatCard
            icon={Cpu}
            label="AI Calls"
            value={formatNumber(totals?.aiTotalCalls ?? 0)}
            sub="ML inference calls"
            color="purple"
            isLoading={usageLoading}
          />
          <StatCard
            icon={Shield}
            label="Threats Blocked"
            value={formatNumber(wafThreats)}
            sub="last 14 days"
            color="rose"
            isLoading={wafStatsLoading && !!projectId}
          />
          <StatCard
            icon={Server}
            label="Active Projects"
            value={activeProjects.toString()}
            sub={`of ${plan?.maxProjects ?? "∞"} allowed`}
            color="green"
          />
        </div>

        {/* ── Main Content Grid ────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column (spans 2) */}
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Usage & Quota */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Usage This Period</CardTitle>
                    <CardDescription className="text-xs">
                      Free allowance & pay-as-you-go consumption
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/billing">
                    <Button id="overview-view-billing" variant="ghost" size="sm" className="gap-1 text-xs">
                      Full Billing <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {usageLoading ? (
                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-muted-foreground">Free Requests</p>
                      <UsageBar used={freeUsed} limit={freeLimit} />
                    </div>
                    <Separator className="opacity-50" />
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-muted-foreground">Total Requests</p>
                        <UsageBar
                          used={totals?.totalRequests ?? 0}
                          limit={plan?.requestsPerMonth ?? null}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-muted-foreground">Bandwidth</p>
                        <UsageBar
                          used={Math.round((totals?.totalBandwidthBytes ?? 0) / (1024 * 1024 * 1024))}
                          limit={plan?.bandwidthGbPerMonth ?? null}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-muted-foreground">AI Calls</p>
                        <UsageBar
                          used={totals?.aiTotalCalls ?? 0}
                          limit={plan?.aiCallsPerMonth ?? null}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-muted-foreground">PAYG Cost</p>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="font-mono font-semibold text-foreground">
                            {formatCurrency(totals?.paygCostUsd ?? 0)}
                          </span>
                          <span className="text-muted-foreground">this month</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Activity Chart */}
            {projectId && (
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Security Activity</CardTitle>
                      <CardDescription className="text-xs">
                        WAF threat events — last 14 days
                      </CardDescription>
                    </div>
                    <Link href="/dashboard/waf">
                      <Button id="overview-view-waf" variant="ghost" size="sm" className="gap-1 text-xs">
                        WAF Details <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {wafStatsLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <div className="h-48 w-full">
                      <ChartContainer config={activityChartConfig} className="h-full w-full aspect-auto">
                        <RechartsAreaChart
                          data={activityData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tick={{ fontSize: 10 }}
                            className="fill-muted-foreground"
                            interval={2}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            allowDecimals={false}
                            tick={{ fontSize: 10 }}
                            className="fill-muted-foreground"
                          />
                          <ChartTooltip
                            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Area
                            type="monotone"
                            dataKey="events"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#activityGradient)"
                            activeDot={{
                              r: 4,
                              style: {
                                fill: "hsl(var(--primary))",
                                filter: "drop-shadow(0 0 4px hsl(var(--primary)))",
                              },
                            }}
                          />
                        </RechartsAreaChart>
                      </ChartContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cache Analytics (per-project) */}
            {projectId && (
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Cache Performance</CardTitle>
                      <CardDescription className="text-xs">Hit/miss ratio for this billing period</CardDescription>
                    </div>
                    <Link href="/dashboard/cache">
                      <Button id="overview-view-cache" variant="ghost" size="sm" className="gap-1 text-xs">
                        Cache Details <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {usageLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <CacheDonut
                      hits={totals?.cacheHits ?? 0}
                      misses={totals?.cacheMisses ?? 0}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.href} href={action.href}>
                      <div
                        id={`quick-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                        className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card/70 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md cursor-pointer"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        <div>
                          <p className="text-sm font-medium leading-tight">{action.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar column */}
          <div className="flex flex-col gap-6">

            {/* Subscription Plan Card */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Subscription</CardTitle>
                  {subscription && (
                    <SubscriptionPlanBadge status={subscription.status} />
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {subLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : plan ? (
                  <>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold tracking-tight">
                        {formatCurrency(
                          subscription?.billingCycle === "yearly"
                            ? (plan.priceYearlyUsd ?? plan.priceMonthlyUsd * 12) / 12
                            : plan.priceMonthlyUsd
                        )}
                      </span>
                      <span className="mb-1 text-xs text-muted-foreground">/ month</span>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                      <p className="text-sm font-semibold">{plan.name}</p>
                      {plan.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                      )}
                    </div>
                    {subscription && (
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cycle</span>
                          <span className="font-medium capitalize">{subscription.billingCycle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Renews</span>
                          <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                        </div>
                        {subscription.cancelAtPeriodEnd && (
                          <div className="mt-1 flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-amber-400">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>Cancels at period end</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      id="overview-manage-plan"
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={handleOpenPortal}
                      disabled={billingPortal.isPending}
                    >
                      {billingPortal.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      Manage Plan
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                      <p className="text-sm font-semibold">Free Tier</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatNumber(freeLimit)} free requests / month included
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <p className="text-muted-foreground">Free requests used</p>
                      <UsageBar used={freeUsed} limit={freeLimit} />
                    </div>
                    <Link href="/dashboard/billing">
                      <Button
                        id="overview-upgrade-plan"
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                      >
                        <ArrowUpRight className="h-3 w-3" />
                        Upgrade Plan
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Services Status */}
            {currentProject && (
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Services Status</CardTitle>
                  <CardDescription className="text-xs">{currentProject.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col divide-y divide-border/40">
                    {[
                      { label: "WAF", enabled: currentProject.wafEnabled, icon: Shield, href: "/dashboard/waf" },
                      { label: "Cache", enabled: currentProject.cacheEnabled, icon: Zap, href: "/dashboard/cache" },
                      { label: "DDoS Protection", enabled: currentProject.ddosProtectionEnabled, icon: ShieldCheck, href: "/dashboard/ddos" },
                      { label: "Bot Detection", enabled: currentProject.botDetectionEnabled, icon: Bot, href: "/dashboard/bot-detection" },
                      { label: "AI Insights", enabled: currentProject.aiInsightsEnabled, icon: Sparkles, href: "/dashboard/ai-insights" },
                      { label: "Request Replay", enabled: currentProject.replayEnabled, icon: Activity, href: "/dashboard/replay" },
                    ].map(({ label, enabled, icon: Icon, href }) => (
                      <Link key={label} href={href}>
                        <div className="flex items-center justify-between py-2.5 group hover:opacity-80 transition-opacity cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium">{label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {enabled ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs text-emerald-400">Active</span>
                              </>
                            ) : (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground">Off</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Invoices */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Invoices</CardTitle>
                  <Link href="/dashboard/billing">
                    <Button id="overview-all-invoices" variant="ghost" size="sm" className="gap-1 text-xs">
                      All <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !invoices || invoices.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 opacity-30" />
                    <p className="text-xs">No invoices yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/40">
                    {invoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between py-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <p className="text-xs font-medium">{formatDate(inv.createdAt)}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatCurrency(inv.amount / 100)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <InvoiceStatusBadge status={inv.status} />
                          {inv.invoiceUrl && (
                            <a
                              href={inv.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PAYG Cost Alert */}
            {(totals?.paygCostUsd ?? 0) > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-amber-400">PAYG Usage Active</p>
                  <p className="text-xs text-amber-300/80">
                    You have {formatCurrency(totals?.paygCostUsd ?? 0)} in pay-as-you-go charges this period.
                    Consider upgrading your plan to reduce per-request costs.
                  </p>
                  <Link href="/dashboard/billing" className="mt-1">
                    <Button id="overview-payg-upgrade" variant="outline" size="sm" className="gap-1.5 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 w-full">
                      View Plans <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* No project selected notice */}
            {!currentProject && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <Globe className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-400">No project selected</p>
                  <p className="text-xs text-blue-300/80 mt-1">
                    Select a project from the sidebar to see project-level metrics like WAF events, cache performance, and service status.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
