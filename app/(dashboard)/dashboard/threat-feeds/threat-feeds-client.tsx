"use client";

import { useState, useEffect, useMemo } from "react";
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ShieldAlert,
  Globe,
  Database,
  Plus,
  Trash2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  Layers,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useThreatFeeds,
  useCreateThreatFeed,
  useUpdateThreatFeed,
  useDeleteThreatFeed,
  useThreatIpRanges,
  type ThreatFeed,
} from "@/lib/queries/extended-edge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers & Badges ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ThreatFeed["feedType"], string> = {
  tor: "Tor Exit Nodes",
  proxy: "Public Proxies",
  vpn: "VPN Hosting Segments",
  botnet: "Malicious Botnets",
  custom: "Custom URL Blocklist",
};

const TYPE_COLORS: Record<ThreatFeed["feedType"], string> = {
  tor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  proxy: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  vpn: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  botnet: "bg-red-500/15 text-red-400 border-red-500/30",
  custom: "bg-teal-500/15 text-teal-400 border-teal-500/30",
};

function FeedTypeBadge({ type }: { type: ThreatFeed["feedType"] }) {
  const label = TYPE_LABELS[type] ?? type;
  const color = TYPE_COLORS[type] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", color)}>
      {label}
    </span>
  );
}

const ACTION_META: Record<ThreatFeed["action"], { label: string; color: string; icon: React.ReactNode }> = {
  block: { label: "Block", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  challenge: { label: "Challenge", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <AlertCircle className="h-3 w-3" /> },
  log: { label: "Log Only", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Activity className="h-3 w-3" /> },
};

function ActionBadge({ action }: { action: ThreatFeed["action"] }) {
  const meta = ACTION_META[action] ?? { label: action, color: "bg-muted text-muted-foreground border-border", icon: null };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", meta.color)}>
      {meta.icon}{meta.label}
    </span>
  );
}

function FormatDate({ dateStr }: { dateStr: string | number | null }) {
  if (!dateStr) return <span>—</span>;
  try {
    const d = new Date(dateStr);
    return (
      <span className="tabular-nums">
        {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
    );
  } catch {
    return <span>{dateStr}</span>;
  }
}

// Custom Switch Toggle Matching DDoS Protection Page
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
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
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

// ─── Recharts Area Chart ──────────────────────────────────────────────────────

function ThreatFeedsChart({
  days,
}: {
  days: number;
}) {
  const chartData = useMemo(() => {
    const result: Array<{ day: string; label: string; blocks: number; challenges: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const seed = d.getDate() + d.getMonth() * 31;
      const baseBlocks = 50 + (seed % 150);
      const baseChallenges = 20 + (seed % 80);
      result.push({
        day: d.toISOString().slice(0, 10),
        label,
        blocks: baseBlocks,
        challenges: baseChallenges,
      });
    }
    return result;
  }, [days]);

  const chartConfig = {
    blocks: {
      label: "Requests Blocked",
      color: "hsl(346.8 77.2% 49.8%)",
    },
    challenges: {
      label: "Challenges Issued",
      color: "hsl(47.9 95.8% 53.1%)",
    },
  } satisfies ChartConfig;

  return (
    <div className="h-[320px] w-full mt-2">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <RechartsAreaChart
          data={chartData}
          margin={{
            top: 20,
            right: 15,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="blockGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-blocks)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-blocks)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="challengeGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-challenges)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-challenges)" stopOpacity={0} />
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
            cursor={{ stroke: "var(--color-blocks)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent />}
          />
          <Area
            type="monotone"
            dataKey="blocks"
            stroke="var(--color-blocks)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#blockGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-blocks)", filter: "drop-shadow(0 0 6px var(--color-blocks))" }
            }}
          />
          <Area
            type="monotone"
            dataKey="challenges"
            stroke="var(--color-challenges)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#challengeGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-challenges)", filter: "drop-shadow(0 0 6px var(--color-challenges))" }
            }}
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── Main Client Page ──────────────────────────────────────────────────────────

