"use client";

import { useState, useMemo } from "react";
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ShieldAlert,
  Activity,
  Zap,
  Globe,
  Users,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Cpu,
  TrendingUp,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useDdosConfig,
  useDdosStats,
  useDdosEvents,
  useUpdateDdosConfig,
  useResetDdosConfig,
} from "@/lib/queries/security";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  challenged: { label: "Challenged", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  blocked: { label: "Blocked", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  rate_limited: { label: "Rate Limited", color: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: <Zap className="h-3 w-3" /> },
  mitigated: { label: "Mitigated", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
};

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] ?? { label: action, color: "bg-muted text-muted-foreground border-border", icon: null };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", meta.color)}>
      {meta.icon}{meta.label}
    </span>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-300 shadow-lg ring-0 transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

// ─── DDoS Area Chart ──────────────────────────────────────────────────────────

function DdosChart({
  data,
  days,
}: {
  data: Array<{ day: string; total: number }>;
  days: number;
}) {
  const filledData = useMemo(() => {
    const map = new Map(data.map((d) => [d.day, d.total]));
    const result: Array<{ day: string; label: string; attacks: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ day: key, label, attacks: map.get(key) ?? 0 });
    }
    return result;
  }, [data, days]);

  const chartConfig = {
    attacks: {
      label: "Attacks Detected",
      color: "hsl(24.6 95% 53.1%)",
    },
  } satisfies ChartConfig;

  return (
    <div className="h-[320px] w-full mt-2">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <RechartsAreaChart
          data={filledData}
          margin={{
            top: 20,
            right: 15,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="attackGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-attacks)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-attacks)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            className="text-[10px] fill-muted-foreground font-medium"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            allowDecimals={false}
            className="text-[10px] fill-muted-foreground font-mono"
          />
          <ChartTooltip
            cursor={{ stroke: "var(--color-attacks)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Area
            type="monotone"
            dataKey="attacks"
            stroke="var(--color-attacks)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#attackGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-attacks)", filter: "drop-shadow(0 0 6px var(--color-attacks))" }
            }}
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── NumericInput ─────────────────────────────────────────────────────────────

function NumericField({
  id, label, description, value, min, max, unit,
  onCommit, disabled,
}: {
  id: string; label: string; description?: string;
  value: number; min: number; max?: number; unit?: string;
  onCommit: (v: number) => void; disabled?: boolean;
}) {
  const [local, setLocal] = useState(String(value));
  const prev = String(value);
  if (prev !== local && !document.activeElement?.id?.includes(id)) {
    // sync from server if field is not focused
  }
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            id={id}
            type="number"
            className="h-7 w-24 text-xs text-right font-mono"
            value={local}
            min={min}
            max={max}
            disabled={disabled}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => {
              const n = Number(local);
              if (!isNaN(n) && n >= min) onCommit(n);
              else setLocal(String(value));
            }}
          />
          {unit && <span className="text-xs text-muted-foreground shrink-0">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DdosPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: config, isLoading: configLoading } = useDdosConfig(projectId);
  const { data: stats, isLoading: statsLoading } = useDdosStats(projectId, 14);
  const [page, setPage] = useState(1);
  const { data: eventsResp, isLoading: eventsLoading } = useDdosEvents(projectId, { page, limit: 10 });

  const updateConfig = useUpdateDdosConfig(projectId);
  const resetConfig = useResetDdosConfig(projectId);

  const events = eventsResp?.data ?? [];
  const eventsMeta = eventsResp?.meta;
  const totalPages = eventsMeta ? Math.ceil(eventsMeta.total / 10) : 0;

  const totalAttacks = stats?.total ?? 0;
  const blockedCount = stats?.actionBreakdown?.find((a) => a.action === "blocked")?.total ?? 0;
  const mitigatedCount = stats?.actionBreakdown?.find((a) => a.action === "mitigated")?.total ?? 0;

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <ShieldAlert className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view DDoS protection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">DDoS Protection</h1>
            <p className="text-xs text-muted-foreground">Adaptive rate limiting, challenge modes &amp; IP allowlisting</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          currentProject?.ddosProtectionEnabled
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-muted text-muted-foreground"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", currentProject?.ddosProtectionEnabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
          {currentProject?.ddosProtectionEnabled ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ShieldAlert className="h-3.5 w-3.5" /> Total Attacks (14d)</div>
                  <div className="text-3xl font-bold tabular-nums">{totalAttacks.toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><XCircle className="h-3.5 w-3.5" /> Blocked</div>
                  <div className="text-3xl font-bold tabular-nums text-red-400">{blockedCount.toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="h-3.5 w-3.5" /> Mitigated</div>
                  <div className="text-3xl font-bold tabular-nums text-green-400">{mitigatedCount.toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" /> Peak RPS</div>
                  <div className="text-3xl font-bold tabular-nums text-blue-400">{(stats?.peakRps ?? 0).toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Config + Chart side by side */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Config card */}
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Cpu className="h-4 w-4 text-orange-500" /> Protection Settings
                  </CardTitle>
                  <CardDescription className="text-xs">Thresholds, challenge mode &amp; adaptive mitigation</CardDescription>
                </div>
                <Button
                  id="ddos-reset-config"
                  variant="outline" size="sm"
                  className="gap-1.5 text-xs"
                  disabled={resetConfig.isPending}
                  onClick={() => resetConfig.mutate()}
                >
                  {resetConfig.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {configLoading ? (
                <div className="space-y-3 py-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : config ? (
                <div className="divide-y divide-border/60">
                  <Toggle
                    label="Adaptive Mitigation"
                    description="Automatically adjust thresholds based on traffic patterns"
                    checked={config.adaptiveEnabled}
                    onChange={(v) => updateConfig.mutate({ adaptiveEnabled: v })}
                    disabled={updateConfig.isPending}
                  />
                  <Separator className="opacity-0 my-0" />

                  <NumericField
                    id="ddos-rps-threshold"
                    label="Requests / second threshold"
                    description="Block when sustained RPS exceeds this value"
                    value={config.requestsPerSecondThreshold}
                    min={1}
                    unit="req/s"
                    onCommit={(v) => updateConfig.mutate({ requestsPerSecondThreshold: v })}
                    disabled={updateConfig.isPending}
                  />
                  <Separator className="opacity-40" />

                  <NumericField
                    id="ddos-unique-ips"
                    label="Unique IPs / minute threshold"
                    description="Trigger when too many distinct IPs appear in a minute"
                    value={config.uniqueIpsPerMinuteThreshold}
                    min={1}
                    unit="IPs/min"
                    onCommit={(v) => updateConfig.mutate({ uniqueIpsPerMinuteThreshold: v })}
                    disabled={updateConfig.isPending}
                  />
                  <Separator className="opacity-40" />

                  <NumericField
                    id="ddos-challenge-duration"
                    label="Challenge duration"
                    description="How long an IP stays in challenge mode"
                    value={config.challengeDurationSec}
                    min={60}
                    unit="sec"
                    onCommit={(v) => updateConfig.mutate({ challengeDurationSec: v })}
                    disabled={updateConfig.isPending}
                  />
                  <Separator className="opacity-40" />

                  <div className="py-3">
                    <Label htmlFor="ddos-challenge-mode" className="text-sm font-medium">Challenge Mode</Label>
                    <p className="text-xs text-muted-foreground mb-2">How to respond to detected DDoS traffic</p>
                    <Select
                      value={config.challengeMode}
                      onValueChange={(v) => updateConfig.mutate({ challengeMode: v as any })}
                      disabled={updateConfig.isPending}
                    >
                      <SelectTrigger id="ddos-challenge-mode" className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="js_challenge" className="text-xs">JS Challenge</SelectItem>
                        <SelectItem value="managed_challenge" className="text-xs">Managed Challenge</SelectItem>
                        <SelectItem value="captcha" className="text-xs">CAPTCHA</SelectItem>
                        <SelectItem value="block" className="text-xs">Hard Block</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No config found.</p>
              )}
            </CardContent>
          </Card>

          {/* Attack trend chart */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-orange-500" /> Attack Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Daily DDoS events over the last 14 days</CardDescription>
                </div>
                {stats && stats.actionBreakdown.length > 0 && (
                  <div className="flex items-center gap-2">
                    {stats.actionBreakdown.map((a) => (
                      <span key={a.action} className="flex items-center gap-1">
                        <ActionBadge action={a.action} />
                        <span className="text-xs font-mono text-muted-foreground">{a.total}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {statsLoading ? (
                <div className="flex flex-1 items-end gap-1">
                  {Array.from({ length: 14 }).map((_, i) => <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />)}
                </div>
              ) : totalAttacks === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ShieldAlert className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No attacks in the last 14 days 🛡️</p>
                </div>
              ) : (
                <DdosChart data={stats?.dailyTrend ?? []} days={14} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attack Event Feed */}
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" /> Attack Event Feed
            </CardTitle>
            <CardDescription className="text-xs">Recent DDoS events — auto-refreshes every 30s</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {eventsLoading ? (
              <div className="divide-y divide-border/40">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3">
                    <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <ShieldAlert className="h-10 w-10 opacity-20" />
                <p className="text-sm">No DDoS events recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {events.map((ev) => {
                  const start = new Date(typeof ev.startedAt === "number" ? ev.startedAt * 1000 : ev.startedAt);
                  return (
                    <div key={ev.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-xs hover:bg-muted/30 transition-colors">
                      <span className="font-mono text-muted-foreground w-20 shrink-0">
                        {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <ActionBadge action={ev.action} />
                      {ev.peakRps != null && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="h-3 w-3 text-orange-400" />
                          <span className="font-mono">{ev.peakRps.toLocaleString()} rps peak</span>
                        </span>
                      )}
                      {ev.uniqueIps != null && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span className="font-mono">{ev.uniqueIps.toLocaleString()} IPs</span>
                        </span>
                      )}
                      {ev.totalRequests != null && (
                        <span className="ml-auto font-mono text-muted-foreground/70">
                          {ev.totalRequests.toLocaleString()} reqs
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button id="ddos-events-prev" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-3 w-3" /> Prev
                  </Button>
                  <Button id="ddos-events-next" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
