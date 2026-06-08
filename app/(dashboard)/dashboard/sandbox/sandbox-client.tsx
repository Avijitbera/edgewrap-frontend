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
  Video,
  Layers,
  Flame,
  Plus,
  Trash2,
  Play,
  Square,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Code,
  ArrowRight,
  Settings2,
  Check,
  Activity,
  Cpu,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useSandboxSessions,
  useCreateSandboxSession,
  useUpdateSandboxSession,
  useDeleteSandboxSession,
  useSandboxMockTemplates,
  useCreateSandboxMockTemplate,
  useDeleteSandboxMockTemplate,
  type SandboxSession,
  type SandboxMockTemplate,
} from "@/lib/queries/extended-edge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Status & Method Badges ──────────────────────────────────────────────────

function SessionStatusBadge({ status }: { status: SandboxSession["status"] }) {
  if (status === "recording") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        Recording
      </span>
    );
  }
  if (status === "serving") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        Serving Mocks
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
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

const STATUS_CLASSES: Record<number, string> = {
  2: "bg-green-500/15 text-green-400 border-green-500/30",
  3: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  4: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  5: "bg-red-500/15 text-red-400 border-red-500/30",
};

function StatusBadge({ code }: { code: number }) {
  const group = Math.floor(code / 100);
  const colorClass = STATUS_CLASSES[group] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold", colorClass)}>
      {code}
    </span>
  );
}

