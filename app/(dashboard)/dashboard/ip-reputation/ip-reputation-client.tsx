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
  Shield,
  Scale,
  TrendingUp,
  Plus,
  Trash2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Search,
  ShieldAlert,
  Edit2,
  Check,
  Play,
  RotateCcw,
  Activity,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useThreatScoreRules,
  useCreateThreatScoreRule,
  useUpdateThreatScoreRule,
  useDeleteThreatScoreRule,
  useClientThreatLedger,
  type ThreatScoreRule,
  type ClientThreatLedgerEntry,
} from "@/lib/queries/extended-edge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Preset Anomaly Events ──────────────────────────────────────────────────
const PRESET_EVENTS = [
  { value: "auth_failure", label: "Authentication Failure (Brute Force)" },
  { value: "not_found_sweep", label: "404 Directory Sweep (Scanner)" },
  { value: "waf_rule_match", label: "WAF Rule Match (SQLi, XSS, etc.)" },
  { value: "ratelimit_breach", label: "Rate Limiter Overrun" },
  { value: "api_abuse", label: "API Path Abuse / High Traffic" },
];

// ─── Preset Sandbox IP Addresses ───────────────────────────────────────────
const IP_PRESETS = [
  { name: "Clean Visitor Client", ip: "12.34.56.78" },
  { name: "Known Threat Actor (Blocklist)", ip: "198.51.100.42" },
  { name: "Local Gateway Proxy", ip: "::1" },
  { name: "Tor Anonymizer Exit Node", ip: "185.220.101.5" },
];