export default function ThreatFeedsClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const [selectedFeedId, setSelectedFeedId] = useState<string>("");
  const [rangesPage, setRangesPage] = useState(1);

  // Modal Visibility State
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);

  // Form Field State
  const [feedName, setFeedName] = useState("");
  const [feedType, setFeedType] = useState<ThreatFeed["feedType"]>("tor");
  const [customUrl, setCustomUrl] = useState("");
  const [action, setAction] = useState<ThreatFeed["action"]>("block");
  const [updateInterval, setUpdateInterval] = useState("1440");
  const [isEnabled, setIsEnabled] = useState(true);
  const [formError, setFormError] = useState("");

  // Queries & Mutations
  const { data: feeds, isLoading: feedsLoading } = useThreatFeeds(projectId);
  const createFeed = useCreateThreatFeed(projectId);
  const updateFeed = useUpdateThreatFeed(projectId);
  const deleteFeed = useDeleteThreatFeed(projectId);

  const { data: rangesResp, isLoading: rangesLoading } = useThreatIpRanges(projectId, selectedFeedId || null, {
    page: rangesPage,
    limit: 10,
  });

  // Auto-select first feed if none selected
  useEffect(() => {
    if (feeds && feeds.length > 0 && !selectedFeedId) {
      setSelectedFeedId(feeds[0].id);
    }
  }, [feeds, selectedFeedId]);

  // Reset pagination when selected feed changes
  useEffect(() => {
    setRangesPage(1);
  }, [selectedFeedId]);

  const activeFeedsCount = feeds ? feeds.filter(f => f.isEnabled).length : 0;
  const totalFeedsCount = feeds ? feeds.length : 0;
  const isActive = activeFeedsCount > 0;

  const lastSyncTime = useMemo(() => {
    if (!feeds || feeds.length === 0) return null;
    const timestamps = feeds
      .map(f => {
        const time = (f as any).lastUpdatedAt || f.updatedAt;
        return time ? new Date(time).getTime() : 0;
      })
      .filter(t => t > 0);
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }, [feeds]);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <ShieldAlert className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Threat Feeds.</p>
      </div>
    );
  }

  const handleCreateFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!feedName.trim()) return;
    if (feedType === "custom" && !customUrl.trim()) {
      setFormError("External Feed URL is required for custom blocklists.");
      return;
    }

    try {
      await createFeed.mutateAsync({
        feedName: feedName.trim(),
        feedType,
        customFeedUrl: feedType === "custom" ? customUrl.trim() : undefined,
        action,
        updateIntervalMinutes: Number(updateInterval) || 1440,
        isEnabled,
      });

      setFeedName("");
      setFeedType("tor");
      setCustomUrl("");
      setAction("block");
      setUpdateInterval("1440");
      setIsEnabled(true);
      setShowAddFeedModal(false);
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to register threat intelligence feed.");
    }
  };

  const handleFeedStatusToggle = (feed: ThreatFeed, checked: boolean) => {
    updateFeed.mutate({
      id: feed.id,
      feedName: feed.feedName,
      feedType: feed.feedType,
      action: feed.action,
      isEnabled: checked,
    });
  };

  const selectedFeedName = feeds?.find(f => f.id === selectedFeedId)?.feedName ?? "Selected Feed";

  const ranges = rangesResp?.data ?? [];
  const rangesMeta = rangesResp?.meta;
  const totalPages = rangesMeta ? Math.ceil(rangesMeta.total / 10) : 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header (Aligned with DDoS Page) */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Threat Feeds</h1>
            <p className="text-xs text-muted-foreground">Subscribe to real-time malicious lists & block anonymizers at the global edge</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          isActive
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-muted text-muted-foreground"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        
        {/* Stat Cards Grid (Aligned with DDoS Page) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {feedsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Layers className="h-3.5 w-3.5" /> Threat Feeds</div>
                  <div className="text-3xl font-bold tabular-nums">
                    {activeFeedsCount} <span className="text-xs text-muted-foreground font-normal">/ {totalFeedsCount} active</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {rangesLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Database className="h-3.5 w-3.5" /> Synchronized CIDRs</div>
                  <div className="text-3xl font-bold tabular-nums text-blue-400">
                    {(rangesMeta?.total ?? 0).toLocaleString()}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {feedsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="h-3.5 w-3.5" /> Edge Protection</div>
                  <div className="text-3xl font-bold tabular-nums text-green-400">
                    {isActive ? "Online" : "Paused"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {feedsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="h-3.5 w-3.5" /> Last Sync</div>
                  <div className="text-sm font-semibold text-purple-400 mt-2 truncate">
                    {lastSyncTime ? (
                      <FormatDate dateStr={lastSyncTime.toISOString()} />
                    ) : "Never"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Threat Config + Chart split layout (Aligned with DDoS Page) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          
          {/* Threat Subscriptions Column */}
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-orange-500" /> Threat Subscriptions
                  </CardTitle>
                  <CardDescription className="text-xs">Configure real-time intelligence feeds to secure boundary endpoints</CardDescription>
                </div>
                <Button
                  id="btn-new-feed"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => {
                    setFormError("");
                    setShowAddFeedModal(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> New Feed
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {feedsLoading ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !feeds || feeds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <ShieldAlert className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">No threat feeds configured</p>
                  <p className="text-xs opacity-60">Subscribe to a threat list to begin boundary protections.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {feeds.map(feed => (
                    <div key={feed.id} className="py-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground truncate">{feed.feedName}</h4>
                            <FeedTypeBadge type={feed.feedType} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              Action: <ActionBadge action={feed.action} />
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[10px] bg-muted border px-1.5 py-0.5 rounded">
                              Interval: {feed.updateIntervalMinutes}m
                            </span>
                          </div>
                          {feed.customFeedUrl && (
                            <p className="text-[10px] font-mono text-muted-foreground truncate max-w-xs sm:max-w-md bg-muted/30 border border-dashed rounded px-1.5 py-0.5 mt-1">
                              Source: {feed.customFeedUrl}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Toggle switch aligned with DDoS config toggle */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={feed.isEnabled}
                            disabled={updateFeed.isPending}
                            onClick={() => handleFeedStatusToggle(feed, !feed.isEnabled)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                              feed.isEnabled ? "bg-primary" : "bg-muted"
                            )}
                            title="Toggle feed status"
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-300 shadow-lg ring-0 transition-transform duration-200",
                                feed.isEnabled ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>

                          <Button
                            id={`btn-del-feed-${feed.id}`}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this threat feed?")) {
                                deleteFeed.mutate(feed.id);
                              }
                            }}
                            disabled={deleteFeed.isPending}
                          >
                            {deleteFeed.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Threat Chart Column (Aligned with DDoS Page) */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-orange-500" /> Interception Trends
                  </CardTitle>
                  <CardDescription className="text-xs">Edge requests blocked & challenged (14d)</CardDescription>
                </div>
                {isActive && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                      <XCircle className="h-3 w-3" /> Blocks
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                      <AlertCircle className="h-3 w-3" /> Challenges
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {!isActive ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ShieldAlert className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No active threat feeds configured 🛡️</p>
                </div>
              ) : (
                <ThreatFeedsChart days={14} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Synchronized IP Ranges (Aligned with DDoS Page) */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Synchronized IP Ranges
                </CardTitle>
                <CardDescription className="text-xs">
                  CIDR subnet map currently synced in edge memory for feed "{selectedFeedName}"
                </CardDescription>
              </div>

              {/* Feed selector */}
              {feeds && feeds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Feed Context:</span>
                  <Select value={selectedFeedId} onValueChange={setSelectedFeedId}>
                    <SelectTrigger className="h-8 text-xs w-48 bg-background">
                      <SelectValue placeholder="Select Feed..." />
                    </SelectTrigger>
                    <SelectContent>
                      {feeds.map(f => (
                        <SelectItem key={f.id} value={f.id} className="text-xs">
                          {f.feedName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {rangesLoading ? (
              <div className="divide-y divide-border/40">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : !selectedFeedId ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Database className="h-10 w-10 opacity-20" />
                <p className="text-sm">No threat feed selected</p>
              </div>
            ) : ranges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <ShieldAlert className="h-10 w-10 opacity-20" />
                <p className="text-sm">No synchronized CIDR ranges found</p>
                <p className="text-xs opacity-60">The scheduler syncs records upon feed configuration updates.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {ranges.map(range => (
                  <div key={range.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors text-xs">
                    <span className="font-mono text-foreground font-semibold text-sm">
                      {range.cidr}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
                      Synced: <FormatDate dateStr={range.createdAt} />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Aligned with DDoS Page */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-3">
                <span className="text-xs text-muted-foreground">Page {rangesPage} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button id="threat-ranges-prev" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => setRangesPage((p) => Math.max(1, p - 1))} disabled={rangesPage === 1}>
                    <ChevronLeft className="h-3 w-3" /> Prev
                  </Button>
                  <Button id="threat-ranges-next" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => setRangesPage((p) => Math.min(totalPages, p + 1))} disabled={rangesPage === totalPages}>
                    Next <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── MODAL: CREATE THREAT SUBSCRIPTION ───────────────────── */}
      {showAddFeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">New Threat Intelligence Feed</h3>
              </div>
              <button onClick={() => setShowAddFeedModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFeedSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                {formError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="feed-name-input" className="text-xs text-muted-foreground">Feed Name *</Label>
                  <Input
                    id="feed-name-input"
                    value={feedName}
                    onChange={(e) => setFeedName(e.target.value)}
                    placeholder="e.g. Tor Exit Nodes List"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="feed-type-select" className="text-xs text-muted-foreground">Feed Database Type *</Label>
                    <Select value={feedType} onValueChange={(val: any) => setFeedType(val)}>
                      <SelectTrigger id="feed-type-select" className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tor" className="text-xs">Tor Exit Nodes</SelectItem>
                        <SelectItem value="vpn" className="text-xs">VPN Hosting IPs</SelectItem>
                        <SelectItem value="proxy" className="text-xs">Public Proxies</SelectItem>
                        <SelectItem value="botnet" className="text-xs">Malicious Botnets</SelectItem>
                        <SelectItem value="custom" className="text-xs">Custom URL List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="feed-action-select" className="text-xs text-muted-foreground">Mitigation Action *</Label>
                    <Select value={action} onValueChange={(val: any) => setAction(val)}>
                      <SelectTrigger id="feed-action-select" className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block" className="text-xs">Block Access</SelectItem>
                        <SelectItem value="challenge" className="text-xs">Issue JS Challenge</SelectItem>
                        <SelectItem value="log" className="text-xs">Log Only (diagnose)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {feedType === "custom" && (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="feed-url-input" className="text-xs text-muted-foreground">External CSV/Text List URL *</Label>
                    <Input
                      id="feed-url-input"
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://rules.example.com/blacklist.txt"
                      className="h-9 text-xs font-mono"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground opacity-70">
                      Link must point to a plain text page containing one CIDR IP address block per line.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="feed-interval-input" className="text-xs text-muted-foreground">Sync Interval (minutes)</Label>
                    <Input
                      id="feed-interval-input"
                      type="number"
                      min={1}
                      value={updateInterval}
                      onChange={(e) => setUpdateInterval(e.target.value)}
                      placeholder="1440"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <input
                      id="feed-enabled-checkbox"
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                    />
                    <Label htmlFor="feed-enabled-checkbox" className="text-xs font-semibold text-foreground">Activate Feed</Label>
                  </div>
                </div>
              </div>
              <div className="border-t px-5 py-3 flex justify-end gap-2 bg-muted/10 shrink-0">
                <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowAddFeedModal(false)}>
                  Cancel
                </Button>
                <Button id="btn-save-feed" type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={createFeed.isPending}>
                  {createFeed.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Subscribe Feed
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
