"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Database,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Settings2,
  Layers,
  FlaskConical,
  BarChart3,
  Cpu,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useCacheConfig,
  useUpdateCacheConfig,
  useResetCacheConfig,
  useCacheRules,
  useCreateCacheRule,
  useDeleteCacheRule,
  useCacheSandbox,
  useCacheStats,
  type CacheRule,
  type CacheSandboxResult,
} from "@/lib/queries/cache";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  HIT: {
    label: "HIT",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  MISS: {
    label: "MISS",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  BYPASS: {
    label: "BYPASS",
    color: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
  STALE: {
    label: "STALE",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "bg-muted text-muted-foreground border-border", icon: null };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", meta.color)}>
      {meta.icon}
      {meta.label}
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
        type="button"
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

function SliderField({
  label,
  description,
  value,
  min,
  max,
  step,
  unit,
  formatValue,
  onChange,
  onCommit,
  disabled,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
  disabled?: boolean;
}) {
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ""}`;
  return (
    <div className={cn("space-y-2 py-2 transition-opacity duration-200", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <span className="font-mono text-sm font-semibold text-primary tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={(e) => onCommit(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onCommit(Number((e.target as HTMLInputElement).value))}
        disabled={disabled}
        className="w-full accent-primary cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatValue ? formatValue(min) : `${min}${unit ?? ""}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit ?? ""}`}</span>
      </div>
    </div>
  );
}

function formatTtl(sec: number): string {
  if (sec === 0) return "0s (disabled)";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accentClass,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accentClass?: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute inset-0 pointer-events-none", accentClass ?? "bg-gradient-to-br from-primary/5 to-transparent")} />
      <CardContent className="pt-4 pb-4">
        {loading ? (
          <Skeleton className="h-12 w-28" />
        ) : (
          <>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              {icon}
              {label}
            </div>
            <div className="text-3xl font-bold tabular-nums">{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cache Rules Table ────────────────────────────────────────────────────────

function CacheRulesSection({ projectId }: { projectId: string }) {
  const { data: rules, isLoading } = useCacheRules(projectId);
  const createRule = useCreateCacheRule(projectId);
  const deleteRule = useDeleteCacheRule(projectId);

  const [form, setForm] = useState({
    pathPattern: "",
    method: "GET",
    ttlSec: 300,
    bypassCache: false,
    priority: 100,
  });
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRule.mutateAsync(form);
      setForm({ pathPattern: "", method: "GET", ttlSec: 300, bypassCache: false, priority: 100 });
      setShowForm(false);
    } catch {
      // Keep form open to allow viewing the error displayed inline
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Cache Rules</CardTitle>
          </div>
          <Button
            id="cache-add-rule-btn"
            size="sm"
            variant={showForm ? "ghost" : "outline"}
            className="gap-1.5 text-xs"
            onClick={() => {
              createRule.reset();
              setShowForm((v) => !v);
            }}
          >
            <Plus className="h-3 w-3" />
            Add Rule
          </Button>
        </div>
        <CardDescription className="text-xs">
          Path-specific TTL overrides. Rules are evaluated in priority order (lower = higher priority).
        </CardDescription>
      </CardHeader>

      {showForm && (
        <CardContent className="border-b pb-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {createRule.isError && (
              <div className="col-span-full rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-1.5 animate-in fade-in duration-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <span>{(createRule.error as Error)?.message ?? "Failed to create cache rule."}</span>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Path Pattern</Label>
              <Input
                id="cache-rule-path"
                className="h-8 text-xs font-mono"
                placeholder="/api/v1/products/*"
                value={form.pathPattern}
                onChange={(e) => setForm((p) => ({ ...p, pathPattern: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm((p) => ({ ...p, method: v }))}>
                <SelectTrigger id="cache-rule-method" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "*"].map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">TTL (seconds)</Label>
              <Input
                id="cache-rule-ttl"
                className="h-8 text-xs"
                type="number"
                min={0}
                value={form.ttlSec}
                onChange={(e) => setForm((p) => ({ ...p, ttlSec: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Priority</Label>
              <Input
                id="cache-rule-priority"
                className="h-8 text-xs"
                type="number"
                min={1}
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-2 col-span-full">
              <Toggle
                label="Bypass Cache"
                description="Requests matching this pattern will always skip the cache"
                checked={form.bypassCache}
                onChange={(v) => setForm((p) => ({ ...p, bypassCache: v }))}
              />
            </div>
            <div className="col-span-full flex gap-2">
              <Button id="cache-rule-submit" type="submit" size="sm" className="text-xs gap-1.5" disabled={createRule.isPending}>
                {createRule.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                {createRule.isPending ? "Creating..." : "Create Rule"}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      )}

      <CardContent className="pt-4 p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !rules || rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Layers className="h-8 w-8 opacity-20" />
            <p className="text-sm">No cache rules yet</p>
            <p className="text-xs opacity-60">Add a rule to override TTL for specific paths</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Path Pattern</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">TTL</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Bypass</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{rule.priority}</td>
                    <td className="px-4 py-2.5 font-mono text-foreground">{rule.pathPattern}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-[10px]">{rule.method}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums">
                      {rule.bypassCache ? <span className="text-muted-foreground">bypass</span> : formatTtl(rule.ttlSec)}
                    </td>
                    <td className="px-4 py-2.5">
                      {rule.bypassCache ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          <XCircle className="h-2.5 w-2.5" /> Bypass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Cache
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {rule.isEnabled ? (
                        <span className="text-green-400 text-[10px]">Enabled</span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">Disabled</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        id={`delete-cache-rule-${rule.id}`}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this cache rule?")) {
                            await deleteRule.mutateAsync(rule.id);
                          }
                        }}
                        disabled={deleteRule.isPending}
                      >
                        {deleteRule.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cache Sandbox ─────────────────────────────────────────────────────────────

const SANDBOX_PRESETS = [
  {
    name: "Static Asset (JS/CSS)",
    method: "GET",
    path: "/static/app.bundle.js",
    queryString: "",
    headers: { "Accept": "application/javascript" },
  },
  {
    name: "API Endpoint (Products)",
    method: "GET",
    path: "/api/v1/products",
    queryString: "page=1&limit=20",
    headers: { "Accept": "application/json" },
  },
  {
    name: "POST Request (Write)",
    method: "POST",
    path: "/api/v1/orders",
    queryString: "",
    headers: { "Content-Type": "application/json" },
  },
  {
    name: "User Profile (Vary by Cookie)",
    method: "GET",
    path: "/api/v1/me",
    queryString: "",
    headers: { "Cookie": "session=abc123", "Accept": "application/json" },
  },
  {
    name: "Admin Endpoint (Bypass)",
    method: "GET",
    path: "/admin/users",
    queryString: "",
    headers: { "Authorization": "Bearer token" },
  },
];

function CacheSandbox({ projectId }: { projectId: string }) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/v1/products");
  const [queryString, setQueryString] = useState("page=1");
  const [headersRaw, setHeadersRaw] = useState('{\n  "Accept": "application/json"\n}');
  const [result, setResult] = useState<CacheSandboxResult | null>(null);
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");
  const sandbox = useCacheSandbox(projectId);

  const handlePreset = (idxStr: string) => {
    const p = SANDBOX_PRESETS[parseInt(idxStr)];
    if (!p) return;
    setMethod(p.method);
    setPath(p.path);
    setQueryString(p.queryString);
    setHeadersRaw(JSON.stringify(p.headers, null, 2));
    setResult(null);
    setResponseTab("body");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let headers: Record<string, string> = {};
    try {
      if (headersRaw.trim()) headers = JSON.parse(headersRaw);
    } catch {
      alert("Invalid JSON in Headers field");
      return;
    }
    try {
      const res = await sandbox.mutateAsync({ method, path, queryString, headers });
      setResult(res);
    } catch {
      setResult(null);
    }
  };

  const handleReset = () => {
    setResult(null);
    setResponseTab("body");
    sandbox.reset();
  };

  const isHit = result?.status === "HIT";
  const isMiss = result?.status === "MISS";
  const isBypass = result?.status === "BYPASS";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="cache-sandbox-preset" className="text-xs text-muted-foreground mb-1 block">
          Load Preset
        </Label>
        <Select onValueChange={handlePreset}>
          <SelectTrigger id="cache-sandbox-preset" className="h-8 text-xs bg-muted/40 border-muted">
            <SelectValue placeholder="Choose a request template..." />
          </SelectTrigger>
          <SelectContent>
            {SANDBOX_PRESETS.map((p, i) => (
              <SelectItem key={i} value={String(i)} className="text-xs">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="cache-sandbox-method" className="text-xs text-muted-foreground mb-1 block">Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger id="cache-sandbox-method" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label htmlFor="cache-sandbox-path" className="text-xs text-muted-foreground mb-1 block">Path</Label>
          <Input
            id="cache-sandbox-path"
            className="h-8 text-xs font-mono"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/api/v1/endpoint"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cache-sandbox-qs" className="text-xs text-muted-foreground mb-1 block">
          Query String <span className="text-muted-foreground/60">(without ?)</span>
        </Label>
        <Input
          id="cache-sandbox-qs"
          className="h-8 text-xs font-mono"
          value={queryString}
          onChange={(e) => setQueryString(e.target.value)}
          placeholder="page=1&limit=20"
        />
      </div>

      <div>
        <Label htmlFor="cache-sandbox-headers" className="text-xs text-muted-foreground mb-1 block">
          Headers <span className="text-muted-foreground/60">(JSON)</span>
        </Label>
        <textarea
          id="cache-sandbox-headers"
          className="w-full rounded-md border bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring h-20 text-foreground placeholder:text-muted-foreground"
          value={headersRaw}
          onChange={(e) => setHeadersRaw(e.target.value)}
          placeholder='{"Accept": "application/json"}'
        />
      </div>

      <div className="flex items-center gap-2">
        <Button id="cache-sandbox-run" type="submit" size="sm" className="gap-1.5 text-xs" disabled={sandbox.isPending}>
          {sandbox.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {sandbox.isPending ? "Evaluating…" : "Evaluate Request"}
        </Button>
        {result && (
          <Button id="cache-sandbox-reset" type="button" variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      {sandbox.isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Evaluation failed — check your project has cache configured.
        </div>
      )}

      {result && (
        <div
          className={cn(
            "rounded-lg border p-4 space-y-3 transition-all duration-300",
            isHit && "border-green-500/40 bg-green-500/10",
            isMiss && "border-yellow-500/40 bg-yellow-500/10",
            isBypass && "border-slate-500/30 bg-muted/30"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isHit && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
              {isMiss && <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />}
              {isBypass && <XCircle className="h-4 w-4 text-slate-400 shrink-0" />}
              <span className={cn("text-sm font-semibold", isHit && "text-green-400", isMiss && "text-yellow-400", isBypass && "text-slate-400")}>
                {isHit ? "Cache Hit" : isMiss ? "Cache Miss" : "Bypassed"}
              </span>
              <StatusBadge status={result.status} />
              {result.latencyMs !== undefined && (
                <span className="inline-flex items-center rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-border/40">
                  {result.latencyMs}ms
                </span>
              )}
            </div>

            {result.response && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Status:</span>
                <span className={cn(
                  "font-mono font-semibold px-1.5 py-0.5 rounded",
                  result.response.status >= 200 && result.response.status < 300
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                )}>
                  {result.response.status}
                </span>
                {result.latencyMs !== undefined && (
                  <span className="text-muted-foreground ml-2">
                    Latency: <span className="font-mono text-primary font-semibold">{result.latencyMs}ms</span>
                  </span>
                )}
                {result.response.age !== undefined && (
                  <span className="text-muted-foreground ml-2">
                    Age: <span className="font-mono text-primary font-semibold">{result.response.age}s</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            {result.ttlSec > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-muted-foreground">TTL:</span>
                <span className="font-mono text-primary font-semibold">{formatTtl(result.ttlSec)}</span>
              </div>
            )}
            {result.cacheKey && (
              <div className="flex items-start gap-2">
                <span className="w-24 shrink-0 text-muted-foreground">Cache Key:</span>
                <code className="break-all text-[10px] bg-muted/50 rounded px-1.5 py-0.5 text-foreground/80">{result.cacheKey}</code>
              </div>
            )}
            {result.matchedRule && (
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-muted-foreground">Matched Rule:</span>
                <span className="font-mono text-yellow-400">{result.matchedRule.pathPattern}</span>
                <span className="text-muted-foreground">(priority {result.matchedRule.priority})</span>
              </div>
            )}
            {(result.varyBy.headers.length > 0 || result.varyBy.queryParams.length > 0) && (
              <div className="flex items-start gap-2">
                <span className="w-24 shrink-0 text-muted-foreground">Varies By:</span>
                <span className="text-foreground/70">
                  {[
                    ...result.varyBy.headers.map((h) => `header:${h}`),
                    ...result.varyBy.queryParams.map((q) => `query:${q}`),
                  ].join(", ") || "none"}
                </span>
              </div>
            )}
          </div>

          {result.response && (
            <div className="border-t border-border/30 pt-3 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">API Response</p>
                <div className="flex rounded-md bg-muted/60 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setResponseTab("body")}
                    className={cn(
                      "px-2 py-0.5 rounded-sm transition-colors",
                      responseTab === "body" ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Body
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseTab("headers")}
                    className={cn(
                      "px-2 py-0.5 rounded-sm transition-colors",
                      responseTab === "headers" ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Headers
                  </button>
                </div>
              </div>

              {responseTab === "body" ? (
                <pre className="max-h-[200px] overflow-y-auto rounded-lg border bg-muted/30 p-2.5 font-mono text-[10px] text-foreground/85 break-all whitespace-pre-wrap scrollbar-thin">
                  {result.response.body || <span className="text-muted-foreground italic">Empty Response Body</span>}
                </pre>
              ) : (
                <div className="max-h-[200px] overflow-y-auto rounded-lg border bg-muted/30 p-2.5 font-mono text-[10px] space-y-1.5 scrollbar-thin">
                  {Object.entries(result.response.headers).map(([key, val]) => (
                    <div key={key} className="flex gap-2 break-all border-b border-border/30 pb-1 last:border-0 last:pb-0">
                      <span className="text-primary font-medium shrink-0">{key}:</span>
                      <span className="text-muted-foreground">{val}</span>
                    </div>
                  ))}
                  {Object.keys(result.response.headers).length === 0 && (
                    <p className="text-muted-foreground italic text-center py-2">No headers</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}

// ─── Vary-By Tag Input ────────────────────────────────────────────────────────

function TagInput({
  id,
  label,
  description,
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  id: string;
  label: string;
  description?: string;
  tags: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
  placeholder?: string;
}) {
  const [val, setVal] = useState("");
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const v = val.trim();
    if (!v || tags.includes(v)) return;
    onAdd(v);
    setVal("");
  };
  return (
    <div className="space-y-1.5 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
            {t}
            <button type="button" onClick={() => onRemove(t)} className="hover:text-red-400 transition-colors">×</button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-muted-foreground italic">None configured</span>}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          id={id}
          className="h-7 text-xs font-mono"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
        />
        <Button type="submit" size="sm" variant="outline" className="h-7 text-xs px-2">Add</Button>
      </form>
    </div>
  );
}

// ─── Cache Usage Chart ──────────────────────────────────────────────────────────

function CacheUsageChart({ data }: { data: any[] }) {
  const chartConfig = {
    edgeTraffic: {
      label: "Real Edge Traffic",
      color: "var(--chart-1)",
    },
    sandboxCalls: {
      label: "Sandbox Calls (Billing)",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig;

  return (
    <div className="h-[320px] w-full mt-2">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <RechartsLineChart
          data={data}
          margin={{
            top: 20,
            right: 15,
            left: -20,
            bottom: 0,
          }}
        >
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
            cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent />}
          />
          <Line
            type="monotone"
            dataKey="edgeTraffic"
            stroke="var(--color-edgeTraffic)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              style: { fill: "var(--color-edgeTraffic)", filter: "drop-shadow(0 0 4px var(--color-edgeTraffic))" }
            }}
            name="Real Edge Traffic"
          />
          <Line
            type="monotone"
            dataKey="sandboxCalls"
            stroke="var(--color-sandboxCalls)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              style: { fill: "var(--color-sandboxCalls)", filter: "drop-shadow(0 0 4px var(--color-sandboxCalls))" }
            }}
            name="Sandbox Calls (Billing)"
          />
        </RechartsLineChart>
      </ChartContainer>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CachePage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: config, isLoading: configLoading } = useCacheConfig(projectId);
  const updateConfig = useUpdateCacheConfig(projectId);
  const resetConfig = useResetCacheConfig(projectId);
  const { data: stats, isLoading: statsLoading } = useCacheStats(projectId);

  const chartData = useMemo(() => {
    if (!stats?.dailyTrend) return [];
    return stats.dailyTrend.map((d) => ({
      label: d.label,
      edgeTraffic: d.hits + d.misses + d.bypasses,
      sandboxCalls: d.sandboxCalls,
    }));
  }, [stats?.dailyTrend]);

  // Local TTL state (to allow slider dragging without API call on every tick)
  const [defaultTtl, setDefaultTtl] = useState(300);
  const [maxTtl, setMaxTtl] = useState(86400);
  const [swrSec, setSwrSec] = useState(60);
  const [sieSec, setSieSec] = useState(3600);
  const [dbCacheDefaultTtl, setDbCacheDefaultTtl] = useState(60);

  // Sync from server
  useEffect(() => {
    if (config) {
      setDefaultTtl(config.defaultTtlSec);
      setMaxTtl(config.maxTtlSec);
      setSwrSec(config.staleWhileRevalidateSec);
      setSieSec(config.staleIfErrorSec);
      setDbCacheDefaultTtl(config.dbCacheDefaultTtlSec);
    }
  }, [
    config?.defaultTtlSec,
    config?.maxTtlSec,
    config?.staleWhileRevalidateSec,
    config?.staleIfErrorSec,
    config?.dbCacheDefaultTtlSec,
  ]);

  const varyByHeaders = useMemo(() => {
    try { return JSON.parse(config?.varyByHeaders ?? "[]") as string[]; } catch { return []; }
  }, [config?.varyByHeaders]);

  const varyByQueryParams = useMemo(() => {
    try { return JSON.parse(config?.varyByQueryParams ?? "[]") as string[]; } catch { return []; }
  }, [config?.varyByQueryParams]);

  const handleToggle = (field: string) => (value: boolean) => {
    if (!projectId) return;
    updateConfig.mutate({ [field]: value } as any);
  };

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Database className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Cache settings.</p>
      </div>
    );
  }

  const cacheEnabled = currentProject?.cacheEnabled ?? false;
  const hitRateDisplay = "—"; // will be populated once analytics/timeseries is wired

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Edge Cache</h1>
            <p className="text-xs text-muted-foreground">TTL rules, vary-by keys & stale-while-revalidate</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            cacheEnabled
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-muted text-muted-foreground"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cacheEnabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
            {cacheEnabled ? "Active" : "Inactive"}
          </div>
          <Button
            id="cache-reset-btn"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => resetConfig.mutate()}
            disabled={resetConfig.isPending}
          >
            {resetConfig.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* ── Stat Cards ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Default TTL"
            value={configLoading ? "—" : formatTtl(config?.defaultTtlSec ?? 300)}
            sub="per GET request"
            accentClass="bg-gradient-to-br from-blue-500/5 to-transparent"
            loading={configLoading}
          />
          <StatCard
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Stale-While-Revalidate"
            value={configLoading ? "—" : formatTtl(config?.staleWhileRevalidateSec ?? 60)}
            sub="grace period"
            accentClass="bg-gradient-to-br from-purple-500/5 to-transparent"
            loading={configLoading}
          />
          <StatCard
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            label="Stale-If-Error"
            value={configLoading ? "—" : formatTtl(config?.staleIfErrorSec ?? 3600)}
            sub="error fallback window"
            accentClass="bg-gradient-to-br from-orange-500/5 to-transparent"
            loading={configLoading}
          />
          <StatCard
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            label="AI TTL Optimizer"
            value={config?.aiTtlOptimizerEnabled ? "On" : "Off"}
            sub="smart TTL tuning"
            accentClass="bg-gradient-to-br from-cyan-500/5 to-transparent"
            loading={configLoading}
          />
        </div>

        {/* ── Two-Column Layout ──────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ── Config Panel ─────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Cache Configuration</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Global cache settings applied to all GET and HEAD requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 divide-y divide-border">
              {configLoading ? (
                <div className="space-y-4 py-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <>
                  <Toggle
                    label="Cache Enabled"
                    description="Enable or disable the edge cache for this project"
                    checked={cacheEnabled}
                    onChange={handleToggle("cacheEnabled")}
                    disabled={updateConfig.isPending}
                  />
                  <Toggle
                    label="AI TTL Optimizer"
                    description="Let AI analyze traffic patterns and recommend optimal TTLs"
                    checked={config?.aiTtlOptimizerEnabled ?? false}
                    onChange={handleToggle("aiTtlOptimizerEnabled")}
                    disabled={updateConfig.isPending}
                  />
                  <div className="pt-1">
                    <SliderField
                      label="Default TTL"
                      description="Fallback cache duration when no rule matches"
                      value={defaultTtl}
                      min={0}
                      max={86400}
                      step={60}
                      formatValue={formatTtl}
                      onChange={setDefaultTtl}
                      onCommit={(v) => updateConfig.mutate({ defaultTtlSec: v })}
                      disabled={!cacheEnabled || updateConfig.isPending}
                    />
                  </div>
                  <div className="pt-1">
                    <SliderField
                      label="Max TTL"
                      description="Maximum allowed TTL, even if origin Cache-Control says longer"
                      value={maxTtl}
                      min={60}
                      max={604800}
                      step={3600}
                      formatValue={formatTtl}
                      onChange={setMaxTtl}
                      onCommit={(v) => updateConfig.mutate({ maxTtlSec: v })}
                      disabled={!cacheEnabled || updateConfig.isPending}
                    />
                  </div>
                  <div className="pt-1">
                    <SliderField
                      label="Stale-While-Revalidate"
                      description="Serve stale content while refreshing in the background"
                      value={swrSec}
                      min={0}
                      max={3600}
                      step={30}
                      formatValue={formatTtl}
                      onChange={setSwrSec}
                      onCommit={(v) => updateConfig.mutate({ staleWhileRevalidateSec: v })}
                      disabled={!cacheEnabled || updateConfig.isPending}
                    />
                  </div>
                  <div className="pt-1">
                    <SliderField
                      label="Stale-If-Error"
                      description="Serve stale content when origin returns an error"
                      value={sieSec}
                      min={0}
                      max={86400}
                      step={300}
                      formatValue={formatTtl}
                      onChange={setSieSec}
                      onCommit={(v) => updateConfig.mutate({ staleIfErrorSec: v })}
                      disabled={!cacheEnabled || updateConfig.isPending}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Vary-By & DB Cache ───────────────────── */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Vary-By Keys</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Cache separate responses based on these request attributes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 divide-y divide-border">
                <TagInput
                  id="vary-by-headers"
                  label="Vary by Headers"
                  description="e.g. Accept-Language, Accept-Encoding"
                  tags={varyByHeaders}
                  placeholder="Accept-Language"
                  onAdd={(v) => updateConfig.mutate({ varyByHeaders: [...varyByHeaders, v] })}
                  onRemove={(v) => updateConfig.mutate({ varyByHeaders: varyByHeaders.filter((x) => x !== v) })}
                />
                <TagInput
                  id="vary-by-query"
                  label="Vary by Query Params"
                  description="e.g. lang, currency (leave empty to vary by all params)"
                  tags={varyByQueryParams}
                  placeholder="lang"
                  onAdd={(v) => updateConfig.mutate({ varyByQueryParams: [...varyByQueryParams, v] })}
                  onRemove={(v) => updateConfig.mutate({ varyByQueryParams: varyByQueryParams.filter((x) => x !== v) })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">DB Query Cache</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Cache expensive database queries at the edge using KV.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {configLoading ? (
                  <div className="space-y-3 py-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <>
                    <Toggle
                      label="Enable DB Cache"
                      description="Cache database query results at the Cloudflare edge"
                      checked={config?.dbCacheEnabled ?? false}
                      onChange={handleToggle("dbCacheEnabled")}
                      disabled={updateConfig.isPending}
                    />
                    <div className="pt-1">
                      <SliderField
                        label="DB Cache TTL"
                        description="Default TTL for cached query results"
                        value={dbCacheDefaultTtl}
                        min={0}
                        max={3600}
                        step={30}
                        formatValue={formatTtl}
                        onChange={setDbCacheDefaultTtl}
                        onCommit={(v) => updateConfig.mutate({ dbCacheDefaultTtlSec: v })}
                        disabled={!(config?.dbCacheEnabled ?? false) || updateConfig.isPending}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Cache Rules Table ───────────────────────── */}
        <CacheRulesSection projectId={projectId} />

        {/* ── Chart & Sandbox Grid ────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Sandbox Card ───────────────────────────── */}
          <Card id="cache-sandbox-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Cache Sandbox</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Simulate a request and see how it will be processed by the cache — shows resolved TTL, cache key, and matched rule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CacheSandbox projectId={projectId} />
            </CardContent>
          </Card>
          {/* ── Cache Usage / Billing Chart ───────────── */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-primary" /> Cache Usage &amp; Sandbox Billing
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real edge request traffic vs Cache Sandbox calls logged under monthly billing usage.
                  </CardDescription>
                </div>
                {stats?.sandboxCalls !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Total Sandbox Calls: <span className="font-mono font-semibold text-primary">{stats.sandboxCalls}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {statsLoading ? (
                <div className="flex flex-1 items-end gap-1 min-h-[300px]">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />
                  ))}
                </div>
              ) : !stats || (stats.dailyTrend.length === 0 && stats.sandboxCalls === 0) ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground min-h-[300px]">
                  <Database className="h-10 w-10 opacity-20" />
                  <p className="text-sm">No traffic or sandbox calls recorded yet</p>
                  <p className="text-xs opacity-60">Evaluate requests in the Cache Sandbox to see usage analytics.</p>
                </div>
              ) : (
                <CacheUsageChart data={chartData} />
              )}
            </CardContent>
          </Card>


        </div>

      </div>
    </div>
  );
}