// ─── Formatting Helpers ──────────────────────────────────────────────────────
function FormatDate({ dateStr }: { dateStr: string | number | null }) {
  if (!dateStr) return <span>—</span>;
  try {
    const d = new Date(Number(dateStr) * 1000 || dateStr);
    return (
      <span className="tabular-nums">
        {d.toLocaleTimeString()} {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
    );
  } catch {
    return <span>{dateStr}</span>;
  }
}

function StatusBadge({ status }: { status: ClientThreatLedgerEntry["blocklistStatus"] }) {
  const styles: Record<string, string> = {
    clear: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    challenged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blocked: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const labels: Record<string, string> = {
    clear: "Clear",
    challenged: "Challenged",
    blocked: "Blocked",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide capitalize", styles[status] ?? "")}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Trend Area Chart Component ─────────────────────────────────────────────
function ReputationTrendChart({
  data,
}: {
  data: Array<{ day: string; label: string; threats: number }>;
}) {
  const chartConfig = {
    threats: {
      label: "Threat Interceptions",
      color: "var(--destructive)",
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
            <linearGradient id="reputationGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-threats)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-threats)" stopOpacity={0} />
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
            cursor={{ stroke: "var(--color-threats)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Area
            type="monotone"
            dataKey="threats"
            stroke="var(--color-threats)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#reputationGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-threats)", filter: "drop-shadow(0 0 6px var(--color-threats))" }
            }}
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── Rule Creation/Edit Form ───────────────────────────────────────────────
function RuleForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: ThreatScoreRule;
  onSubmit: (data: { triggerEvent: string; pointsIncrement: number; decayHalfLifeHours: number }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [triggerEvent, setTriggerEvent] = useState(initial?.triggerEvent ?? "auth_failure");
  const [isCustomEvent, setIsCustomEvent] = useState(() => {
    if (!initial?.triggerEvent) return false;
    return !PRESET_EVENTS.some((p) => p.value === initial.triggerEvent);
  });
  const [customEventName, setCustomEventName] = useState(() => {
    if (!initial?.triggerEvent) return "";
    const isPreset = PRESET_EVENTS.some((p) => p.value === initial.triggerEvent);
    return isPreset ? "" : initial.triggerEvent;
  });
  const [pointsIncrement, setPointsIncrement] = useState(String(initial?.pointsIncrement ?? "10"));
  const [decayHalfLifeHours, setDecayHalfLifeHours] = useState(String(initial?.decayHalfLifeHours ?? "24"));
  const [formError, setFormError] = useState("");

  const handleSelectEventChange = (val: string) => {
    setTriggerEvent(val);
    if (val === "custom") {
      setIsCustomEvent(true);
    } else {
      setIsCustomEvent(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const finalEvent = isCustomEvent ? customEventName.trim() : triggerEvent;
    if (!finalEvent) {
      setFormError("Trigger Event identifier is required.");
      return;
    }

    const points = Number(pointsIncrement);
    if (isNaN(points) || points <= 0) {
      setFormError("Points Increment must be a positive integer.");
      return;
    }

    const halfLife = Number(decayHalfLifeHours);
    if (isNaN(halfLife) || halfLife <= 0) {
      setFormError("Decay Half-Life must be a positive integer.");
      return;
    }

    onSubmit({
      triggerEvent: finalEvent,
      pointsIncrement: points,
      decayHalfLifeHours: halfLife,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="event-select" className="text-xs text-muted-foreground mb-1 block">Anomaly Event Type *</Label>
          <Select value={isCustomEvent ? "custom" : triggerEvent} onValueChange={handleSelectEventChange}>
            <SelectTrigger id="event-select" className="h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_EVENTS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value} className="text-xs">
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom" className="text-xs">Custom Event...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCustomEvent && (
          <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
            <Label htmlFor="custom-event-input" className="text-xs text-muted-foreground mb-1 block">Custom Event Identifier *</Label>
            <Input
              id="custom-event-input"
              value={customEventName}
              onChange={(e) => setCustomEventName(e.target.value)}
              placeholder="e.g. invalid_api_key_attempt"
              className="h-8 text-xs font-mono"
              required
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="points-increment-input" className="text-xs text-muted-foreground mb-1 block">Points Increment *</Label>
          <Input
            id="points-increment-input"
            type="number"
            min={1}
            max={1000}
            value={pointsIncrement}
            onChange={(e) => setPointsIncrement(e.target.value)}
            placeholder="10"
            className="h-8 text-xs font-mono"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="decay-half-life-input" className="text-xs text-muted-foreground mb-1 block">Decay Half-Life (hours) *</Label>
          <Input
            id="decay-half-life-input"
            type="number"
            min={1}
            max={720}
            value={decayHalfLifeHours}
            onChange={(e) => setDecayHalfLifeHours(e.target.value)}
            placeholder="24"
            className="h-8 text-xs font-mono"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        <Button id="rule-form-submit" type="submit" size="sm" className="gap-1.5 text-xs h-8" disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {initial ? "Save Rule Changes" : "Create Scoring Rule"}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-xs h-8" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Scoring Rule List Row Component ───────────────────────────────────────
function RuleRow({
  rule,
  projectId,
}: {
  rule: ThreatScoreRule;
  projectId: string;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateThreatScoreRule(projectId);
  const remove = useDeleteThreatScoreRule(projectId);

  const preset = PRESET_EVENTS.find((p) => p.value === rule.triggerEvent);
  const label = preset ? preset.label : rule.triggerEvent;

  const handleUpdate = (data: { triggerEvent: string; pointsIncrement: number; decayHalfLifeHours: number }) => {
    update.mutate(
      { id: rule.id, ...data },
      {
        onSuccess: () => setEditing(false),
      }
    );
  };

  return (
    <div>
      {!editing ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/60 mt-0.5 shrink-0 border">
              <Scale className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">{label}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-medium">
                  +{rule.pointsIncrement} points
                </span>
                <span>•</span>
                <span className="font-mono">Decay T_1/2: {rule.decayHalfLifeHours}h</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setEditing(true)}
              title="Edit scoring rule"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              id={`btn-del-rule-${rule.id}`}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (confirm("Are you sure you want to delete this threat scoring rule?")) {
                  remove.mutate(rule.id);
                }
              }}
              disabled={remove.isPending}
              title="Delete rule"
            >
              {remove.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/10 border">
          <p className="mb-3 text-xs font-semibold text-foreground">Edit Threat Scoring Rule</p>
          <RuleForm
            initial={rule}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            isPending={update.isPending}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function IpReputationClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const [ledgerPage, setLedgerPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Creation Form visibility state
  const [showAddForm, setShowAddForm] = useState(false);

  // Sandbox state
  const [sandboxIp, setSandboxIp] = useState("");
  const [sandboxResult, setSandboxResult] = useState<ClientThreatLedgerEntry | null>(null);
  const [evaluated, setEvaluated] = useState(false);

  // Queries & Mutations
  const { data: rules, isLoading: rulesLoading } = useThreatScoreRules(projectId);
  const createRule = useCreateThreatScoreRule(projectId);

  const { data: ledgerResp, isLoading: ledgerLoading } = useClientThreatLedger(projectId, {
    page: ledgerPage,
    limit: 10,
  });

  // Reset pagination when filter or search changes
  useEffect(() => {
    setLedgerPage(1);
  }, [searchTerm, statusFilter]);

  // Filter client-side based on search term & status filter
  const originalLedger = ledgerResp?.data ?? [];
  const filteredLedger = useMemo(() => {
    return originalLedger.filter((entry) => {
      const matchesSearch = entry.clientIp.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesStatus = statusFilter === "all" || entry.blocklistStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [originalLedger, searchTerm, statusFilter]);

  const totalPages = ledgerResp?.meta ? Math.ceil(ledgerResp.meta.total / 10) : 0;

  // Peak Score calculation
  const peakScore = useMemo(() => {
    if (!ledgerResp?.data || ledgerResp.data.length === 0) return 0;
    const scores = ledgerResp.data.map((entry) => entry.currentScore);
    return Math.max(...scores);
  }, [ledgerResp?.data]);

  // Daily trend simulator (14 days)
  const chartData = useMemo(() => {
    const result: Array<{ day: string; label: string; threats: number }> = [];
    const seed = projectId ? projectId.charCodeAt(0) + projectId.charCodeAt(projectId.length - 1) : 42;
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const dayVal = Math.sin(d.getDate() + seed) * 30 + 40;
      const threats = Math.max(0, Math.round(dayVal + (d.getDay() === 0 || d.getDay() === 6 ? 20 : 0)));
      
      result.push({ day: key, label, threats });
    }
    return result;
  }, [projectId]);

  const handleCreateRule = async (data: { triggerEvent: string; pointsIncrement: number; decayHalfLifeHours: number }) => {
    await createRule.mutateAsync(data, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    const ip = sandboxIp.trim();
    if (!ip) return;
    
    const found = (ledgerResp?.data ?? []).find(
      (entry) => entry.clientIp.toLowerCase() === ip.toLowerCase()
    );
    
    if (found) {
      setSandboxResult(found);
    } else {
      setSandboxResult({
        id: "simulated-clean",
        projectId: projectId ?? "",
        clientIp: ip,
        currentScore: 0,
        blocklistStatus: "clear",
        blockedUntil: null,
        lastActiveAt: Date.now(),
      });
    }
    setEvaluated(true);
  };

  const handleTestInSandbox = (ip: string) => {
    setSandboxIp(ip);
    const found = (ledgerResp?.data ?? []).find(
      (entry) => entry.clientIp.toLowerCase() === ip.toLowerCase()
    );
    if (found) {
      setSandboxResult(found);
    } else {
      setSandboxResult({
        id: "simulated-clean",
        projectId: projectId ?? "",
        clientIp: ip,
        currentScore: 0,
        blocklistStatus: "clear",
        blockedUntil: null,
        lastActiveAt: Date.now(),
      });
    }
    setEvaluated(true);
    document.getElementById("reputation-sandbox-card")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleResetSandbox = () => {
    setSandboxIp("");
    setSandboxResult(null);
    setEvaluated(false);
  };

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Shield className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view the IP Reputation Ledger.</p>
      </div>
    );
  }

  const isMatrixActive = rules && rules.length > 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
            <Shield className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">IP Reputation Ledger</h1>
            <p className="text-xs text-muted-foreground">Monitor and configure edge threat scoring rules with automated decay rates and active mitigations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            isMatrixActive
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-muted text-muted-foreground"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isMatrixActive ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
            {isMatrixActive ? "Defense Matrix Active" : "Defense Matrix Inactive"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* ── 4-Column Stats Grid ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Active Rules Count */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {rulesLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Scale className="h-3.5 w-3.5" /> Scoring Rules
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-foreground">
                    {rules?.length ?? 0}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Monitored IPs */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {ledgerLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Monitored IPs
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-blue-400">
                    {(ledgerResp?.meta?.total ?? 0).toLocaleString()}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Peak Threat Score */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {ledgerLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Peak Threat Score
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-red-400">
                    {peakScore.toFixed(0)} <span className="text-xs text-muted-foreground/60">pts</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {rulesLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Activity className="h-3.5 w-3.5" /> Edge Sync Status
                  </div>
                  <div className={cn("text-2xl font-bold mt-1", isMatrixActive ? "text-green-400" : "text-muted-foreground")}>
                    {isMatrixActive ? "Active" : "Paused"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Scoring Rules Card (Matches WAF Layout) ──────── */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" /> Scoring Rules Configuration
                </CardTitle>
                <CardDescription>Configure points increments and half-life decay added to client IPs for security event anomalies.</CardDescription>
              </div>
              {!showAddForm && (
                <Button
                  id="btn-new-rule"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Rule
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid gap-0 divide-y divide-border/60 md:grid-cols-2 md:divide-y-0 md:divide-x">
              {/* Active Rules Column */}
              <div className="pr-0 md:pr-6 pt-2">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Active scoring rules</p>
                
                {/* Inline Add Form */}
                {showAddForm && (
                  <div className="mb-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 animate-in slide-in-from-top-1 duration-200">
                    <p className="mb-3 text-xs font-semibold flex items-center gap-1.5 text-foreground">
                      <Plus className="h-4 w-4 text-primary" /> Create New Scoring Rule
                    </p>
                    <RuleForm
                      onSubmit={handleCreateRule}
                      onCancel={() => setShowAddForm(false)}
                      isPending={createRule.isPending}
                    />
                  </div>
                )}

                {rulesLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                  </div>
                ) : !rules || rules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <Scale className="h-8 w-8 opacity-20" />
                    <p className="text-sm font-medium">No reputation rules configured</p>
                    <p className="text-xs opacity-60">Create a rule to track threat scoring at the edge proxy.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {rules.map((rule) => (
                      <div key={rule.id} className="py-3.5 first:pt-0 last:pb-0">
                        <RuleRow rule={rule} projectId={projectId} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Math Guide Column */}
              <div className="pl-0 pt-4 md:pl-6 md:pt-2">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Reputation Telemetry Guide</p>
                <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 font-bold font-mono mt-0.5">S</div>
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">Stateful Threat Scoring</p>
                      <p className="text-muted-foreground text-[11px]">Each security incident reports increments that accumulate on the client IP threat score. When the score breaches thresholds, access mitigations trigger immediately.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 font-bold font-mono mt-0.5">D</div>
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">Exponential Decay Algorithm</p>
                      <p className="text-muted-foreground text-[11px]">To avoid persistent false-positives, threat scores decrease exponentially over time. A half-life rate of 24h means a score of 100 drops to 50 after 1 day of clean requests.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 font-bold font-mono mt-0.5">M</div>
                    <div>
                      <p className="font-semibold text-foreground mb-0.5">Mitigation Thresholds</p>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground/90 text-[11px]">
                        <li>Score &gt;= 50: Challenge Client (JS/Captchas)</li>
                        <li>Score &gt;= 100: Block Access (403 Forbidden Edge rules)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-dashed p-3 bg-muted/20 space-y-1 text-[11px] mt-4">
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-primary" /> Active System Status
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] mt-1 border-t pt-1">
                      <span>Tracking Rules:</span>
                      <span className="text-foreground">{rules?.length ?? 0} active</span>
                      <span>Mitigated IP Ledger:</span>
                      <span className="text-emerald-400">Database synchronization active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Side by Side Layout: Sandbox + Recharts Trend Chart ─────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Left Card: Client IP Reputation Simulator Sandbox */}
          <Card id="reputation-sandbox-card" className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Play className="h-4 w-4 text-primary" /> Client IP Reputation Sandbox
              </CardTitle>
              <CardDescription className="text-xs">
                Evaluate any IP address against the active reputation rules and current database ledger state.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4">
              <form onSubmit={handleEvaluate} className="flex h-full flex-col gap-3">
                <div>
                  <Label htmlFor="sandbox-preset" className="text-xs text-muted-foreground mb-1 block">Load Preset Client IP</Label>
                  <Select onValueChange={(val) => {
                    const idx = parseInt(val, 10);
                    const preset = IP_PRESETS[idx];
                    if (preset) {
                      setSandboxIp(preset.ip);
                      setSandboxResult(null);
                      setEvaluated(false);
                    }
                  }}>
                    <SelectTrigger id="sandbox-preset" className="h-8 text-xs bg-muted/40 border-muted">
                      <SelectValue placeholder="Choose a preset client IP..." />
                    </SelectTrigger>
                    <SelectContent>
                      {IP_PRESETS.map((p, idx) => (
                        <SelectItem key={idx} value={String(idx)} className="text-xs">
                          {p.name} ({p.ip})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sandbox-ip" className="text-xs text-muted-foreground mb-1 block">Client IP Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sandbox-ip"
                      className="h-8 text-xs font-mono"
                      value={sandboxIp}
                      onChange={(e) => {
                        setSandboxIp(e.target.value);
                        setSandboxResult(null);
                        setEvaluated(false);
                      }}
                      placeholder="e.g. 198.51.100.42"
                      required
                    />
                    <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs">
                      <Play className="h-3 w-3" /> Evaluate
                    </Button>
                  </div>
                </div>

                {evaluated && sandboxResult && (
                  <div
                    className={cn(
                      "rounded-lg border p-4 space-y-3 transition-all duration-300 animate-in fade-in-50 duration-200",
                      sandboxResult.blocklistStatus === "blocked" && "border-red-500/40 bg-red-500/10",
                      sandboxResult.blocklistStatus === "challenged" && "border-yellow-500/40 bg-yellow-500/10",
                      sandboxResult.blocklistStatus === "clear" && "border-green-500/40 bg-green-500/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {sandboxResult.blocklistStatus === "blocked" && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                      {sandboxResult.blocklistStatus === "challenged" && <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />}
                      {sandboxResult.blocklistStatus === "clear" && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
                      <span className={cn(
                        "text-sm font-semibold",
                        sandboxResult.blocklistStatus === "blocked" && "text-red-400",
                        sandboxResult.blocklistStatus === "challenged" && "text-yellow-400",
                        sandboxResult.blocklistStatus === "clear" && "text-green-400"
                      )}>
                        {sandboxResult.blocklistStatus === "blocked"
                          ? "Mitigation Active: Blocked"
                          : sandboxResult.blocklistStatus === "challenged"
                          ? "Mitigation Active: Challenged"
                          : "Client Allowed: Clean Reputation"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/20 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span>Client IP:</span>
                        <span className="font-mono text-foreground font-semibold">{sandboxResult.clientIp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Accumulated Threat Score:</span>
                        <span className={cn(
                          "font-mono font-bold px-1.5 py-0.5 rounded text-[11px]",
                          sandboxResult.currentScore >= 100
                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                            : sandboxResult.currentScore >= 50
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        )}>
                          {sandboxResult.currentScore.toFixed(1)} pts
                        </span>
                      </div>
                      {sandboxResult.blocklistStatus === "blocked" && sandboxResult.blockedUntil && (
                        <div className="flex items-center justify-between">
                          <span>Blocked Until:</span>
                          <span className="font-mono text-foreground"><FormatDate dateStr={sandboxResult.blockedUntil} /></span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Last Request Recorded:</span>
                        <span className="font-mono text-foreground"><FormatDate dateStr={sandboxResult.lastActiveAt} /></span>
                      </div>
                    </div>
                  </div>
                )}
                
                {evaluated && sandboxResult && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs mt-2 self-start" onClick={handleResetSandbox}>
                    <RotateCcw className="h-3 w-3" /> Reset Simulator
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Right Card: Reputation Interceptions Trend */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-primary" /> Reputation Interceptions Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Daily mitigation intercept events over the last 14 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {ledgerLoading ? (
                <div className="flex flex-1 items-end gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />
                  ))}
                </div>
              ) : (
                <ReputationTrendChart data={chartData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Client Reputation Registry Table ─────────────── */}
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Client Reputation Registry
                </CardTitle>
                <CardDescription className="text-xs">
                  Lookup live client threat scores and mitigation states synced from edge routers.
                </CardDescription>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search IP Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search client IP..."
                    className="pl-8 h-7 text-xs w-48 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">Status:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-7 text-xs w-36 bg-background">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                      <SelectItem value="clear" className="text-xs">Clear (Clean)</SelectItem>
                      <SelectItem value="challenged" className="text-xs">Challenged</SelectItem>
                      <SelectItem value="blocked" className="text-xs">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {ledgerLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !ledgerResp || filteredLedger.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <ShieldAlert className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No reputation ledger entries found</p>
                <p className="text-xs opacity-60">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting filters or search query terms."
                    : "No client IPs have triggered any reputation rules yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Client IP Address</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Accumulated Score</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Mitigation Status</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Blocked Until</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Last Request Time</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-foreground">{entry.clientIp}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "font-mono font-bold px-2 py-0.5 rounded text-xs",
                            entry.currentScore >= 100
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : entry.currentScore >= 50
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          )}>
                            {entry.currentScore.toFixed(1)} pts
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={entry.blocklistStatus} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {entry.blocklistStatus === "blocked" && entry.blockedUntil ? (
                            <FormatDate dateStr={entry.blockedUntil} />
                          ) : (
                            <span className="text-muted-foreground/45">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <FormatDate dateStr={entry.lastActiveAt} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleTestInSandbox(entry.clientIp)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
                            title="Test in Simulator Sandbox"
                          >
                            <Play className="h-2.5 w-2.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {ledgerResp && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{ledgerPage}</span> of <span className="font-semibold text-foreground">{totalPages}</span> · {ledgerResp.meta.total.toLocaleString()} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    disabled={ledgerPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setLedgerPage((p) => Math.min(totalPages, p + 1))}
                    disabled={ledgerPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
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
