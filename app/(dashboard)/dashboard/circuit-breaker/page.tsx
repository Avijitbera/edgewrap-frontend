"use client";

import { useState, useMemo } from "react";
import {
  Zap,
  ZapOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Clock,
  Cpu,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useCircuitBreakerState,
  useResetCircuitBreaker,
  useCircuitBreakerEvents,
  type CircuitBreakerState,
  type CircuitBreakerEvent,
} from "@/lib/queries/circuit-breaker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATE_META: Record<
  CircuitBreakerState,
  { label: string; color: string; ringColor: string; pulseColor: string; icon: React.ReactNode; desc: string }
> = {
  closed: {
    label: "Closed",
    color: "text-green-400",
    ringColor: "ring-green-500/40",
    pulseColor: "bg-green-500",
    icon: <CheckCircle2 className="h-8 w-8 text-green-400" />,
    desc: "All requests are flowing normally. The circuit is healthy.",
  },
  open: {
    label: "Open",
    color: "text-red-400",
    ringColor: "ring-red-500/40",
    pulseColor: "bg-red-500",
    icon: <XCircle className="h-8 w-8 text-red-400" />,
    desc: "Requests are being blocked. Too many failures were detected.",
  },
  half_open: {
    label: "Half-Open",
    color: "text-yellow-400",
    ringColor: "ring-yellow-500/40",
    pulseColor: "bg-yellow-500",
    icon: <AlertTriangle className="h-8 w-8 text-yellow-400" />,
    desc: "Probing the origin with limited requests to check recovery.",
  },
};

function StateBadge({ state }: { state: CircuitBreakerState }) {
  const meta = STATE_META[state];
  const colors: Record<CircuitBreakerState, string> = {
    closed: "border-green-500/30 bg-green-500/10 text-green-400",
    open: "border-red-500/30 bg-red-500/10 text-red-400",
    half_open: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", colors[state])}>
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", meta.pulseColor)} />
      {meta.label}
    </span>
  );
}