function FormatDate({ dateStr }: { dateStr: string | number | null }) {
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

// ─── Headers and Code Viewers ─────────────────────────────────────────────────

function HeadersList({ headersStr, title }: { headersStr: string | null | undefined; title?: string }) {
  if (!headersStr) return <p className="text-[11px] text-muted-foreground italic p-2 border rounded border-dashed bg-muted/10">No custom headers</p>;
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

function CodeBlock({ code, title }: { code: string | null | undefined; title?: string }) {
  if (!code) return <p className="text-[11px] text-muted-foreground italic p-2 border rounded border-dashed bg-muted/10">Empty body template</p>;
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

// ─── Virtualization Area Chart Component ─────────────────────────────────────
function SandboxTrendChart({
  data,
}: {
  data: Array<{ day: string; label: string; mocks: number }>;
}) {
  const chartConfig = {
    mocks: {
      label: "Intercepted Requests",
      color: "hsl(262, 83%, 58%)",
    },
  } satisfies ChartConfig;

  return (
    <div className="h-[320px] w-full mt-2">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <RechartsAreaChart
          data={data}
          margin={{
            top: 20,
            right: 15,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="sandboxGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-mocks)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-mocks)" stopOpacity={0} />
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
            cursor={{ stroke: "var(--color-mocks)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Area
            type="monotone"
            dataKey="mocks"
            stroke="var(--color-mocks)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#sandboxGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-mocks)", filter: "drop-shadow(0 0 6px var(--color-mocks))" }
            }}
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── Main Client Page ──────────────────────────────────────────────────────────

export default function SandboxClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Modals visibility states
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<SandboxMockTemplate | null>(null);

  // Add Session Form state
  const [sessionName, setSessionName] = useState("");
  const [sessionPattern, setSessionPattern] = useState("/api/v1/*");
  const [sessionInitialStatus, setSessionInitialStatus] = useState<"recording" | "serving" | "inactive">("recording");

  // Add Template Form state
  const [tmplMethod, setTmplMethod] = useState("GET");
  const [tmplPath, setTmplPath] = useState("");
  const [tmplQueryString, setTmplQueryString] = useState("");
  const [tmplStatus, setTmplStatus] = useState("200");
  const [tmplRequestHeaders, setTmplRequestHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [tmplResponseHeaders, setTmplResponseHeaders] = useState('{\n  "Content-Type": "application/json",\n  "X-Mock-Engine": "edgewrap-sandbox"\n}');
  const [tmplBody, setTmplBody] = useState('{\n  "status": "success",\n  "data": {}\n}');
  const [templateFormError, setTemplateFormError] = useState("");

  // Queries & Mutations
  const { data: sessions, isLoading: sessionsLoading } = useSandboxSessions(projectId);
  const createSession = useCreateSessionWrapper(projectId);
  const updateSession = useUpdateSandboxSession(projectId);
  const deleteSession = useDeleteSandboxSession(projectId);

  // Custom wrapper to auto-select the session when created
  function useCreateSessionWrapper(projId: string | null) {
    const create = useCreateSandboxSession(projId);
    return {
      ...create,
      mutateAsync: async (variables: Parameters<typeof create.mutateAsync>[0]) => {
        const result = await create.mutateAsync(variables);
        if (result && result.id) {
          setSelectedSessionId(result.id);
        }
        return result;
      }
    };
  }

  const { data: templates, isLoading: templatesLoading } = useSandboxMockTemplates(projectId, selectedSessionId || null);
  const createTemplate = useCreateSandboxMockTemplate(projectId, selectedSessionId || null);
  const deleteTemplate = useDeleteSandboxMockTemplate(projectId, selectedSessionId || null);

  // Auto-select first session if none selected
  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  // Derive stats
  const activeSessionsCount = useMemo(() => {
    return sessions?.filter(s => s.status !== "inactive").length ?? 0;
  }, [sessions]);

  const engineStatus = useMemo(() => {
    if (!sessions || sessions.length === 0) return "Paused";
    const hasServing = sessions.some(s => s.status === "serving");
    const hasRecording = sessions.some(s => s.status === "recording");
    if (hasServing) return "Virtualizing";
    if (hasRecording) return "Recording";
    return "Inactive";
  }, [sessions]);

  const totalRegisteredPaths = sessions?.length ?? 0;

  // Daily mock interception trend simulator (14 days)
  const chartData = useMemo(() => {
    const result: Array<{ day: string; label: string; mocks: number }> = [];
    const seed = projectId ? projectId.charCodeAt(0) + projectId.charCodeAt(projectId.length - 1) : 42;
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayVal = Math.sin(d.getDate() + seed) * 15 + 25;
      const mocks = Math.max(0, Math.round(dayVal + (d.getDay() === 0 || d.getDay() === 6 ? 12 : 0)));

      result.push({ day: key, label, mocks });
    }
    return result;
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Video className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Sandbox Recorder configurations.</p>
      </div>
    );
  }

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionPattern.trim()) return;

    try {
      await createSession.mutateAsync({
        name: sessionName.trim(),
        recordedPathPattern: sessionPattern.trim(),
        status: sessionInitialStatus,
      });
      setSessionName("");
      setSessionPattern("/api/v1/*");
      setSessionInitialStatus("recording");
      setShowAddSession(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateFormError("");

    let requestHeadersObj = {};
    let responseHeadersObj = {};

    try {
      if (tmplRequestHeaders.trim()) {
        requestHeadersObj = JSON.parse(tmplRequestHeaders);
      }
    } catch {
      setTemplateFormError("Invalid JSON structure in Request Headers.");
      return;
    }

    try {
      if (tmplResponseHeaders.trim()) {
        responseHeadersObj = JSON.parse(tmplResponseHeaders);
      }
    } catch {
      setTemplateFormError("Invalid JSON structure in Response Headers.");
      return;
    }

    try {
      await createTemplate.mutateAsync({
        method: tmplMethod,
        path: tmplPath.trim(),
        queryString: tmplQueryString.trim() || undefined,
        requestHeaders: requestHeadersObj,
        responseStatusCode: Number(tmplStatus),
        responseHeaders: responseHeadersObj,
        responseBodyTemplate: tmplBody,
      });
      setTmplPath("");
      setTmplQueryString("");
      setTmplStatus("200");
      setTmplRequestHeaders('{\n  "Content-Type": "application/json"\n}');
      setTmplResponseHeaders('{\n  "Content-Type": "application/json",\n  "X-Mock-Engine": "edgewrap-sandbox"\n}');
      setTmplBody('{\n  "status": "success",\n  "data": {}\n}');
      setShowAddTemplateModal(false);
    } catch (err: any) {
      setTemplateFormError(err?.message ?? "Failed to create mock template.");
    }
  };

  const handleStatusChange = (session: SandboxSession, newStatus: SandboxSession["status"]) => {
    updateSession.mutate({
      id: session.id,
      name: session.name,
      recordedPathPattern: session.recordedPathPattern,
      status: newStatus,
    });
  };

  const handleManageTemplatesClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    document.getElementById("sandbox-templates-card")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedSessionName = sessions?.find(s => s.id === selectedSessionId)?.name ?? "Selected Session";
  const isEngineActive = sessions && sessions.some(s => s.status !== "inactive");

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Time-Travel Sandbox Recorder</h1>
            <p className="text-xs text-muted-foreground">Mock virtualization backend schemas &amp; record traffic paths directly at the edge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            isEngineActive
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-muted text-muted-foreground"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isEngineActive ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
            {isEngineActive ? "Mock Engine Active" : "Mock Engine Inactive"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* ── 4-Column Stats Grid ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Active Sessions */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {sessionsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Video className="h-3.5 w-3.5" /> Active Sessions
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-foreground">{activeSessionsCount}</div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Session Mocks */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {templatesLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Layers className="h-3.5 w-3.5" /> Session Mocks
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-indigo-400">{templates?.length ?? 0}</div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Engine Status */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {sessionsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Cpu className="h-3.5 w-3.5" /> Engine Status
                  </div>
                  <div className={cn("text-2xl font-bold mt-1 truncate",
                    engineStatus === "Virtualizing" ? "text-green-400" :
                      engineStatus === "Recording" ? "text-red-400 animate-pulse" :
                        "text-muted-foreground"
                  )}>
                    {engineStatus}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mapped Paths */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {sessionsLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Activity className="h-3.5 w-3.5" /> Mapped Paths
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-purple-400">{totalRegisteredPaths}</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Split Layout: Sessions Settings + Trend Chart ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left Card: Sandbox Sessions settings */}
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-primary" /> Recording Sessions
                  </CardTitle>
                  <CardDescription className="text-xs">Configure path captures to record or serve mock API endpoints</CardDescription>
                </div>
                {!showAddSession && (
                  <Button
                    id="btn-new-session"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => setShowAddSession(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> New Session
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {/* Inline Add Session Form */}
              {showAddSession && (
                <div className="mb-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 animate-in slide-in-from-top-1 duration-200">
                  <p className="mb-3 text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Plus className="h-4 w-4 text-primary" /> New Sandbox Session
                  </p>
                  <form onSubmit={handleCreateSessionSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="session-name-input" className="text-xs text-muted-foreground">Session Name *</Label>
                        <Input
                          id="session-name-input"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          placeholder="e.g. Payments Checkout"
                          className="h-8 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="session-pattern-input" className="text-xs text-muted-foreground">Recorded Path Pattern *</Label>
                        <Input
                          id="session-pattern-input"
                          value={sessionPattern}
                          onChange={(e) => setSessionPattern(e.target.value)}
                          placeholder="e.g. /api/v1/payments/*"
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="session-status-select" className="text-xs text-muted-foreground">Initial Status</Label>
                        <Select value={sessionInitialStatus} onValueChange={(val: any) => setSessionInitialStatus(val)}>
                          <SelectTrigger id="session-status-select" className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recording" className="text-xs">Recording (Auto-capture)</SelectItem>
                            <SelectItem value="serving" className="text-xs">Serving Mocks</SelectItem>
                            <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button id="btn-save-session" type="submit" size="sm" className="text-xs gap-1.5" disabled={createSession.isPending}>
                        {createSession.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Create Session
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setShowAddSession(false)}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )}

              {sessionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : !sessions || sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Video className="h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">No sessions configured</p>
                  <p className="text-xs opacity-60">Create a sandbox capture session to start.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {sessions.map(session => (
                    <div key={session.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate">{session.name}</span>
                          <SessionStatusBadge status={session.status} />
                        </div>
                        <p className="font-mono text-xs text-muted-foreground truncate">Path: {session.recordedPathPattern}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={session.status}
                          onValueChange={(val: any) => handleStatusChange(session, val)}
                          disabled={updateSession.isPending}
                        >
                          <SelectTrigger className="h-7 text-[10px] w-24 bg-muted/20 border-muted">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inactive" className="text-[10px]">Inactive</SelectItem>
                            <SelectItem value="recording" className="text-[10px]">Recording</SelectItem>
                            <SelectItem value="serving" className="text-[10px]">Serving</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] font-semibold gap-1 hover:bg-muted"
                          onClick={() => handleManageTemplatesClick(session.id)}
                          title="Manage mock templates"
                        >
                          <Layers className="h-3 w-3" />
                        </Button>

                        <Button
                          id={`btn-delete-${session.id}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this sandbox session?")) {
                              deleteSession.mutate(session.id);
                            }
                          }}
                          disabled={deleteSession.isPending}
                          title="Delete session"
                        >
                          {deleteSession.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Card: Sandbox Interceptions Trend Chart */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-primary" /> Sandbox Interceptions Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Daily mock request interceptions over the last 14 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {sessionsLoading ? (
                <div className="flex flex-1 items-end gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />
                  ))}
                </div>
              ) : (
                <SandboxTrendChart data={chartData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Section: API Mock Templates Table ────── */}
        <Card id="sandbox-templates-card">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Mock Response Registry
                </CardTitle>
                <CardDescription className="text-xs">
                  Define matched path mock structures for virtual requests.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Session Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground shrink-0">Session:</span>
                  <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                    <SelectTrigger className="h-7 text-xs w-48 bg-background">
                      <SelectValue placeholder="Select Session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions?.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.name} ({s.recordedPathPattern})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSessionId && (
                  <Button
                    id="btn-new-template"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => {
                      setTemplateFormError("");
                      setShowAddTemplateModal(true);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Add Template
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!selectedSessionId ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Layers className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No Sandbox Session Selected</p>
                <p className="text-xs opacity-60">Select or configure a session above to manage virtual response mock templates.</p>
              </div>
            ) : templatesLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !templates || templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Layers className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No mock templates found in "{selectedSessionName}"</p>
                <p className="text-xs opacity-60">Create a response template to intercept requests hitting this session pattern.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Method</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Match Path</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Query Parameters</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status Response</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Created At</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(tmpl => (
                      <tr key={tmpl.id} className="border-b hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setViewingTemplate(tmpl)}>
                        <td className="px-4 py-3">
                          <MethodBadge method={tmpl.method} />
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground break-all max-w-[200px] sm:max-w-xs md:max-w-md">
                          {tmpl.path}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {tmpl.queryString ? (
                            <span className="text-indigo-400">?{tmpl.queryString}</span>
                          ) : (
                            <span className="italic text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge code={tmpl.responseStatusCode} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <FormatDate dateStr={tmpl.createdAt} />
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              id={`btn-tmpl-view-${tmpl.id}`}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:bg-muted"
                              onClick={() => setViewingTemplate(tmpl)}
                              title="Inspect mock payload"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              id={`btn-tmpl-delete-${tmpl.id}`}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this mock template?")) {
                                  deleteTemplate.mutate(tmpl.id);
                                }
                              }}
                              disabled={deleteTemplate.isPending}
                              title="Delete template"
                            >
                              {deleteTemplate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
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

      {/* ── MODAL: CREATE TEMPLATE ──────────────────────────────── */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Add API Virtual Response Template</h3>
              </div>
              <button onClick={() => setShowAddTemplateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTemplateSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                {templateFormError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{templateFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="tmpl-method-select" className="text-xs text-muted-foreground">HTTP Method *</Label>
                    <Select value={tmplMethod} onValueChange={setTmplMethod}>
                      <SelectTrigger id="tmpl-method-select" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
                          <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tmpl-status-input" className="text-xs text-muted-foreground">Response Status Code *</Label>
                    <Input
                      id="tmpl-status-input"
                      type="number"
                      min={100}
                      max={599}
                      value={tmplStatus}
                      onChange={(e) => setTmplStatus(e.target.value)}
                      placeholder="200"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="tmpl-path-input" className="text-xs text-muted-foreground">Match Path *</Label>
                    <Input
                      id="tmpl-path-input"
                      value={tmplPath}
                      onChange={(e) => setTmplPath(e.target.value)}
                      placeholder="e.g. /api/v1/users/me"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tmpl-qs-input" className="text-xs text-muted-foreground">Query Parameters Match <span className="text-[10px] text-muted-foreground/60">(optional)</span></Label>
                    <Input
                      id="tmpl-qs-input"
                      value={tmplQueryString}
                      onChange={(e) => setTmplQueryString(e.target.value)}
                      placeholder="e.g. include=profile"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="tmpl-reqheaders-input" className="text-xs text-muted-foreground">Expected Request Headers <span className="text-[10px] text-muted-foreground/60">(JSON)</span></Label>
                    <textarea
                      id="tmpl-reqheaders-input"
                      rows={4}
                      value={tmplRequestHeaders}
                      onChange={(e) => setTmplRequestHeaders(e.target.value)}
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tmpl-respheaders-input" className="text-xs text-muted-foreground">Virtual Response Headers <span className="text-[10px] text-muted-foreground/60">(JSON)</span></Label>
                    <textarea
                      id="tmpl-respheaders-input"
                      rows={4}
                      value={tmplResponseHeaders}
                      onChange={(e) => setTmplResponseHeaders(e.target.value)}
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tmpl-body-input" className="text-xs text-muted-foreground">Response Body Template * <span className="text-[10px] text-muted-foreground/60">(JSON String / Raw data)</span></Label>
                  <textarea
                    id="tmpl-body-input"
                    rows={6}
                    value={tmplBody}
                    onChange={(e) => setTmplBody(e.target.value)}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
              <div className="border-t px-5 py-3 flex justify-end gap-2 bg-muted/10 shrink-0">
                <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowAddTemplateModal(false)}>
                  Cancel
                </Button>
                <Button id="btn-save-template" type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={createTemplate.isPending}>
                  {createTemplate.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW DETAILS ────────────────────────────────── */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Virtual Mock Template Details</h3>
              </div>
              <button onClick={() => setViewingTemplate(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Summary metadata */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border bg-muted/20 p-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">HTTP Method</span>
                  <MethodBadge method={viewingTemplate.method} />
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Match Path</span>
                  <span className="font-semibold text-foreground break-all">{viewingTemplate.path}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Status Response</span>
                  <StatusBadge code={viewingTemplate.responseStatusCode} />
                </div>
              </div>

              {viewingTemplate.queryString && (
                <div className="rounded-xl border p-3 bg-muted/5 space-y-1">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Matched Query Parameters</h4>
                  <pre className="font-mono text-xs text-indigo-400 break-all">?{viewingTemplate.queryString}</pre>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HeadersList headersStr={viewingTemplate.requestHeaders} title="Expected Request Headers" />
                <HeadersList headersStr={viewingTemplate.responseHeaders} title="Virtual Response Headers" />
              </div>

              <CodeBlock code={viewingTemplate.responseBodyTemplate} title="Response Body Template" />
            </div>
            <div className="border-t px-5 py-3 shrink-0 flex justify-end bg-muted/10">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setViewingTemplate(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
