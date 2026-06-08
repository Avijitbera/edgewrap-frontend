"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Split,
  GitCompare,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Settings,
  ShieldAlert,
  Globe,
  Activity,
  ArrowRight,
  Copy,
  Check,
  XCircle,
  Clock,
  Layers,
  Settings2,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useShadowRoutingConfig,
  useUpdateShadowRoutingConfig,
  useShadowMismatches,
  type ShadowRoutingConfig,
  type ShadowMismatch,
} from "@/lib/queries/extended-edge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers & Badges ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ShadowMismatch["mismatchType"], string> = {
  status_code: "Status Code Mismatch",
  body_diff: "Body Payload Drift",
  headers_diff: "Headers Drift",
};

const TYPE_COLORS: Record<ShadowMismatch["mismatchType"], string> = {
  status_code: "bg-red-500/10 text-red-400 border-red-500/20",
  body_diff: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  headers_diff: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

function MismatchTypeBadge({ type }: { type: ShadowMismatch["mismatchType"] }) {
  const label = TYPE_LABELS[type] ?? type;
  const color = TYPE_COLORS[type] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium text-[10px] sm:text-xs", color)}>
      {label}
    </span>
  );
}

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
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold", colorClass)}>
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

function CodeBlock({ code, title }: { code: string | null | undefined; title?: string }) {
  if (!code) return <p className="text-[11px] text-muted-foreground italic p-2 border rounded border-dashed bg-muted/10">No differences detected</p>;
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
      <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[10px] leading-relaxed text-foreground/80 max-h-[300px] scrollbar-thin">
        <code>{formatted}</code>
      </pre>
    </div>
  );
}

