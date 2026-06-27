"use client";

import { useState, useMemo } from "react";

import {
  AreaChart as RechartsAreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Activity,
  Zap,
  Database,
  Shield,
  Bot,
  Clock,
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  Gauge,
  ServerCrash,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useAnalyticsSummary,
  useAnalyticsTopPaths,
  useAnalyticsStatusCodes,
  useAnalyticsLatencyTrend,
  type DateRange,
} from "@/lib/queries/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

function formatMs(ms: number): string {
  if (!ms || ms === 0) return "0ms";
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

// ─── Components ──────────────────────────────────────────────────────────────

type RangeOption = { label: string; value: DateRange };
const RANGES: RangeOption[] = [
  { label: "24h", value: "1d" },
  { label: "7d", value: "7d" },
  { label: "14d", value: "14d" },
  { label: "30d", value: "30d" },
];

function RangeSelector({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
            value === r.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "blue",
  isLoading,
  trend,
  trendUp,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: "blue" | "green" | "purple" | "amber" | "rose" | "cyan" | "slate";
  isLoading?: boolean;
  trend?: string;
  trendUp?: boolean;
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
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
          <div className={cn("mt-3 flex items-center gap-1 text-xs", trendUp ? "text-emerald-400" : "text-rose-400")}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_BUCKET_COLORS: Record<string, string> = {
  "2xx": "hsl(142, 76%, 36%)",
  "3xx": "hsl(217, 91%, 60%)",
  "4xx": "hsl(43, 96%, 56%)",
  "5xx": "hsl(0, 84%, 60%)",
  other: "hsl(220, 14%, 46%)",
};

const METHOD_COLORS: Record<string, string> = {
  GET: "hsl(142, 76%, 36%)",
  POST: "hsl(217, 91%, 60%)",
  PUT: "hsl(43, 96%, 56%)",
  PATCH: "hsl(271, 81%, 56%)",
  DELETE: "hsl(0, 84%, 60%)",
  OPTIONS: "hsl(220, 14%, 46%)",
  HEAD: "hsl(220, 14%, 60%)",
};

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
        <Globe className="h-8 w-8 text-blue-400" />
      </div>
      <div>
        <p className="text-base font-semibold">No project selected</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Select a project from the sidebar to view traffic analytics, performance metrics, and security events.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;
  const [range, setRange] = useState<DateRange>("7d");

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useAnalyticsSummary(projectId, range);
  const { data: topPaths, isLoading: topPathsLoading } = useAnalyticsTopPaths(projectId, range, 10);
  const { data: statusData, isLoading: statusLoading } = useAnalyticsStatusCodes(projectId, range);
  const { data: latencyTrend, isLoading: latencyLoading } = useAnalyticsLatencyTrend(projectId, range);

  const requests = summary?.requests;
  const cache = summary?.cache;
  const dailyTrend = summary?.dailyTrend ?? [];

  const cacheHitRate = useMemo(() => {
    const hits = cache?.hits ?? 0;
    const misses = cache?.misses ?? 0;
    const total = hits + misses;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : "0.0";
  }, [cache]);

  const errorRate = useMemo(() => {
    const total = requests?.total ?? 0;
    const errors = requests?.errors ?? 0;
    return total > 0 ? ((errors / total) * 100).toFixed(2) : "0.00";
  }, [requests]);

  const bucketData = useMemo(() => {
    if (!statusData?.buckets) return [];
    return Object.entries(statusData.buckets)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k, value: v, color: STATUS_BUCKET_COLORS[k] ?? "#888" }));
  }, [statusData]);

  const methodData = useMemo(() => {
    if (!statusData?.methods) return [];
    return statusData.methods.map((m) => ({
      name: m.method,
      value: m.total,
      color: METHOD_COLORS[m.method] ?? "#888",
    }));
  }, [statusData]);

  // Chart configs
  const trafficChartConfig = {
    totalRequests: { label: "Requests", color: "var(--color-primary)" },
    hits: { label: "Cache Hits", color: "hsl(142, 76%, 36%)" },
    misses: { label: "Cache Misses", color: "hsl(0, 84%, 60%)" },
  } satisfies ChartConfig;

  const latencyChartConfig = {
    avgDurationMs: { label: "Avg Latency", color: "hsl(217, 91%, 60%)" },
    p95DurationMs: { label: "P95 Latency", color: "hsl(271, 81%, 56%)" },
    avgOriginDurationMs: { label: "Avg Origin Latency", color: "hsl(43, 96%, 56%)" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <BarChart2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Analytics</h1>
              <p className="text-xs text-muted-foreground">
                {currentProject
                  ? `Traffic & performance insights — ${currentProject.name}`
                  : "Select a project to view analytics"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {projectId && (
              <>
                <RangeSelector value={range} onChange={setRange} />
                <Button
                  id="analytics-refresh"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => refetchSummary()}
                  disabled={summaryLoading}
                >
                  {summaryLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Refresh
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {!projectId ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6 p-6">
          {/* ── Top Stat Cards ──────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            <StatCard
              icon={Activity}
              label="Total Requests"
              value={formatNumber(requests?.total ?? 0)}
              sub={`in selected period`}
              color="blue"
              isLoading={summaryLoading}
            />
            <StatCard
              icon={ArrowUpRight}
              label="This Month"
              value={formatNumber(summary?.monthly?.totalRequests ?? 0)}
              sub={summary?.monthly?.periodLabel ?? "Current month"}
              color="green"
              isLoading={summaryLoading}
            />
            <StatCard
              icon={Zap}
              label="Cache Hit Rate"
              value={`${cacheHitRate}%`}
              sub={`${formatNumber(cache?.hits ?? 0)} hits`}
              color="amber"
              isLoading={summaryLoading}
            />
            <StatCard
              icon={Database}
              label="Bandwidth"
              value={formatBytes(requests?.totalBandwidth ?? 0)}
              sub="data transferred"
              color="cyan"
              isLoading={summaryLoading}
            />
            <StatCard
              icon={Clock}
              label="Avg Latency"
              value={formatMs(requests?.avgDuration ?? 0)}
              sub={`P95: ${formatMs(requests?.p95Duration ?? 0)}`}
              color="purple"
              isLoading={summaryLoading}
            />
            <StatCard
              icon={Shield}
              label="WAF Blocked"
              value={formatNumber(summary?.wafBlocked ?? 0)}
              color="rose"
              isLoading={summaryLoading}
            />
            <StatCard
              icon={Bot}
              label="Bots Detected"
              value={formatNumber(summary?.botsDetected ?? 0)}
              color="slate"
              isLoading={summaryLoading}
            />
          </div>

          {/* ── Error Rate Alert ─────────────────────────── */}
          {!summaryLoading && parseFloat(errorRate) > 1 && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-400">Elevated Error Rate</p>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  {errorRate}% of requests returned 5xx errors ({formatNumber(requests?.errors ?? 0)} errors) in the selected period.
                  Consider checking your origin server health.
                </p>
              </div>
            </div>
          )}

          {/* ── Main Charts Grid ─────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Traffic Volume Chart — spans 2 cols */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Traffic Volume</CardTitle>
                    <CardDescription className="text-xs">Daily requests, cache hits and misses</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      Requests
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      Hits
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                      Misses
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-52 w-full" />
                ) : (
                  <div className="h-52 w-full">
                    <ChartContainer config={trafficChartConfig} className="h-full w-full aspect-auto">
                      <RechartsAreaChart
                        data={dailyTrend}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="hitsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
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
                          interval="preserveStartEnd"
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
                          cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                          content={<ChartTooltipContent />}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalRequests"
                          name="Requests"
                          stroke="var(--color-primary)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#totalGrad)"
                          activeDot={{ r: 4 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="hits"
                          name="Cache Hits"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill="url(#hitsGrad)"
                          strokeDasharray="4 2"
                          activeDot={{ r: 3 }}
                        />
                      </RechartsAreaChart>
                    </ChartContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Code Donut */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Response Codes</CardTitle>
                <CardDescription className="text-xs">HTTP status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <Skeleton className="h-52 w-full" />
                ) : bucketData.length === 0 ? (
                  <div className="flex h-52 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ServerCrash className="h-8 w-8 opacity-30" />
                    <p className="text-xs">No requests in period</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="h-36 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bucketData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {bucketData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "var(--color-popover)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "var(--color-foreground)",
                            }}
                            formatter={(v) => [typeof v === "number" ? formatNumber(v) : String(v ?? ""), ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {bucketData.map((b) => (
                        <div key={b.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ background: b.color }}
                          />
                          <span className="text-muted-foreground">{b.name}</span>
                          <span className="font-mono font-semibold ml-auto">{formatNumber(b.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Latency & Method Charts ───────────────────── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Latency Trend — spans 2 */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Latency Trend</CardTitle>
                    <CardDescription className="text-xs">Avg and P95 response times per day</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      Avg
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
                      P95
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {latencyLoading ? (
                  <Skeleton className="h-52 w-full" />
                ) : (
                  <div className="h-52 w-full">
                    <ChartContainer config={latencyChartConfig} className="h-full w-full aspect-auto">
                      <RechartsAreaChart
                        data={latencyTrend ?? []}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="p95Grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0} />
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
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          tick={{ fontSize: 10 }}
                          className="fill-muted-foreground"
                          tickFormatter={(v) => `${v}ms`}
                        />
                        <ChartTooltip
                          cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                          content={<ChartTooltipContent />}
                        />
                        <Area
                          type="monotone"
                          dataKey="avgDurationMs"
                          name="Avg Latency"
                          stroke="hsl(217, 91%, 60%)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#avgGrad)"
                          activeDot={{ r: 4 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="p95DurationMs"
                          name="P95 Latency"
                          stroke="hsl(271, 81%, 56%)"
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill="url(#p95Grad)"
                          strokeDasharray="4 2"
                          activeDot={{ r: 3 }}
                        />
                      </RechartsAreaChart>
                    </ChartContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* HTTP Methods Breakdown */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">HTTP Methods</CardTitle>
                <CardDescription className="text-xs">Request distribution by method</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <Skeleton className="h-52 w-full" />
                ) : methodData.length === 0 ? (
                  <div className="flex h-52 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Gauge className="h-8 w-8 opacity-30" />
                    <p className="text-xs">No data available</p>
                  </div>
                ) : (
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={methodData}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                        barSize={16}
                      >
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/20" />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10 }}
                          className="fill-muted-foreground"
                          tickFormatter={formatNumber}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11 }}
                          className="fill-muted-foreground"
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-popover)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "var(--color-foreground)",
                          }}
                          formatter={(v) => [typeof v === "number" ? formatNumber(v) : String(v ?? ""), "Requests"]}
                        />
                        <Bar dataKey="value" radius={4}>
                          {methodData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Cache Trend & Summary ─────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cache Trend Chart — spans 2 */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cache Performance</CardTitle>
                <CardDescription className="text-xs">Daily cache hit/miss/bypass ratio</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-44 w-full" />
                ) : (
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailyTrend}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                        barSize={8}
                        barGap={2}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10 }}
                          className="fill-muted-foreground"
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10 }}
                          className="fill-muted-foreground"
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-popover)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "var(--color-foreground)",
                          }}
                        />
                        <Bar dataKey="hits" name="Cache Hits" fill="hsl(142, 76%, 36%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="misses" name="Cache Misses" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="bypasses" name="Bypasses" fill="hsl(43, 96%, 56%)" radius={[2, 2, 0, 0]} />
                        <Legend
                          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                          formatter={(v) => <span style={{ color: "var(--color-muted-foreground)" }}>{v}</span>}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Metrics */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Period Summary</CardTitle>
                <CardDescription className="text-xs">Aggregated performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/40">
                    {[
                      { label: "Success Rate", value: `${(100 - parseFloat(errorRate)).toFixed(2)}%`, icon: CheckCircle2, ok: parseFloat(errorRate) < 1 },
                      { label: "Error Rate", value: `${errorRate}%`, icon: AlertTriangle, ok: parseFloat(errorRate) < 1 },
                      { label: "Cache Hit Rate", value: `${cacheHitRate}%`, icon: Zap, ok: parseFloat(cacheHitRate) >= 50 },
                      { label: "Avg Response", value: formatMs(requests?.avgDuration ?? 0), icon: Clock, ok: (requests?.avgDuration ?? 0) < 500 },
                      { label: "P95 Latency", value: formatMs(requests?.p95Duration ?? 0), icon: Gauge, ok: (requests?.p95Duration ?? 0) < 2000 },
                      { label: "Sandbox Calls", value: formatNumber(summary?.sandboxCalls ?? 0), icon: Activity, ok: true },
                    ].map(({ label, value, icon: Icon, ok }) => (
                      <div key={label} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <span className={cn("text-xs font-mono font-semibold", ok ? "text-foreground" : "text-rose-400")}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Top Paths Table ───────────────────────────── */}
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Top Endpoints</CardTitle>
                  <CardDescription className="text-xs">Most requested paths ranked by traffic volume</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Top 10</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {topPathsLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !topPaths || topPaths.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Globe className="h-8 w-8 opacity-30" />
                  <p className="text-xs">No request data for this period</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">#</th>
                        <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Path</th>
                        <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Requests</th>
                        <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Avg Latency</th>
                        <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Cache Hit %</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPaths.map((p, i) => (
                        <tr
                          key={p.path}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2.5 pr-4 font-mono text-muted-foreground">{i + 1}</td>
                          <td className="py-2.5 pr-4 font-mono max-w-xs truncate">
                            <span className="text-foreground">{p.path}</span>
                          </td>
                          <td className="py-2.5 pr-4 text-right font-mono font-semibold">
                            {formatNumber(p.total)}
                          </td>
                          <td className="py-2.5 pr-4 text-right font-mono">
                            <span className={cn(p.avgDurationMs > 1000 ? "text-rose-400" : p.avgDurationMs > 500 ? "text-amber-400" : "text-foreground")}>
                              {formatMs(p.avgDurationMs)}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
                              parseFloat(p.cacheHitRate) >= 70
                                ? "bg-emerald-500/10 text-emerald-400"
                                : parseFloat(p.cacheHitRate) >= 30
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {p.cacheHitRate}%
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono">
                            <span className={p.errors > 0 ? "text-rose-400 font-semibold" : "text-muted-foreground"}>
                              {p.errors > 0 ? formatNumber(p.errors) : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
