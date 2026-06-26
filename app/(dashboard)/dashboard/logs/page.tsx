"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Globe,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Database,
  Activity,
  Server,
  ArrowRight,
  Lock,
  Trash2,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useRequestLogs,
  useRequestLogDetails,
  useSoftDeleteLog,
  type RequestLog,
} from "@/lib/queries/replay";
import {
  useOrigins,
  useOriginHealthLogs,
  type OriginHealthLog,
} from "@/lib/queries/origins";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const STATUS_CLASSES: Record<number, string> = {
  2: "bg-green-500/15 text-green-400 border-green-500/30",
  3: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  4: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  5: "bg-red-500/15 text-red-400 border-red-500/30",
};

function StatusBadge({ code }: { code: number | null }) {
  if (!code) return <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">—</span>;
  const group = Math.floor(code / 100);
  const colorClass = STATUS_CLASSES[group] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold", colorClass)}>
      {code}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    POST: "bg-green-500/10 text-green-400 border-green-500/20",
    PUT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={cn("rounded border px-1.5 py-0.5 font-mono font-bold text-[10px]", colors[method.toUpperCase()] ?? "bg-muted text-muted-foreground border-border")}>
      {method}
    </span>
  );
}

function FormatDate({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return <span>—</span>;
  try {
    const d = new Date(dateStr);
    return (
      <span className="tabular-nums">
        {d.toLocaleTimeString()} {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
    );
  } catch {
    return <span>{dateStr}</span>;
  }
}

function FormatSize({ bytes }: { bytes: number | null }) {
  if (bytes === null || bytes === undefined) return <span className="text-muted-foreground/55">0 B</span>;
  if (bytes < 1024) return <span className="tabular-nums">{bytes} B</span>;
  return <span className="tabular-nums">{(bytes / 1024).toFixed(1)} KB</span>;
}

function FormatDuration({ ms }: { ms: number | null }) {
  if (ms === null || ms === undefined) return <span className="text-muted-foreground/55">—</span>;
  return <span className="tabular-nums font-mono text-primary font-medium">{ms}ms</span>;
}

function CodeBlock({ code, title }: { code: string | null | undefined; title?: string }) {
  if (!code) return <p className="text-[11px] text-muted-foreground italic p-2 border rounded border-dashed bg-muted/10">No body captured</p>;
  let formatted = code;
  try {
    const parsed = JSON.parse(code);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // raw text
  }

  return (
    <div className="space-y-1">
      {title && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>}
      <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[10px] leading-relaxed text-foreground/80 max-h-[250px] scrollbar-thin">
        <code>{formatted}</code>
      </pre>
    </div>
  );
}

function HeadersList({ headersStr, title }: { headersStr: string | null | undefined; title?: string }) {
  if (!headersStr) return <p className="text-[11px] text-muted-foreground italic p-2 border rounded border-dashed bg-muted/10">No headers captured</p>;
  let headers: Record<string, string> = {};
  try {
    headers = JSON.parse(headersStr);
  } catch {
    return <pre className="text-[10px] font-mono text-destructive">Failed to parse headers</pre>;
  }

  return (
    <div className="space-y-1">
      {title && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>}
      <div className="max-h-[200px] overflow-y-auto rounded-lg border bg-muted/30 p-2.5 font-mono text-[10px] space-y-1.5 scrollbar-thin">
        {Object.entries(headers).map(([key, val]) => (
          <div key={key} className="flex gap-2 break-all border-b border-border/30 pb-1 last:border-0 last:pb-0">
            <span className="text-primary font-medium shrink-0">{key}:</span>
            <span className="text-muted-foreground">{val}</span>
          </div>
        ))}
        {Object.keys(headers).length === 0 && (
          <p className="text-muted-foreground italic text-center py-2">Empty headers</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LogsPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const [activeTab, setActiveTab] = useState<"requests" | "health">("requests");
  const [logsPage, setLogsPage] = useState(1);
  const [healthPage, setHealthPage] = useState(1);

  // Filters for request logs
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cacheFilter, setCacheFilter] = useState("all");
  // Date range: "1d" | "7d" | "30d" | "90d"
  const [dateRange, setDateRange] = useState("7d");

  // State for request details viewer modal
  const [viewingLogId, setViewingLogId] = useState<string | null>(null);

  // State for health check details viewer modal
  const [viewingHealthLog, setViewingHealthLog] = useState<OriginHealthLog | null>(null);

  // Selected origin for health checks logs
  const [selectedOriginId, setSelectedOriginId] = useState<string>("");

  // Queries
  const DATE_RANGE_DAYS: Record<string, number> = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 };
  const logsFrom = new Date(Date.now() - (DATE_RANGE_DAYS[dateRange] ?? 7) * 24 * 60 * 60 * 1000).toISOString();
  const { data: logsData, isLoading: logsLoading } = useRequestLogs(projectId, {
    page: logsPage,
    limit: 20,
    method: methodFilter,
    statusCode: statusFilter !== "all" ? Number(statusFilter) : undefined,
    cacheStatus: cacheFilter,
    from: logsFrom,
  });

  const { data: origins } = useOrigins(projectId);
  const softDelete = useSoftDeleteLog(projectId);

  // Auto-select first origin when loaded
  useEffect(() => {
    if (origins && origins.length > 0 && !selectedOriginId) {
      setSelectedOriginId(origins[0].id);
    }
  }, [origins, selectedOriginId]);

  const {
    data: healthLogsData,
    isLoading: healthLogsLoading,
    error: healthLogsError,
    isError: healthLogsIsError,
  } = useOriginHealthLogs(
    projectId,
    selectedOriginId || undefined,
    {
      page: healthPage,
      limit: 10,
    }
  );

  useEffect(() => {
    if (healthLogsError) {
      console.error("Failed to load origin health logs error:", healthLogsError);
    }
  }, [healthLogsError]);

  const {
    data: viewingLogDetails,
    isLoading: viewingLogLoading,
    error: viewingLogError,
    isError: viewingLogIsError,
  } = useRequestLogDetails(projectId, viewingLogId);

  useEffect(() => {
    if (viewingLogError) {
      console.error("Failed to load request details error:", viewingLogError);
    }
  }, [viewingLogError]);

  // Reset pagination when filters change
  useEffect(() => {
    setLogsPage(1);
  }, [methodFilter, statusFilter, cacheFilter, dateRange]);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Database className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Logs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Logs</h1>
            <p className="text-xs text-muted-foreground">Detailed gateway proxy request logs & background health check timeline</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── Main Tab Navigation ───────────────────────── */}
        <div className="space-y-4">
          <div className="flex border-b border-border pb-px gap-4">
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-colors relative",
                activeTab === "requests" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                Request Logs
              </div>
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-colors relative",
                activeTab === "health" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Server className="h-4 w-4" />
                Origin Health Checks
              </div>
            </button>
          </div>

          {/* ── TAB CONTENT: REQUEST LOGS ─────────── */}
          {activeTab === "requests" && (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Incoming Proxy Traffic</CardTitle>
                    <CardDescription className="text-xs">Browse all incoming client request logs flowing through the API gateway.</CardDescription>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select value={dateRange} onValueChange={v => { setDateRange(v); setLogsPage(1); }}>
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue placeholder="Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d" className="text-xs">Last 24h</SelectItem>
                        <SelectItem value="7d" className="text-xs">Last 7 days</SelectItem>
                        <SelectItem value="30d" className="text-xs">Last 30 days</SelectItem>
                        <SelectItem value="90d" className="text-xs">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Methods</SelectItem>
                        {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
                          <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                        <SelectItem value="200" className="text-xs">2xx Success</SelectItem>
                        <SelectItem value="300" className="text-xs">3xx Redirect</SelectItem>
                        <SelectItem value="400" className="text-xs">4xx Client Error</SelectItem>
                        <SelectItem value="500" className="text-xs">5xx Server Error</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={cacheFilter} onValueChange={setCacheFilter}>
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue placeholder="Cache" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Cache</SelectItem>
                        {["HIT", "MISS", "BYPASS", "STALE"].map(c => (
                          <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !logsData || logsData.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <Activity className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No request logs found</p>
                    <p className="text-xs opacity-60">Send traffic to your proxy URL to start seeing gateway activity.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Retention banner — shown when any row is expired */}
                    {logsData.data.some(l => l.retentionExpired) && (
                      <div className="flex items-start gap-3 border-b border-amber-500/20 bg-amber-500/5 px-4 py-3">
                        <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-semibold text-amber-400">Some logs are outside your plan's visibility window.</span>
                          <span className="ml-1 text-muted-foreground">Logs are never deleted — upgrade your plan to unlock full history access.</span>
                        </div>
                      </div>
                    )}
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Method</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Path</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Latency</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Cache</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">WAF</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsData.data.map(log => (
                          <tr
                            key={log.id}
                            className={cn(
                              "border-b transition-colors",
                              log.retentionExpired
                                ? "opacity-50 bg-muted/5"
                                : "hover:bg-muted/10 cursor-pointer"
                            )}
                            onClick={() => !log.retentionExpired && setViewingLogId(log.id)}
                          >
                            <td className="px-4 py-3 text-muted-foreground font-mono">
                              <FormatDate dateStr={log.createdAt} />
                            </td>
                            <td className="px-4 py-3 shrink-0">
                              <MethodBadge method={log.method} />
                            </td>
                            <td className="px-4 py-3 font-mono text-foreground break-all max-w-[200px] sm:max-w-xs md:max-w-md">
                              {log.path}
                              {log.queryString && <span className="text-muted-foreground">?{log.queryString}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge code={log.statusCode} />
                            </td>
                            <td className="px-4 py-3">
                              <FormatDuration ms={log.durationMs} />
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border",
                                log.cacheStatus === "HIT" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                log.cacheStatus === "MISS" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              )}>
                                {log.cacheStatus || "DYNAMIC"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border",
                                log.wafAction === "allowed" || !log.wafAction ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                log.wafAction === "blocked" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              )}>
                                {log.wafAction || "bypass"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {log.retentionExpired ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/70 font-medium">
                                      <Lock className="h-3 w-3" /> Locked
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-500/5"
                                      title="Dismiss from view (data is retained)"
                                      disabled={softDelete.isPending}
                                      onClick={(e) => { e.stopPropagation(); softDelete.mutate(log.id); }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      id={`view-btn-${log.id}`}
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-[10px] font-semibold gap-1 hover:bg-muted"
                                      onClick={(e) => { e.stopPropagation(); setViewingLogId(log.id); }}
                                    >
                                      <Eye className="h-3 w-3" />
                                      Details
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-500/5"
                                      title="Dismiss from view (data is retained)"
                                      disabled={softDelete.isPending}
                                      onClick={(e) => { e.stopPropagation(); softDelete.mutate(log.id); }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {logsData && logsData.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{logsPage}</span> of <span className="font-semibold text-foreground">{logsData.meta.totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                        disabled={logsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setLogsPage(p => Math.min(logsData.meta.totalPages, p + 1))}
                        disabled={logsPage === logsData.meta.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── TAB CONTENT: HEALTH CHECK LOGS ─────────── */}
          {activeTab === "health" && (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Background Health Checks</CardTitle>
                    <CardDescription className="text-xs">Inspect logs recorded by the background health monitor running at the edge.</CardDescription>
                  </div>

                  {/* Origin Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Origin:</span>
                    <Select value={selectedOriginId} onValueChange={(val) => {
                      setSelectedOriginId(val);
                      setHealthPage(1);
                    }}>
                      <SelectTrigger className="h-8 text-xs w-48">
                        <SelectValue placeholder="Select Origin" />
                      </SelectTrigger>
                      <SelectContent>
                        {origins?.map(o => (
                          <SelectItem key={o.id} value={o.id} className="text-xs">
                            {o.label} ({o.url})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {healthLogsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !selectedOriginId ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <Server className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No Origin Selected</p>
                    <p className="text-xs opacity-60">Add a project origin to start checking health logs.</p>
                  </div>
                ) : !healthLogsData || healthLogsData.data.length === 0 || healthLogsIsError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <Activity className="h-10 w-10 opacity-20" />
                    {healthLogsIsError ? (
                      <>
                        <p className="text-sm font-medium text-destructive">Failed to load health checks logs</p>
                        {healthLogsError && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {healthLogsError instanceof Error ? healthLogsError.message : String(healthLogsError)}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">No health checks logs found</p>
                        <p className="text-xs opacity-60">The background worker will log results once the origin becomes active.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Checked At</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Target URL</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Health Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Latency</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">HTTP Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Error Details</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {healthLogsData.data.map(hlog => (
                          <tr key={hlog.id} className="border-b hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setViewingHealthLog(hlog)}>
                            <td className="px-4 py-3 text-muted-foreground font-mono">
                              <FormatDate dateStr={hlog.createdAt} />
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground break-all max-w-xs">
                              {hlog.url}
                            </td>
                            <td className="px-4 py-3">
                              {hlog.isHealthy ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">
                                  <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                                  Healthy
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">
                                  <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                                  Unhealthy
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <FormatDuration ms={hlog.latencyMs} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge code={hlog.statusCode} />
                            </td>
                            <td className="px-4 py-3 text-red-400/90 font-mono text-[11px] max-w-xs truncate">
                              {hlog.error || <span className="text-muted-foreground/40">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                id={`view-health-btn-${hlog.id}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] font-semibold gap-1 hover:bg-muted"
                                onClick={() => setViewingHealthLog(hlog)}
                              >
                                <Eye className="h-3 w-3" />
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {healthLogsData && healthLogsData.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{healthPage}</span> of <span className="font-semibold text-foreground">{healthLogsData.meta.totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setHealthPage(p => Math.max(1, p - 1))}
                        disabled={healthPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setHealthPage(p => Math.min(healthLogsData.meta.totalPages, p + 1))}
                        disabled={healthPage === healthLogsData.meta.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── MODAL: VIEW DETAILS ──────────────────────────────── */}
      {viewingLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4 shrink-0 bg-muted/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Captured Request Details</h2>
                  <p className="text-xs text-muted-foreground">Full inspection of proxy request/response payload and edge telemetry.</p>
                </div>
              </div>
              <button
                onClick={() => setViewingLogId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {viewingLogLoading ? (
                <div className="space-y-4 py-8">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !viewingLogDetails || viewingLogIsError ? (
                <div className="text-center py-8 text-destructive text-xs space-y-2">
                  <p>Failed to load request details</p>
                  {viewingLogError && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {viewingLogError instanceof Error ? viewingLogError.message : String(viewingLogError)}
                    </p>
                  )}
                </div>
              ) : viewingLogDetails.retentionExpired ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Lock className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-400">Log outside visibility window</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      This log exists in our systems but is outside your plan's visibility window.
                      Upgrade your plan to unlock full history access including request/response bodies.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-muted/10 p-4 text-xs font-mono text-left space-y-1.5 w-full max-w-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Method:</span><MethodBadge method={viewingLogDetails.method} /></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Path:</span><span className="text-foreground truncate max-w-[200px]">{viewingLogDetails.path}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><StatusBadge code={viewingLogDetails.statusCode} /></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><FormatDate dateStr={viewingLogDetails.createdAt} /></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border bg-muted/20 p-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Method & Path</span>
                      <div className="flex items-center gap-1.5">
                        <MethodBadge method={viewingLogDetails.method} />
                        <span className="font-mono text-xs font-bold text-foreground break-all">{viewingLogDetails.path}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Status Code</span>
                      <div>
                        <StatusBadge code={viewingLogDetails.statusCode} />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Latency</span>
                      <div className="text-xs font-mono font-medium text-primary">
                        <FormatDuration ms={viewingLogDetails.durationMs} />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Timestamp</span>
                      <div className="text-xs text-muted-foreground font-mono">
                        <FormatDate dateStr={viewingLogDetails.createdAt} />
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Routing Details */}
                    <div className="rounded-xl border border-border/40 p-4 space-y-3 bg-muted/5">
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        Client & Routing
                      </h3>
                      <div className="text-xs space-y-2 font-mono">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IP Address:</span>
                          <span className="text-foreground font-semibold">{viewingLogDetails.clientIp || "unknown"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Country / Colo:</span>
                          <span className="text-foreground font-semibold">
                            {viewingLogDetails.country || "unknown"} ({viewingLogDetails.cfColo || "unknown"})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Origin:</span>
                          <span className="text-foreground font-semibold truncate max-w-[200px]" title={viewingLogDetails.originUrl || ""}>
                            {viewingLogDetails.originUrl || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edge Protections & Diagnostics */}
                    <div className="rounded-xl border border-border/40 p-4 space-y-3 bg-muted/5">
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        Edge Security & Performance
                      </h3>
                      <div className="text-xs space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs font-medium">Cache Status:</span>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold text-[10px] border",
                            viewingLogDetails.cacheStatus === "HIT" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            viewingLogDetails.cacheStatus === "MISS" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          )}>
                            {viewingLogDetails.cacheStatus || "DYNAMIC"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs font-medium">WAF Shield:</span>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold text-[10px] border",
                            viewingLogDetails.wafAction === "allowed" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            viewingLogDetails.wafAction === "blocked" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          )}>
                            {viewingLogDetails.wafAction || "bypass"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-xs font-medium">Bot & Fraud Score:</span>
                          <span className="font-mono font-semibold">
                            {viewingLogDetails.botScore !== null ? `${Math.round(viewingLogDetails.botScore * 100)}%` : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Circuit Breaker warning box */}
                  {viewingLogDetails.statusCode === 502 && viewingLogDetails.responseBody?.includes("Circuit open") && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-semibold text-red-400">Request Blocked by Circuit Breaker</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          This request failed to reach the origin because the Circuit Breaker is in the **OPEN** state to isolate origin faults and prevent overload.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Request Headers */}
                  <HeadersList headersStr={viewingLogDetails.requestHeaders} title="Request Headers" />

                  {/* Request Body */}
                  {viewingLogDetails.requestBodySize !== null && viewingLogDetails.requestBodySize > 0 && (
                    <CodeBlock code={viewingLogDetails.requestBody} title="Request Body" />
                  )}

                  {/* Response Body */}
                  <CodeBlock code={viewingLogDetails.responseBody} title="Response Payload" />
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t px-5 py-3 shrink-0 flex justify-end bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setViewingLogId(null)}
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
      {viewingHealthLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4 shrink-0 bg-muted/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Health Check Execution Details</h2>
                  <p className="text-xs text-muted-foreground">Full telemetry captured during the background health check probe.</p>
                </div>
              </div>
              <button
                onClick={() => setViewingHealthLog(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border bg-muted/20 p-4">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Status</span>
                  <div>
                    {viewingHealthLog.isHealthy ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                        Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                        Unhealthy
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">HTTP Code</span>
                  <div>
                    <StatusBadge code={viewingHealthLog.statusCode} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Latency</span>
                  <div className="text-xs font-mono font-medium text-primary">
                    <FormatDuration ms={viewingHealthLog.latencyMs} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-semibold">Time Checked</span>
                  <div className="text-xs text-muted-foreground font-mono">
                    <FormatDate dateStr={viewingHealthLog.createdAt} />
                  </div>
                </div>
              </div>

              {/* URL Detail Box */}
              <div className="rounded-xl border border-border/40 p-4 space-y-2.5 bg-muted/5 font-mono text-xs">
                <div className="flex justify-between border-b border-border/30 pb-1.5">
                  <span className="text-muted-foreground">Probe Target URL:</span>
                  <span className="text-foreground font-medium break-all text-right max-w-[280px]">
                    {viewingHealthLog.url}
                  </span>
                </div>
                {viewingHealthLog.error && (
                  <div className="flex flex-col gap-1 pt-1.5">
                    <span className="text-destructive font-semibold">Error Message:</span>
                    <pre className="overflow-auto rounded-lg border border-red-500/20 bg-red-500/5 p-3 font-mono text-[10px] leading-relaxed text-red-400/90 whitespace-pre-wrap break-all scrollbar-thin">
                      {viewingHealthLog.error}
                    </pre>
                  </div>
                )}
              </div>

              {/* Probe Request Details */}
              <div className="rounded-xl border border-border/40 p-4 space-y-3 bg-muted/5">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-muted-foreground" />
                  Health Probe Request Signature
                </h3>
                <div className="text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HTTP Method:</span>
                    <span className="text-foreground font-semibold">HEAD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User-Agent:</span>
                    <span className="text-foreground font-semibold">EdgePlatform-HealthCheck/1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Request Headers:</span>
                    <span className="text-foreground font-semibold">X-Health-Check: 1</span>
                  </div>
                </div>
              </div>

              {/* Diagnostics Message */}
              <div className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3.5",
                viewingHealthLog.isHealthy 
                  ? "border-green-500/20 bg-green-500/5" 
                  : "border-red-500/20 bg-red-500/5"
              )}>
                <AlertCircle className={cn("h-4 w-4 shrink-0 mt-0.5", viewingHealthLog.isHealthy ? "text-green-400" : "text-red-400")} />
                <div className="space-y-0.5 text-xs">
                  <h4 className={cn("font-semibold", viewingHealthLog.isHealthy ? "text-green-400" : "text-red-400")}>
                    {viewingHealthLog.isHealthy ? "Origin Server Healthy" : "Origin Server Unhealthy"}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {viewingHealthLog.isHealthy 
                      ? "The probe completed successfully and the origin server returned a 2xx or 3xx status code. Gateway routing is fully operational."
                      : viewingHealthLog.statusCode && viewingHealthLog.statusCode >= 500
                        ? `The server responded with an unhealthy status code (${viewingHealthLog.statusCode}). This means the server is online but reporting an internal error.`
                        : "The edge server could not connect to the origin. Please check if your origin server is online, firewall settings permit requests from Cloudflare, and that port bindings are correct."}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-5 py-3 shrink-0 flex justify-end bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setViewingHealthLog(null)}
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
