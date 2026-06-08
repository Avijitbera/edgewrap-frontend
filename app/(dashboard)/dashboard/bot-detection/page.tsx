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
  Bot,
  Activity,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  SkullIcon,
  Bug,
  Cpu,
  Globe,
  TrendingUp,
  Eye,
  BadgeAlert,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import { useBotStats, useBotEvents } from "@/lib/queries/security";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Metadata ─────────────────────────────────────────────────────────────────

const BOT_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  verified_bot: { label: "Verified Bot", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  automated: { label: "Automated", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Cpu className="h-3 w-3" /> },
  likely_bot: { label: "Likely Bot", color: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: <Bot className="h-3 w-3" /> },
  likely_human: { label: "Likely Human", color: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: <Eye className="h-3 w-3" /> },
  account_abuse: { label: "Account Abuse", color: "bg-rose-500/15 text-rose-400 border-rose-500/30", icon: <BadgeAlert className="h-3 w-3" /> },
  scraper: { label: "Scraper", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: <Bug className="h-3 w-3" /> },
  ddos_bot: { label: "DDoS Bot", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
};

const ACTION_META: Record<string, { label: string; color: string }> = {
  allowed: { label: "Allowed", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  blocked: { label: "Blocked", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  challenged: { label: "Challenged", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  logged: { label: "Logged", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

function BotTypeBadge({ type }: { type: string }) {
  const meta = BOT_TYPE_META[type] ?? { label: type, color: "bg-muted text-muted-foreground border-border", icon: null };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", meta.color)}>
      {meta.icon}{meta.label}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] ?? { label: action, color: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", meta.color)}>
      {meta.label}
    </span>
  );
}

// ─── Bot Area Chart ──────────────────────────────────────────────────────────

function BotChart({
  data,
  days,
}: {
  data: Array<{ day: string; total: number }>;
  days: number;
}) {
  const filledData = useMemo(() => {
    const map = new Map(data.map((d) => [d.day, d.total]));
    const result: Array<{ day: string; label: string; bots: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ day: key, label, bots: map.get(key) ?? 0 });
    }
    return result;
  }, [data, days]);

  const chartConfig = {
    bots: {
      label: "Bots Detected",
      color: "hsl(262.1 83.3% 57.8%)",
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
            <linearGradient id="botGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-bots)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-bots)" stopOpacity={0} />
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
            cursor={{ stroke: "var(--color-bots)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Area
            type="monotone"
            dataKey="bots"
            stroke="var(--color-bots)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#botGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-bots)", filter: "drop-shadow(0 0 6px var(--color-bots))" }
            }}
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── Bot Score Bar ─────────────────────────────────────────────────────────────

function BotScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-orange-500" : pct >= 30 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BotDetectionPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: stats, isLoading: statsLoading } = useBotStats(projectId, 14);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterFraud, setFilterFraud] = useState<string>("");

  const { data: eventsResp, isLoading: eventsLoading } = useBotEvents(projectId, {
    botType: filterType || undefined,
    isFraud: filterFraud === "true" ? true : filterFraud === "false" ? false : undefined,
    page,
    limit: 10,
  });

  const events = eventsResp?.data ?? [];
  const eventsMeta = eventsResp?.meta;
  const totalPages = eventsMeta ? Math.ceil(eventsMeta.total / 10) : 0;

  const totalBots = stats?.total ?? 0;
  const fraudCount = stats?.fraudCount ?? 0;
  const blockedCount = stats?.actionBreakdown?.find((a) => a.action === "blocked")?.total ?? 0;
  const topBotType = stats?.botTypeBreakdown
    ? [...stats.botTypeBreakdown].sort((a, b) => b.total - a.total)[0]
    : undefined;

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Bot className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view bot detection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
            <Bot className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Bot Detection</h1>
            <p className="text-xs text-muted-foreground">AI-powered bot scoring, fraud detection &amp; traffic classification</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          currentProject?.botDetectionEnabled
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-muted text-muted-foreground"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", currentProject?.botDetectionEnabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
          {currentProject?.botDetectionEnabled ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Bot className="h-3.5 w-3.5" /> Total Bots (14d)</div>
                  <div className="text-3xl font-bold tabular-nums">{totalBots.toLocaleString()}</div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertTriangle className="h-3.5 w-3.5" /> Fraud Detected</div>
                  <div className="text-3xl font-bold tabular-nums text-rose-400">{fraudCount.toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" /> Top Type</div>
                  {topBotType ? (
                    <div className="mt-1">
                      <BotTypeBadge type={topBotType.botType} />
                      <p className="mt-1 text-xl font-bold tabular-nums">{topBotType.total.toLocaleString()}</p>
                    </div>
                  ) : <div className="text-2xl font-bold text-muted-foreground">—</div>}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Breakdown + Chart side by side */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Bot type breakdown */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-violet-500" /> Traffic Classification
              </CardTitle>
              <CardDescription className="text-xs">Bot type breakdown for the last 14 days</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {statsLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (stats?.botTypeBreakdown ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                  <ShieldCheck className="h-8 w-8 opacity-20" />
                  <p className="text-sm">No bot traffic detected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...(stats?.botTypeBreakdown ?? [])]
                    .sort((a, b) => b.total - a.total)
                    .map((bt) => {
                      const pct = totalBots > 0 ? (bt.total / totalBots) * 100 : 0;
                      const meta = BOT_TYPE_META[bt.botType];
                      return (
                        <div key={bt.botType} className="flex items-center gap-3">
                          <div className="w-28 shrink-0"><BotTypeBadge type={bt.botType} /></div>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn("h-full rounded-full bg-gradient-to-r", meta ? "from-violet-600 to-violet-400" : "bg-muted-foreground")}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-mono text-xs text-muted-foreground shrink-0">{bt.total}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily trend chart */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-violet-500" /> Detection Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Daily bot events over the last 14 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {statsLoading ? (
                <div className="flex flex-1 items-end gap-1">
                  {Array.from({ length: 14 }).map((_, i) => <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />)}
                </div>
              ) : totalBots === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Bot className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No bot events in the last 14 days</p>
                </div>
              ) : (
                <BotChart data={stats?.dailyTrend ?? []} days={14} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bot Event Feed */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-violet-500" /> Bot Event Feed
                </CardTitle>
                <CardDescription className="text-xs">Recent bot detection events — auto-refreshes every 30s</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterType || "__all__"} onValueChange={(v) => { setFilterType(v === "__all__" ? "" : v); setPage(1); }}>
                  <SelectTrigger id="bot-filter-type" className="h-7 text-xs w-36">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="text-xs">All types</SelectItem>
                    {Object.entries(BOT_TYPE_META).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterFraud || "__all__"} onValueChange={(v) => { setFilterFraud(v === "__all__" ? "" : v); setPage(1); }}>
                  <SelectTrigger id="bot-filter-fraud" className="h-7 text-xs w-32">
                    <SelectValue placeholder="All traffic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="text-xs">All traffic</SelectItem>
                    <SelectItem value="true" className="text-xs">Fraud only</SelectItem>
                    <SelectItem value="false" className="text-xs">Non-fraud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {eventsLoading ? (
              <div className="divide-y divide-border/40">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3">
                    <Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <Bot className="h-10 w-10 opacity-20" />
                <p className="text-sm">No bot events found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {events.map((ev) => {
                  const ts = new Date(typeof ev.createdAt === "number" ? ev.createdAt * 1000 : ev.createdAt);
                  return (
                    <div key={ev.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-xs hover:bg-muted/30 transition-colors">
                      <span className="font-mono text-muted-foreground w-16 shrink-0">
                        {ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <BotTypeBadge type={ev.botType} />
                      <ActionBadge action={ev.action} />
                      {ev.isFraud && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400">
                          <AlertTriangle className="h-3 w-3" /> Fraud
                        </span>
                      )}
                      <BotScoreBar score={ev.botScore} />
                      <span className="ml-auto font-mono text-muted-foreground/70">{ev.ip}</span>
                      {ev.country && <span className="text-muted-foreground/60">{ev.country}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages} · {eventsMeta?.total.toLocaleString()} events</span>
                <div className="flex items-center gap-1">
                  <Button id="bot-events-prev" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-3 w-3" /> Prev
                  </Button>
                  <Button id="bot-events-next" variant="outline" size="sm" className="h-7 gap-1 text-xs"
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
