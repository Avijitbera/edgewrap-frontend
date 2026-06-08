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
  EyeOff,
  Activity,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Globe,
  Lock,
  Key,
  CreditCard,
  Fingerprint,
  ShieldAlert,
  FileText,
  HelpCircle,
  Shield,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import { useSecretShieldStats, useSecretShieldEvents } from "@/lib/queries/security";
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

// ─── Metadata Definitions ───────────────────────────────────────────────────

const SECRET_TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  api_key: { label: "API Key", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <Key className="h-3 w-3" /> },
  bearer_token: { label: "Bearer Token", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Lock className="h-3 w-3" /> },
  jwt: { label: "JWT Token", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", icon: <Lock className="h-3 w-3" /> },
  aws_key: { label: "AWS Key", color: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: <Key className="h-3 w-3" /> },
  stripe_key: { label: "Stripe Key", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: <Key className="h-3 w-3" /> },
  github_token: { label: "GitHub Token", color: "bg-slate-400/15 text-slate-300 border-slate-400/30", icon: <Key className="h-3 w-3" /> },
  private_key: { label: "Private Key", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <Lock className="h-3 w-3" /> },
  password: { label: "Password Field", color: "bg-pink-500/15 text-pink-400 border-pink-500/30", icon: <Lock className="h-3 w-3" /> },
  credit_card: { label: "Credit Card", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CreditCard className="h-3 w-3" /> },
  ssn: { label: "SSN", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", icon: <Fingerprint className="h-3 w-3" /> },
  custom_pattern: { label: "Custom Pattern", color: "bg-rose-500/15 text-rose-400 border-rose-500/30", icon: <ShieldAlert className="h-3 w-3" /> },
};

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  masked: { label: "Masked", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: <EyeOff className="h-3 w-3" /> },
  blocked: { label: "Blocked", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  logged: { label: "Logged Only", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
};

const LOCATION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  header: { label: "Header", color: "bg-violet-500/15 text-violet-400 border-violet-500/30", icon: <FileText className="h-3 w-3" /> },
  query_param: { label: "Query Parameter", color: "bg-sky-500/15 text-sky-400 border-sky-500/30", icon: <Globe className="h-3 w-3" /> },
  body: { label: "Request Body", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <FileText className="h-3 w-3" /> },
  path: { label: "Request Path", color: "bg-teal-500/15 text-teal-400 border-teal-500/30", icon: <Globe className="h-3 w-3" /> },
  response: { label: "Response Body", color: "bg-pink-500/15 text-pink-400 border-pink-500/30", icon: <FileText className="h-3 w-3" /> },
};

function SecretTypeBadge({ type }: { type: string }) {
  const meta = SECRET_TYPE_META[type] ?? {
    label: type.replace("_", " "),
    color: "bg-muted text-muted-foreground border-border",
    icon: <HelpCircle className="h-3 w-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider", meta.color)}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] ?? {
    label: action,
    color: "bg-muted text-muted-foreground border-border",
    icon: <HelpCircle className="h-3 w-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", meta.color)}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function LocationBadge({ location }: { location: string }) {
  const meta = LOCATION_META[location] ?? {
    label: location,
    color: "bg-muted text-muted-foreground border-border",
    icon: <HelpCircle className="h-3 w-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", meta.color)}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ─── Secret Shield Trend Chart ────────────────────────────────────────────────