function TransitionArrow({ from, to }: { from: CircuitBreakerState; to: CircuitBreakerState }) {
  const stateColors: Record<CircuitBreakerState, string> = {
    closed: "text-green-400",
    open: "text-red-400",
    half_open: "text-yellow-400",
  };
  const labels: Record<CircuitBreakerState, string> = {
    closed: "Closed",
    open: "Open",
    half_open: "Half-Open",
  };
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={cn("font-semibold", stateColors[from])}>{labels[from]}</span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <span className={cn("font-semibold", stateColors[to])}>{labels[to]}</span>
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ─── State Gauge ──────────────────────────────────────────────────────────────

function CircleProgress({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dash = pct * circumference;

  return (
    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        className={color}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

// ─── Simulator Sandbox ────────────────────────────────────────────────────────

function CircuitBreakerSandbox({ state }: { state: CircuitBreakerState | null }) {
  const [statusCode, setStatusCode] = useState("200");
  const [latencyMs, setLatencyMs] = useState("150");
  const [simResult, setSimResult] = useState<{
    wouldPass: boolean;
    reason: string;
    currentState: CircuitBreakerState;
  } | null>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = parseInt(statusCode);
    const latency = parseInt(latencyMs);
    const currentState = state ?? "closed";

    const isError = code >= 500 || latency > 10000;

    let wouldPass = false;
    let reason = "";

    if (currentState === "open") {
      wouldPass = false;
      reason = "Circuit is OPEN — all requests are immediately rejected to protect the origin.";
    } else if (currentState === "half_open") {
      wouldPass = !isError;
      reason = isError
        ? "Circuit is HALF-OPEN — this failure would trip the circuit back to OPEN."
        : "Circuit is HALF-OPEN — this success counts toward closing the circuit.";
    } else {
      // closed
      wouldPass = !isError;
      reason = isError
        ? "Circuit is CLOSED — this failure increments the failure counter toward the threshold."
        : "Circuit is CLOSED — request passes through normally.";
    }

    setSimResult({ wouldPass, reason, currentState });
  };

  return (
    <form onSubmit={handleSimulate} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cb-sandbox-status" className="text-xs text-muted-foreground mb-1 block">
            Simulated Status Code
          </label>
          <select
            id="cb-sandbox-status"
            className="w-full h-8 rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
          >
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="204">204 No Content</option>
            <option value="301">301 Redirect</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="429">429 Rate Limited</option>
            <option value="500">500 Internal Error</option>
            <option value="502">502 Bad Gateway</option>
            <option value="503">503 Unavailable</option>
            <option value="504">504 Gateway Timeout</option>
          </select>
        </div>
        <div>
          <label htmlFor="cb-sandbox-latency" className="text-xs text-muted-foreground mb-1 block">
            Simulated Latency (ms)
          </label>
          <input
            id="cb-sandbox-latency"
            type="number"
            min={0}
            max={60000}
            className="w-full h-8 rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            value={latencyMs}
            onChange={(e) => setLatencyMs(e.target.value)}
          />
        </div>
      </div>

      <Button id="cb-sandbox-run" type="submit" size="sm" className="gap-1.5 text-xs w-fit">
        <Play className="h-3 w-3" />
        Simulate Request
      </Button>

      {simResult && (
        <div
          className={cn(
            "rounded-lg border p-3 space-y-1.5 transition-all duration-300",
            simResult.wouldPass
              ? "border-green-500/40 bg-green-500/10"
              : "border-red-500/40 bg-red-500/10"
          )}
        >
          <div className="flex items-center gap-2">
            {simResult.wouldPass
              ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            }
            <span className={cn("text-sm font-semibold", simResult.wouldPass ? "text-green-400" : "text-red-400")}>
              {simResult.wouldPass ? "Request Would Pass" : "Request Would Be Blocked"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{simResult.reason}</p>
          <div className="flex items-center gap-2 pt-1">
            <StateBadge state={simResult.currentState} />
            <span className="text-xs text-muted-foreground">
              → Status {statusCode}, {latencyMs}ms
            </span>
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Events Table ─────────────────────────────────────────────────────────────

function EventsTable({ projectId }: { projectId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCircuitBreakerEvents(projectId, { page, limit: 10 });
  const events = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / 10) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">State Transition Events</CardTitle>
        </div>
        <CardDescription className="text-xs">
          History of circuit state changes with reasons and AI diagnosis.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Activity className="h-8 w-8 opacity-20" />
            <p className="text-sm">No circuit breaker events yet</p>
            <p className="text-xs opacity-60">Events are recorded when the circuit state changes</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Transition</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">AI</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <TransitionArrow from={ev.fromState} to={ev.toState} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{ev.reason ?? "—"}</td>
                      <td className="px-4 py-3">
                        {ev.aiTriggered ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                            <Cpu className="h-2.5 w-2.5" /> AI
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {formatTime(ev.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} ({meta?.total} events)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    id="cb-events-prev"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    id="cb-events-next"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CircuitBreakerPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: cbState, isLoading } = useCircuitBreakerState(projectId);
  const reset = useResetCircuitBreaker(projectId);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Zap className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Circuit Breaker settings.</p>
      </div>
    );
  }

  const state = cbState?.state ?? "closed";
  const stateMeta = STATE_META[state];

  const failurePct = cbState ? (cbState.failureCount / Math.max(cbState.failureThreshold, 1)) : 0;
  const successPct = cbState ? (cbState.successCount / Math.max(cbState.successThreshold, 1)) : 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page header ─────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Circuit Breaker</h1>
            <p className="text-xs text-muted-foreground">Automatic origin fault isolation & recovery</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && cbState && <StateBadge state={state} />}
          <Button
            id="cb-reset-btn"
            variant={state === "open" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => reset.mutate()}
            disabled={reset.isPending || state === "closed"}
          >
            {reset.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            {state === "open" ? "Force Reset (Close)" : "Reset to Closed"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* ── State Hero Card ───────────────────────── */}
        <Card className="relative overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 pointer-events-none transition-all duration-500",
              state === "closed" && "bg-gradient-to-br from-green-500/5 via-transparent to-transparent",
              state === "open" && "bg-gradient-to-br from-red-500/8 via-transparent to-transparent",
              state === "half_open" && "bg-gradient-to-br from-yellow-500/6 via-transparent to-transparent",
            )}
          />
          <CardContent className="pt-6 pb-6">
            {isLoading ? (
              <div className="flex items-center gap-8">
                <Skeleton className="h-28 w-28 rounded-full" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <div className="flex gap-6 pt-2">
                    <Skeleton className="h-16 w-24" />
                    <Skeleton className="h-16 w-24" />
                    <Skeleton className="h-16 w-24" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Animated state circle */}
                <div className={cn(
                  "relative flex-shrink-0 h-28 w-28 rounded-full ring-4 flex items-center justify-center",
                  "bg-background/80",
                  stateMeta.ringColor
                )}>
                  <div className="absolute inset-0 rounded-full">
                    <CircleProgress
                      value={Math.round(Math.max(failurePct, successPct) * 100)}
                      max={100}
                      color={state === "closed" ? "text-green-500" : state === "open" ? "text-red-500" : "text-yellow-500"}
                    />
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    {stateMeta.icon}
                  </div>
                  {state !== "closed" && (
                    <span className={cn("absolute -top-1 -right-1 h-3 w-3 rounded-full animate-ping", stateMeta.pulseColor, "opacity-75")} />
                  )}
                </div>

                {/* State info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className={cn("text-2xl font-bold", stateMeta.color)}>{stateMeta.label}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{stateMeta.desc}</p>
                  </div>

                  {cbState?.aiDiagnosis && (
                    <div className="flex items-start gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                      <Cpu className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-300">{cbState.aiDiagnosis}</p>
                    </div>
                  )}

                  {/* Counters */}
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Failures</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tabular-nums text-red-400">{cbState?.failureCount ?? 0}</span>
                        <span className="text-sm text-muted-foreground">/ {cbState?.failureThreshold ?? 5} threshold</span>
                      </div>
                      {cbState && cbState.failureThreshold > 0 && (
                        <div className="mt-1 h-1 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(failurePct * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Successes</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tabular-nums text-green-400">{cbState?.successCount ?? 0}</span>
                        <span className="text-sm text-muted-foreground">/ {cbState?.successThreshold ?? 2} needed</span>
                      </div>
                      {cbState && cbState.successThreshold > 0 && (
                        <div className="mt-1 h-1 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(successPct * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Total Requests</div>
                      <div className="text-2xl font-bold tabular-nums">{cbState?.requestCount ?? 0}</div>
                    </div>

                    {cbState?.openedAt && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Opened At</div>
                        <div className="text-sm font-mono text-red-400">{formatTime(cbState.openedAt)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Config + Sandbox ─────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Config Thresholds */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Thresholds & Timing</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Current circuit breaker configuration. These values are managed by the Durable Object.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {[
                    {
                      label: "Failure Threshold",
                      value: cbState?.failureThreshold ?? 5,
                      desc: "Number of consecutive failures before the circuit opens",
                      icon: <XCircle className="h-4 w-4 text-red-400" />,
                      color: "text-red-400",
                    },
                    {
                      label: "Success Threshold",
                      value: cbState?.successThreshold ?? 2,
                      desc: "Consecutive successes needed in half-open state to close",
                      icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
                      color: "text-green-400",
                    },
                    {
                      label: "Timeout (probe interval)",
                      value: formatMs(cbState?.timeoutMs ?? 60000),
                      desc: "How long the circuit stays open before attempting a probe",
                      icon: <Clock className="h-4 w-4 text-yellow-400" />,
                      color: "text-yellow-400",
                    },
                  ].map(({ label, value, desc, icon, color }) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-start gap-2.5">
                        {icon}
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                      <span className={cn("font-mono text-xl font-bold tabular-nums shrink-0", color)}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sandbox */}
          <Card id="cb-sandbox-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Request Simulator</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Simulate an origin response and see what the circuit breaker would decide based on the current state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CircuitBreakerSandbox state={isLoading ? null : state} />
            </CardContent>
          </Card>
        </div>

        {/* ── State Machine Explainer ─────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
              {[
                {
                  state: "closed" as CircuitBreakerState,
                  title: "CLOSED",
                  desc: "Normal operation. All requests pass through. Failures increment a counter.",
                  next: "→ Opens after N failures",
                  color: "border-green-500/30 bg-green-500/5",
                  textColor: "text-green-400",
                },
                {
                  state: "open" as CircuitBreakerState,
                  title: "OPEN",
                  desc: "Failure threshold exceeded. All requests are immediately rejected (fast-fail).",
                  next: "→ Moves to half-open after timeout",
                  color: "border-red-500/30 bg-red-500/5",
                  textColor: "text-red-400",
                },
                {
                  state: "half_open" as CircuitBreakerState,
                  title: "HALF-OPEN",
                  desc: "Probing phase. A limited number of requests are allowed through to test recovery.",
                  next: "→ Closes on success, re-opens on failure",
                  color: "border-yellow-500/30 bg-yellow-500/5",
                  textColor: "text-yellow-400",
                },
              ].map((item, i) => (
                <div key={item.state} className="flex sm:flex-1 sm:flex-col items-start gap-3">
                  {i > 0 && (
                    <div className="hidden sm:flex h-full items-center px-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    </div>
                  )}
                  <div className={cn("flex-1 rounded-lg border p-4 space-y-1.5", item.color)}>
                    <div className={cn("text-xs font-bold tracking-widest", item.textColor)}>{item.title}</div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    <p className={cn("text-[10px] font-medium", item.textColor)}>{item.next}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Events Table ────────────────────────── */}
        <EventsTable projectId={projectId} />

      </div>
    </div>
  );
}
