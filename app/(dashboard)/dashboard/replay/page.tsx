"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Play,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings2,
  Database,
  Plus,
  History,
  Send,
  Layers,
  Globe,
  Bug,
  Activity,
  X,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useRequestLogs,
  useRequestLogDetails,
  useReplayJobs,
  useTriggerReplay,
  type RequestLog,
  type ReplayJob,
} from "@/lib/queries/replay";
import { useOrigins } from "@/lib/queries/origins";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
    return <span className="tabular-nums">{d.toLocaleTimeString()} {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>;
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

// Format body representation nicely
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

export default function RequestReplayPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;
  const replayEnabled = currentProject?.replayEnabled ?? false;

  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [logsPage, setLogsPage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);

  // Filters for request logs
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cacheFilter, setCacheFilter] = useState("all");

  // State for replay configuration modal
  const [configuringLogId, setConfiguringLogId] = useState<string | null>(null);
  const [overrideHeadersRaw, setOverrideHeadersRaw] = useState("");
  const [overrideBody, setOverrideBody] = useState("");
  const [targetOriginId, setTargetOriginId] = useState("default");
  const [headerParseError, setHeaderParseError] = useState<string | null>(null);

  // State for request details viewer modal
  const [viewingLogId, setViewingLogId] = useState<string | null>(null);

  // State for comparison modal
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [originalLogId, setOriginalLogId] = useState<string | null>(null);
  const [resultLogId, setResultLogId] = useState<string | null>(null);

  // Queries
  const { data: logsData, isLoading: logsLoading } = useRequestLogs(projectId, {
    page: logsPage,
    limit: 10,
    method: methodFilter,
    statusCode: statusFilter !== "all" ? Number(statusFilter) : undefined,
    cacheStatus: cacheFilter,
  });

  const { data: jobsData, isLoading: jobsLoading } = useReplayJobs(projectId, {
    page: jobsPage,
    limit: 10,
  });

  const { data: origins } = useOrigins(projectId);
  const triggerReplay = useTriggerReplay(projectId);

  // Log details queries for modals
  const { data: configuringLogDetails, isLoading: configuringLogLoading } = useRequestLogDetails(
    projectId,
    configuringLogId
  );
  const { data: originalLogDetails, isLoading: originalLogLoading } = useRequestLogDetails(
    projectId,
    originalLogId
  );
  const { data: resultLogDetails, isLoading: resultLogLoading } = useRequestLogDetails(
    projectId,
    resultLogId
  );
  const { data: viewingLogDetails, isLoading: viewingLogLoading } = useRequestLogDetails(
    projectId,
    viewingLogId
  );

  // Initialize Replay Config modal fields when details are loaded
  useEffect(() => {
    if (configuringLogDetails && configuringLogId) {
      try {
        const parsed = JSON.parse(configuringLogDetails.requestHeaders ?? "{}");
        setOverrideHeadersRaw(JSON.stringify(parsed, null, 2));
      } catch {
        setOverrideHeadersRaw("{}");
      }
      setOverrideBody(configuringLogDetails.requestBody ?? "");
      setTargetOriginId("default");
      setHeaderParseError(null);
    }
  }, [configuringLogDetails, configuringLogId]);

  // Reset pagination when filters change
  useEffect(() => {
    setLogsPage(1);
  }, [methodFilter, statusFilter, cacheFilter]);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Database className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Request Replay settings.</p>
      </div>
    );
  }

  if (!replayEnabled) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center bg-background/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <AlertCircle className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold">Request Replay is Disabled</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Request replay (Time Travel Debugging) capture is not enabled for this project. Turn it on in the project settings to start capturing replayable requests.
          </p>
        </div>
        <Link href="/dashboard/settings" className="mt-2">
          <Button variant="default" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Go to Settings
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate Statistics from Jobs list
  const totalReplays = jobsData?.meta.total ?? 0;
  const runningJobsCount = jobsData?.data.filter(j => j.status === "pending" || j.status === "running").length ?? 0;
  const completedJobs = jobsData?.data.filter(j => j.status === "completed") ?? [];
  const failedJobsCount = jobsData?.data.filter(j => j.status === "failed").length ?? 0;
  const successRate = totalReplays > 0 ? Math.round(((totalReplays - failedJobsCount) / totalReplays) * 100) : 100;

  // Handle Trigger Replay Form submission
  const handleTriggerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringLogId) return;

    let headers: Record<string, string> = {};
    try {
      if (overrideHeadersRaw.trim()) {
        headers = JSON.parse(overrideHeadersRaw);
      }
    } catch (err) {
      setHeaderParseError("Invalid JSON in headers field");
      return;
    }

    try {
      await triggerReplay.mutateAsync({
        logId: configuringLogId,
        overrideHeaders: Object.keys(headers).length > 0 ? headers : undefined,
        overrideBody: overrideBody.trim() ? overrideBody : undefined,
        targetOriginId: (targetOriginId && targetOriginId !== "default") ? targetOriginId : undefined,
      });

      // Close modal & switch to History Tab
      setConfiguringLogId(null);
      setActiveTab("history");
      setJobsPage(1);
    } catch (err) {
      alert("Failed to queue replay job: " + (err as Error).message);
    }
  };

  const handleOpenCompare = (job: ReplayJob) => {
    setActiveJobId(job.id);
    setOriginalLogId(job.requestLogId);
    setResultLogId(job.resultLogId);
  };

  const activeJob = jobsData?.data.find(j => j.id === activeJobId);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Request Replay</h1>
            <p className="text-xs text-muted-foreground">Time travel debugging, request payload testing & AI differential analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Capture Active
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── Stats Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <History className="h-3.5 w-3.5" />
                Total Replays
              </div>
              <div className="text-3xl font-bold tabular-nums">{jobsLoading ? "—" : totalReplays}</div>
              <div className="text-xs text-muted-foreground mt-0.5">queued in this project</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                Success Rate
              </div>
              <div className="text-3xl font-bold tabular-nums text-green-400">{jobsLoading ? "—" : `${successRate}%`}</div>
              <div className="text-xs text-muted-foreground mt-0.5">completed without API errors</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Loader2 className={cn("h-3.5 w-3.5 text-blue-400", runningJobsCount > 0 && "animate-spin")} />
                Running Jobs
              </div>
              <div className="text-3xl font-bold tabular-nums text-blue-400">{jobsLoading ? "—" : runningJobsCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">processing asynchronously</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Globe className="h-3.5 w-3.5 text-purple-400" />
                Active Origins
              </div>
              <div className="text-3xl font-bold tabular-nums text-purple-400">{origins ? origins.length : "—"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">targets available for replays</div>
            </CardContent>
          </Card>
        </div>

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
                Replayable Requests
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-colors relative",
                activeTab === "history" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                <History className="h-4 w-4" />
                Replay History
                {runningJobsCount > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                )}
              </div>
            </button>
          </div>

          {/* ── TAB CONTENT: REPLAYABLE REQUESTS ─────────── */}
          {activeTab === "requests" && (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Captured Requests</CardTitle>
                    <CardDescription className="text-xs">Browse recently captured traffic that can be replayed with customized headers or bodies.</CardDescription>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap gap-2 items-center">
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
                    <p className="text-sm font-medium">No replayable requests found</p>
                    <p className="text-xs opacity-60">Send traffic to your proxy URL with headers or body payload to begin capturing logs.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Method</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Path</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Latency</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Size</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Replays</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsData.data.map(log => (
                          <tr key={log.id} className="border-b hover:bg-muted/10 transition-colors">
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
                            <td className="px-4 py-3 text-muted-foreground font-mono">
                              <FormatSize bytes={log.responseBodySize} />
                            </td>
                            <td className="px-4 py-3">
                              {log.replayCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-primary font-semibold">
                                  {log.replayCount}×
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  id={`view-btn-${log.id}`}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[10px] font-semibold gap-1 hover:bg-muted"
                                  onClick={() => setViewingLogId(log.id)}
                                >
                                  <Eye className="h-3 w-3" />
                                  Details
                                </Button>
                                <Button
                                  id={`replay-btn-${log.id}`}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] font-semibold gap-1"
                                  onClick={() => setConfiguringLogId(log.id)}
                                >
                                  <Play className="h-2.5 w-2.5" />
                                  Replay
                                </Button>
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

          {/* ── TAB CONTENT: REPLAY HISTORY ──────────────── */}
          {activeTab === "history" && (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-base">Replay Runs</CardTitle>
                <CardDescription className="text-xs">Audit log of all triggered replays, including comparison results and AI diff summaries.</CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {jobsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !jobsData || jobsData.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <History className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No replays executed yet</p>
                    <p className="text-xs opacity-60">Trigger a replay from the Replayable Requests tab to debug API behavior.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Triggered</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Job ID</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Origin</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">AI Diff Summary</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Comparison</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobsData.data.map(job => (
                          <tr key={job.id} className="border-b hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground font-mono">
                              <FormatDate dateStr={job.createdAt} />
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              {job.id.slice(-8)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-[10px]",
                                job.status === "completed" && "bg-green-500/10 text-green-400 border-green-500/20",
                                job.status === "failed" && "bg-red-500/10 text-red-400 border-red-500/20",
                                job.status === "running" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                job.status === "pending" && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              )}>
                                {job.status === "running" && <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-400" />}
                                {job.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground text-[10px]">
                              {job.targetOriginId ? (
                                origins?.find(o => o.id === job.targetOriginId)?.label ?? "Override"
                              ) : (
                                <span className="text-muted-foreground/60">Original Origin</span>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-xs md:max-w-md truncate font-medium text-[11px] text-foreground/80">
                              {job.status === "failed" ? (
                                <span className="text-red-400 font-normal italic">{job.error || "Execution failed"}</span>
                              ) : job.diffSummary ? (
                                <span className="inline-flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                                  {job.diffSummary}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 italic">Not generated</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                id={`compare-btn-${job.id}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/5"
                                disabled={job.status !== "completed"}
                                onClick={() => handleOpenCompare(job)}
                              >
                                <Eye className="h-2.5 w-2.5" />
                                Compare
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {jobsData && jobsData.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{jobsPage}</span> of <span className="font-semibold text-foreground">{jobsData.meta.totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setJobsPage(p => Math.max(1, p - 1))}
                        disabled={jobsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setJobsPage(p => Math.min(jobsData.meta.totalPages, p + 1))}
                        disabled={jobsPage === jobsData.meta.totalPages}
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

      {/* ── MODAL: CONFIGURE REPLAY ───────────────────────────── */}
      {configuringLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4 shrink-0 bg-muted/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Play className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Configure & Replay Request</h2>
                  <p className="text-xs text-muted-foreground">Override header values, adjust body payloads, or route to alternate origins.</p>
                </div>
              </div>
              <button
                onClick={() => setConfiguringLogId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleTriggerSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {configuringLogLoading ? (
                <div className="space-y-3 py-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !configuringLogDetails ? (
                <div className="text-center py-6 text-destructive text-xs">Failed to load request details</div>
              ) : (
                <>
                  {/* Original request summary */}
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Original Request</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MethodBadge method={configuringLogDetails.method} />
                      <span className="font-mono text-xs font-semibold text-foreground break-all">{configuringLogDetails.path}</span>
                    </div>
                  </div>

                  {/* Override Target Origin */}
                  <div className="space-y-1.5">
                    <Label htmlFor="target-origin" className="text-xs text-muted-foreground">Route to Origin</Label>
                    <Select value={targetOriginId} onValueChange={setTargetOriginId}>
                      <SelectTrigger id="target-origin" className="h-9 text-xs">
                        <SelectValue placeholder="Default (Original routing configuration)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default" className="text-xs">Original Origin ({configuringLogDetails.originUrl || "none"})</SelectItem>
                        {origins?.map(o => (
                          <SelectItem key={o.id} value={o.id} className="text-xs">
                            {o.label} ({o.url})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Headers Overrides */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="override-headers" className="text-xs text-muted-foreground">Request Headers (JSON)</Label>
                      {headerParseError && <span className="text-[10px] text-red-400 font-semibold">{headerParseError}</span>}
                    </div>
                    <textarea
                      id="override-headers"
                      className={cn(
                        "w-full rounded-lg border bg-transparent px-3 py-2 text-xs font-mono h-32 resize-none focus:outline-none focus:ring-2",
                        headerParseError ? "border-red-500 focus:ring-red-500" : "focus:ring-primary border-border"
                      )}
                      value={overrideHeadersRaw}
                      onChange={(e) => {
                        setOverrideHeadersRaw(e.target.value);
                        setHeaderParseError(null);
                      }}
                      placeholder='{"X-Header": "value"}'
                    />
                  </div>

                  {/* Body Overrides (only shown for writable requests) */}
                  {!["GET", "HEAD", "OPTIONS"].includes(configuringLogDetails.method.toUpperCase()) && (
                    <div className="space-y-1.5">
                      <Label htmlFor="override-body" className="text-xs text-muted-foreground">Request Body</Label>
                      <textarea
                        id="override-body"
                        className="w-full rounded-lg border bg-transparent px-3 py-2 text-xs font-mono h-24 focus:outline-none focus:ring-2 focus:ring-primary border-border"
                        value={overrideBody}
                        onChange={(e) => setOverrideBody(e.target.value)}
                        placeholder="Enter request payload..."
                      />
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-4 flex justify-end gap-3 bg-background shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setConfiguringLogId(null)}
                >
                  Cancel
                </Button>
                <Button
                  id="replay-dialog-submit"
                  type="submit"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  disabled={triggerReplay.isPending || configuringLogLoading}
                >
                  {triggerReplay.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  {triggerReplay.isPending ? "Queuing..." : "Queue Replay Run"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: COMPARE RESPONSES ─────────────────────────── */}
      {activeJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4 shrink-0 bg-muted/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Response Comparison & Diff</h2>
                  <p className="text-xs text-muted-foreground">Original execution vs Replayed execution side-by-side comparison.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveJobId(null);
                  setOriginalLogId(null);
                  setResultLogId(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* AI Diff summary banner */}
              {activeJob && activeJob.diffSummary && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    AI DIFFERENTIAL INSIGHT
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                    {activeJob.diffSummary}
                  </p>
                </div>
              )}

              {/* Side by side log details */}
              {originalLogLoading || resultLogLoading ? (
                <div className="grid grid-cols-2 gap-4 py-8">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>
              ) : !originalLogDetails || !resultLogDetails ? (
                <div className="text-center py-10 text-xs text-destructive italic">Failed to load comparison data.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Original */}
                  <div className="space-y-4 rounded-xl border border-border/40 bg-muted/5 p-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-muted-foreground/60" />
                        Original Response
                      </h3>
                      <StatusBadge code={originalLogDetails.statusCode} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-b pb-3">
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-1 text-foreground font-semibold">{originalLogDetails.durationMs}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cache Status:</span>
                        <span className="ml-1 text-foreground font-semibold">{originalLogDetails.cacheStatus || "MISS"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Body Size:</span>
                        <span className="ml-1 text-foreground font-semibold"><FormatSize bytes={originalLogDetails.responseBodySize} /></span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Colo Region:</span>
                        <span className="ml-1 text-foreground font-semibold">{originalLogDetails.cfColo || "unknown"}</span>
                      </div>
                    </div>

                    {/* Headers */}
                    <HeadersList headersStr={originalLogDetails.requestHeaders} title="Request Headers" />

                    {/* Response Body */}
                    <CodeBlock code={originalLogDetails.responseBody} title="Response Payload" />
                  </div>

                  {/* Right Column: Replay Result */}
                  <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3 text-primary shrink-0" />
                        Replayed Response
                      </h3>
                      <StatusBadge code={resultLogDetails.statusCode} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-b border-primary/10 pb-3">
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-1 text-foreground font-semibold">{resultLogDetails.durationMs}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delta:</span>
                        {originalLogDetails.durationMs !== null && resultLogDetails.durationMs !== null ? (
                          <span className={cn(
                            "ml-1 font-bold",
                            resultLogDetails.durationMs <= originalLogDetails.durationMs ? "text-green-400" : "text-red-400"
                          )}>
                            {resultLogDetails.durationMs - originalLogDetails.durationMs > 0 ? "+" : ""}
                            {resultLogDetails.durationMs - originalLogDetails.durationMs}ms
                          </span>
                        ) : (
                          <span className="ml-1 text-muted-foreground/60">—</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Body Size:</span>
                        <span className="ml-1 text-foreground font-semibold"><FormatSize bytes={resultLogDetails.responseBodySize} /></span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Routed Origin:</span>
                        <span className="ml-1 text-foreground font-semibold truncate max-w-[80px] inline-block align-bottom">
                          {resultLogDetails.originUrl ? new URL(resultLogDetails.originUrl).hostname : "default"}
                        </span>
                      </div>
                    </div>

                    {/* Headers */}
                    <HeadersList headersStr={resultLogDetails.requestHeaders} title="Request Headers (Replayed)" />

                    {/* Response Body */}
                    <CodeBlock code={resultLogDetails.responseBody} title="Response Payload (Replayed)" />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t px-5 py-3 shrink-0 flex justify-end bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setActiveJobId(null);
                  setOriginalLogId(null);
                  setResultLogId(null);
                }}
              >
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}

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
              ) : !viewingLogDetails ? (
                <div className="text-center py-8 text-destructive text-xs">Failed to load request details</div>
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

                        {/* Circuit Breaker & AI Healer */}
                        {viewingLogDetails.aiHealerTriggered && (
                          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-2.5 py-1.5 space-y-1">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-400">
                              <Sparkles className="h-3 w-3 shrink-0" />
                              AI HEALER INTERVENED
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                              Action: <span className="font-mono text-purple-300 font-semibold">{viewingLogDetails.aiHealerAction}</span>
                            </p>
                          </div>
                        )}
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
    </div>
  );
}