// ─── Sub-components modeled from cache/page.tsx ──────────────────────────────

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
}) {
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ""}`;
  return (
    <div className="space-y-2 py-2">
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
        className="w-full accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatValue ? formatValue(min) : `${min}${unit ?? ""}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit ?? ""}`}</span>
      </div>
    </div>
  );
}

// ─── Main Client Page ──────────────────────────────────────────────────────────

export default function ShadowTrafficClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const [mismatchesPage, setMismatchesPage] = useState(1);
  const [mismatchTypeFilter, setMismatchTypeFilter] = useState("all");

  // Inspection Modal state
  const [viewingMismatch, setViewingMismatch] = useState<ShadowMismatch | null>(null);

  // Configuration Form State
  const [shadowUrl, setShadowUrl] = useState("");
  const [trafficPercent, setTrafficPercent] = useState(10); // 10% defaults
  const [excludePatterns, setExcludePatterns] = useState("");
  const [maxConcurrent, setMaxConcurrent] = useState("50");
  const [isEnabled, setIsEnabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Queries & Mutations
  const { data: config, isLoading: configLoading } = useShadowRoutingConfig(projectId);
  const updateConfig = useUpdateShadowRoutingConfig(projectId);

  const { data: mismatchesResp, isLoading: mismatchesLoading } = useShadowMismatches(projectId, {
    type: mismatchTypeFilter !== "all" ? mismatchTypeFilter : undefined,
    page: mismatchesPage,
    limit: 10,
  });

  // Sync state when config loads
  useEffect(() => {
    if (config) {
      setShadowUrl(config.shadowOriginUrl || "");
      setTrafficPercent(Math.round(config.trafficPercent * 100));
      setIsEnabled(config.isEnabled);
      setMaxConcurrent(String(config.maxConcurrentShadowRequests ?? 50));

      let parsedExcludes: string[] = [];
      try {
        if (config.excludePathPatterns) {
          parsedExcludes = JSON.parse(config.excludePathPatterns);
        }
      } catch {}
      setExcludePatterns(parsedExcludes.join(", "));
    }
  }, [config]);

  // Reset pagination when filter type changes
  useEffect(() => {
    setMismatchesPage(1);
  }, [mismatchTypeFilter]);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Split className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Shadow Traffic configurations.</p>
      </div>
    );
  }

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError("");

    if (isEnabled && !shadowUrl.trim()) {
      setSaveError("Shadow Origin URL is required to enable traffic mirroring.");
      return;
    }

    try {
      const parsedExcludes = excludePatterns
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      await updateConfig.mutateAsync({
        shadowOriginUrl: shadowUrl.trim(),
        trafficPercent: trafficPercent / 100,
        excludePathPatterns: parsedExcludes,
        maxConcurrentShadowRequests: maxConcurrent ? Number(maxConcurrent) : undefined,
        isEnabled,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save configuration settings.");
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    setIsEnabled(checked);
    if (shadowUrl.trim()) {
      try {
        await updateConfig.mutateAsync({ isEnabled: checked });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: any) {
        setSaveError(err?.message ?? "Failed to toggle active status.");
      }
    }
  };

  const mismatches = mismatchesResp?.data ?? [];
  const mismatchesMeta = mismatchesResp?.meta;
  const totalPages = mismatchesMeta ? Math.ceil(mismatchesMeta.total / 10) : 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Split className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Shadow Traffic Routing</h1>
            <p className="text-xs text-muted-foreground">Duplicate, route, and test production traffic in parallel without affecting client responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Shadow Parser Online
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── Main Settings & Telemetry Grid ────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Mirroring settings form card (Left) */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Mirroring Config</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configure target duplicate endpoints, thread concurrency limits, and active edge mirroring state.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {configLoading ? (
                <div className="space-y-4 py-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-8 w-1/3" />
                </div>
              ) : (
                <form onSubmit={handleConfigSubmit} className="space-y-4">
                  {saveSuccess && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Configuration settings updated and deployed successfully.</span>
                    </div>
                  )}
                  {saveError && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                  )}

                  <Toggle
                    label="Enable Shadow Mirroring"
                    description="Duplicate production traffic to shadow server in the background"
                    checked={isEnabled}
                    onChange={handleToggleActive}
                    disabled={updateConfig.isPending}
                  />

                  <div className="space-y-1 pt-1">
                    <Label htmlFor="shadow-url-input" className="text-xs text-muted-foreground">Shadow Origin URL</Label>
                    <Input
                      id="shadow-url-input"
                      type="url"
                      value={shadowUrl}
                      onChange={(e) => setShadowUrl(e.target.value)}
                      placeholder="https://canary.api.yourcompany.com"
                      className="h-8 text-xs font-mono"
                      required={isEnabled}
                    />
                  </div>

                  <div className="pt-1">
                    <SliderField
                      label="Traffic Ratio (%)"
                      description="The fraction of production traffic mirrored"
                      value={trafficPercent}
                      min={0}
                      max={100}
                      step={5}
                      unit="%"
                      onChange={setTrafficPercent}
                      onCommit={(v) => updateConfig.mutate({ trafficPercent: v / 100 })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="max-concurrent-input" className="text-xs text-muted-foreground">Max Concurrent Connections</Label>
                      <Input
                        id="max-concurrent-input"
                        type="number"
                        min="1"
                        max="500"
                        value={maxConcurrent}
                        onChange={(e) => setMaxConcurrent(e.target.value)}
                        className="h-8 w-full text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label htmlFor="exclude-patterns-input" className="text-xs text-muted-foreground">Excluded Path Wildcards <span className="text-[10px] text-muted-foreground/60">(comma separated)</span></Label>
                    <textarea
                      id="exclude-patterns-input"
                      rows={2}
                      value={excludePatterns}
                      onChange={(e) => setExcludePatterns(e.target.value)}
                      placeholder="/api/v1/auth/*, /api/v1/payments"
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="flex justify-end pt-1 border-t">
                    <Button id="btn-save-config" type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={updateConfig.isPending}>
                      {updateConfig.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      Save Settings
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Telemetry Info Guide (Right) */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Parity Engine Telemetry</h3>
              </div>
              <CardDescription className="text-xs">
                How the shadow traffic comparison engine evaluates upstream consistency at the edge.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4 text-xs leading-relaxed text-muted-foreground">
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 font-bold font-mono mt-0.5">1</div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">Non-blocking Cloning</p>
                    <p className="text-muted-foreground">Edges clone request buffers and transmit them asynchronously. Mirror latency has zero impact on client response speeds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 font-bold font-mono mt-0.5">2</div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">State & GDPR Safety</p>
                    <p className="text-muted-foreground">Excluded wildcard paths block sensitive operations (payments, mutations) from writing state, and dynamic privacy masks redact sensitive values.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0 font-bold font-mono mt-0.5">3</div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">Parity Matching Checks</p>
                    <p className="text-muted-foreground">Edge workers cross-examine response structures and log drifts in status codes, body payloads, or response headers instantly.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-3 bg-muted/20 space-y-1 text-xs">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" /> Mirror Status Summary
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-1 border-t pt-1">
                  <span className="text-muted-foreground">Traffic Route:</span>
                  <span className="text-foreground truncate">{shadowUrl || "Not Configured"}</span>
                  <span className="text-muted-foreground">Duplication Status:</span>
                  <span className={cn(isEnabled ? "text-green-400" : "text-muted-foreground")}>{isEnabled ? "Active" : "Bypass"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Parity Mismatches Section (Bottom full-width) ── */}
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary" />
                  Edge Comparison Failures
                </CardTitle>
                <CardDescription className="text-xs">
                  Review structural discrepancies detected in real-time between primary and shadow server responses.
                </CardDescription>
              </div>

              {/* Filter Select toolbar */}
              <Select value={mismatchTypeFilter} onValueChange={setMismatchTypeFilter}>
                <SelectTrigger className="h-8 text-xs w-44 bg-background">
                  <SelectValue placeholder="Mismatch Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Mismatches</SelectItem>
                  <SelectItem value="status_code" className="text-xs">Status Code Mismatch</SelectItem>
                  <SelectItem value="body_diff" className="text-xs">Body Payload Drift</SelectItem>
                  <SelectItem value="headers_diff" className="text-xs">Headers Drift</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {mismatchesLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !mismatches || mismatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <GitCompare className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No parity mismatches logged</p>
                <p className="text-xs opacity-60">Shadowed responses match primary responses identically. Parity is 100% stable!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Detected At</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Request Path</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Mismatch Type</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Primary Status</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Shadow Status</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mismatches.map(m => (
                      <tr key={m.id} className="border-b hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setViewingMismatch(m)}>
                        <td className="px-4 py-3 text-muted-foreground font-mono">
                          <FormatDate dateStr={m.createdAt} />
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground break-all max-w-[200px] sm:max-w-xs md:max-w-md">
                          {m.path}
                        </td>
                        <td className="px-4 py-3">
                          <MismatchTypeBadge type={m.mismatchType} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge code={m.primaryStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge code={m.shadowStatus} />
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            id={`btn-mismatch-inspect-${m.id}`}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] font-semibold gap-1 hover:bg-muted"
                            onClick={() => setViewingMismatch(m)}
                          >
                            <Eye className="h-3 w-3" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {mismatchesResp && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{mismatchesPage}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setMismatchesPage(p => Math.max(1, p - 1))}
                    disabled={mismatchesPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setMismatchesPage(p => Math.min(totalPages, p + 1))}
                    disabled={mismatchesPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── MODAL: VIEW DETAILS ────────────────────────────────── */}
      {viewingMismatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Parity Analysis Telemetry</h3>
              </div>
              <button onClick={() => setViewingMismatch(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Summary panel */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border bg-muted/20 p-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Mismatch Type</span>
                  <MismatchTypeBadge type={viewingMismatch.mismatchType} />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Primary Code</span>
                  <StatusBadge code={viewingMismatch.primaryStatus} />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Shadow Code</span>
                  <StatusBadge code={viewingMismatch.shadowStatus} />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Logged At</span>
                  <FormatDate dateStr={viewingMismatch.createdAt} />
                </div>
              </div>

              {/* Path layout */}
              <div className="rounded-xl border p-3.5 bg-muted/5 font-mono text-xs space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold block">Request Path Intercepted</span>
                <span className="text-foreground break-all">{viewingMismatch.path}</span>
              </div>

              {/* Comparison payload diff box */}
              <CodeBlock code={viewingMismatch.diffPayload} title="Response Comparison Difference Payload" />
            </div>
            <div className="border-t px-5 py-3 shrink-0 flex justify-end bg-muted/10">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setViewingMismatch(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