function SecretShieldChart({
  data,
  days,
}: {
  data: Array<{ day: string; total: number }>;
  days: number;
}) {
  const filledData = useMemo(() => {
    const map = new Map(data.map((d) => [d.day, d.total]));
    const result: Array<{ day: string; label: string; secrets: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ day: key, label, secrets: map.get(key) ?? 0 });
    }
    return result;
  }, [data, days]);

  const chartConfig = {
    secrets: {
      label: "Secrets Exposed",
      color: "hsl(346.8 77.2% 49.8%)", // sleek crimson color
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
            <linearGradient id="secretGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-secrets)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-secrets)" stopOpacity={0} />
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
            cursor={{ stroke: "var(--color-secrets)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Area
            type="monotone"
            dataKey="secrets"
            stroke="var(--color-secrets)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#secretGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-secrets)", filter: "drop-shadow(0 0 6px var(--color-secrets))" }
            }}
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function SecretShieldPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: stats, isLoading: statsLoading } = useSecretShieldStats(projectId, 14);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const { data: eventsResp, isLoading: eventsLoading } = useSecretShieldEvents(projectId, {
    secretType: filterType || undefined,
    action: filterAction || undefined,
    page,
    limit: 10,
  });

  const events = eventsResp?.data ?? [];
  const eventsMeta = eventsResp?.meta;
  const totalPages = eventsMeta ? Math.ceil(eventsMeta.total / 10) : 0;

  // Stat computations
  const totalSecrets = stats?.total ?? 0;
  const blockedCount = stats?.actionBreakdown?.find((a) => a.action === "blocked")?.total ?? 0;
  const maskedCount = stats?.actionBreakdown?.find((a) => a.action === "masked")?.total ?? 0;
  const topSecretType = stats?.secretTypeBreakdown
    ? [...stats.secretTypeBreakdown].sort((a, b) => b.total - a.total)[0]
    : undefined;

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Shield className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Secret Shield security logs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
            <EyeOff className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Secret Shield</h1>
            <p className="text-xs text-muted-foreground">Real-time credentials, tokens, and PII exposure prevention</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Always active/enabled at proxy layer */}
          <div className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Shield Protection Active
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Detected Secrets
                  </div>
                  <div className="text-3xl font-bold tabular-nums">{totalSecrets.toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <XCircle className="h-3.5 w-3.5 text-red-400" /> Blocked Requests
                  </div>
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
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <EyeOff className="h-3.5 w-3.5 text-green-400" /> Masked in Payload
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-green-400">{maskedCount.toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {statsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-purple-400" /> Top Threat Type
                  </div>
                  {topSecretType ? (
                    <div className="mt-1">
                      <SecretTypeBadge type={topSecretType.secretType} />
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">{topSecretType.total.toLocaleString()} detections</p>
                    </div>
                  ) : <div className="text-2xl font-bold text-muted-foreground">—</div>}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts & Breakdowns Section */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Daily Trend Chart */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-rose-400" /> Threat Exposure Trend
              </CardTitle>
              <CardDescription className="text-xs">Exposed secrets intercepted per calendar day (last 14 days)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {statsLoading ? (
                <div className="flex flex-1 items-end gap-1">
                  {Array.from({ length: 14 }).map((_, i) => <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />)}
                </div>
              ) : totalSecrets === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-10 w-10 opacity-30 text-green-400" />
                  <p className="text-sm font-medium">No secrets exposed in the last 14 days</p>
                  <p className="text-xs opacity-60">Clean logs, your API parameters look safe!</p>
                </div>
              ) : (
                <SecretShieldChart data={stats?.dailyTrend ?? []} days={14} />
              )}
            </CardContent>
          </Card>

          {/* Breakdown Card */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-rose-400" /> Classification Breakdown
              </CardTitle>
              <CardDescription className="text-xs">Exposition statistics categorized by secret type and source location</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-6 flex-1 overflow-y-auto">
              {statsLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : totalSecrets === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <EyeOff className="h-8 w-8 opacity-20" />
                  <p className="text-sm">No data classification records available</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Secret Types Distribution */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3">Secret Types</h4>
                    <div className="space-y-2.5">
                      {[...(stats?.secretTypeBreakdown ?? [])]
                        .sort((a, b) => b.total - a.total)
                        .map((item) => {
                          const pct = totalSecrets > 0 ? (item.total / totalSecrets) * 100 : 0;
                          return (
                            <div key={item.secretType} className="flex items-center gap-3">
                              <div className="w-32 shrink-0"><SecretTypeBadge type={item.secretType} /></div>
                              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-10 text-right font-mono text-xs text-muted-foreground shrink-0">{item.total}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Locations Distribution */}
                  <div className="border-t pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3">Payload Locations</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(stats?.locationBreakdown ?? []).map((loc) => {
                        const pct = totalSecrets > 0 ? (loc.total / totalSecrets) * 100 : 0;
                        return (
                          <div key={loc.location} className="flex flex-col gap-1 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center justify-between">
                              <LocationBadge location={loc.location} />
                              <span className="font-mono text-xs text-foreground font-semibold">{loc.total}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Secrets Feed */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-rose-400" /> Exposed Secret Registry
                </CardTitle>
                <CardDescription className="text-xs">Live directory of intercepted secret incidents, refreshed automatically</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterType || "__all__"} onValueChange={(v) => { setFilterType(v === "__all__" ? "" : v); setPage(1); }}>
                  <SelectTrigger id="secret-filter-type" className="h-7 text-xs w-36">
                    <SelectValue placeholder="All secret types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="text-xs">All secret types</SelectItem>
                    {Object.entries(SECRET_TYPE_META).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAction || "__all__"} onValueChange={(v) => { setFilterAction(v === "__all__" ? "" : v); setPage(1); }}>
                  <SelectTrigger id="secret-filter-action" className="h-7 text-xs w-32">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="text-xs">All actions</SelectItem>
                    {Object.entries(ACTION_META).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
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
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <ShieldCheck className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No secret incidents found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-muted/10 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 w-28">Timestamp</th>
                      <th className="px-4 py-3 w-40">Secret Type</th>
                      <th className="px-4 py-3 w-28">Location</th>
                      <th className="px-4 py-3 w-28">Action</th>
                      <th className="px-4 py-3">Masked Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs font-mono">
                    {events.map((ev) => {
                      const ts = new Date(typeof ev.createdAt === "number" ? ev.createdAt * 1000 : ev.createdAt);
                      return (
                        <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {ts.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <SecretTypeBadge type={ev.secretType} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <LocationBadge location={ev.location} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <ActionBadge action={ev.action} />
                          </td>
                          <td className="px-4 py-3 text-rose-300 font-semibold break-all select-all selection:bg-rose-500/30 selection:text-rose-100">
                            {ev.maskedValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/5">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {eventsMeta?.total.toLocaleString()} total incidents
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    id="secret-events-prev"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  <Button
                    id="secret-events-next"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
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
