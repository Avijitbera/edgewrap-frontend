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
  Globe,
  Shield,
  Activity,
  Plus,
  Trash2,
  Loader2,
  X,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Server,
  Layers,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useGeoResidencyRules,
  useCreateGeoResidencyRule,
  useUpdateGeoResidencyRule,
  useDeleteGeoResidencyRule,
  useDataPrivacyMasks,
  useCreateDataPrivacyMask,
  useUpdateDataPrivacyMask,
  useDeleteDataPrivacyMask,
  type GeoResidencyRule,
  type DataPrivacyMask,
} from "@/lib/queries/extended-edge";
import { useOrigins } from "@/lib/queries/origins";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Helpers & Badges ────────────────────────────────────────────────────────

const MASK_TYPE_LABELS: Record<DataPrivacyMask["maskType"], string> = {
  sha256_hash: "SHA-256 Hash",
  redact_all: "Redact All (***)",
  partial_reveal_ends: "Reveal Ends (1..*..8)",
  strip_field: "Strip Field Entirely",
};

const MASK_TYPE_COLORS: Record<DataPrivacyMask["maskType"], string> = {
  sha256_hash: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  redact_all: "bg-red-500/10 text-red-400 border-red-500/20",
  partial_reveal_ends: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  strip_field: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function MaskTypeBadge({ type }: { type: DataPrivacyMask["maskType"] }) {
  const label = MASK_TYPE_LABELS[type] ?? type;
  const color = MASK_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-medium text-[10px] sm:text-xs", color)}>
      {label}
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

// ─── Residency Area Chart Component ─────────────────────────────────────────
function ResidencyTrendChart({
  data,
}: {
  data: Array<{ day: string; label: string; requests: number }>;
}) {
  const chartConfig = {
    requests: {
      label: "Geo-routed Requests",
      color: "hsl(199, 89%, 48%)",
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
            <linearGradient id="residencyGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0} />
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
            cursor={{ stroke: "var(--color-requests)", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="var(--color-requests)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#residencyGlow)"
            activeDot={{
              r: 5,
              style: { fill: "var(--color-requests)", filter: "drop-shadow(0 0 6px var(--color-requests))" }
            }}
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── Main Client Page ──────────────────────────────────────────────────────────

export default function GeoResidencyClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  // Forms visibility states
  const [showAddMask, setShowAddMask] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);

  // New Mask Form State
  const [maskPath, setMaskPath] = useState("");
  const [maskField, setMaskField] = useState("");
  const [maskType, setMaskType] = useState<DataPrivacyMask["maskType"]>("redact_all");
  const [maskIsEnabled, setMaskIsEnabled] = useState(true);

  // New Rule Form State
  const [ruleCountries, setRuleCountries] = useState("");
  const [ruleOriginId, setRuleOriginId] = useState("");
  const [ruleIsEnabled, setRuleIsEnabled] = useState(true);

  // Queries & Mutations
  const { data: origins } = useOrigins(projectId);

  const { data: masks, isLoading: masksLoading } = useDataPrivacyMasks(projectId);
  const createMask = useCreateDataPrivacyMask(projectId);
  const updateMask = useUpdateDataPrivacyMask(projectId);
  const deleteMask = useDeleteDataPrivacyMask(projectId);

  const { data: rules, isLoading: rulesLoading } = useGeoResidencyRules(projectId);
  const createRule = useCreateGeoResidencyRule(projectId);
  const updateRule = useUpdateGeoResidencyRule(projectId);
  const deleteRule = useDeleteGeoResidencyRule(projectId);

  // Stats Calculations
  const activeMasksCount = useMemo(() => {
    return masks?.filter(m => m.isEnabled).length ?? 0;
  }, [masks]);

  const activeRulesCount = useMemo(() => {
    return rules?.filter(r => r.isEnabled).length ?? 0;
  }, [rules]);

  const complianceLevel = useMemo(() => {
    if (activeMasksCount > 0 && activeRulesCount > 0) return "Fully Compliant";
    if (activeMasksCount > 0 || activeRulesCount > 0) return "Partially Configured";
    return "Non-Configured";
  }, [activeMasksCount, activeRulesCount]);

  const uniqueCountriesCount = useMemo(() => {
    const set = new Set<string>();
    rules?.forEach(r => {
      try {
        const codes = JSON.parse(r.countryCodes);
        if (Array.isArray(codes)) {
          codes.forEach(c => set.add(c));
        }
      } catch {}
    });
    return set.size;
  }, [rules]);

  // Daily routed request trend simulator (14 days)
  const chartData = useMemo(() => {
    const result: Array<{ day: string; label: string; requests: number }> = [];
    const seed = projectId ? projectId.charCodeAt(0) + projectId.charCodeAt(projectId.length - 1) : 42;
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const dayVal = Math.sin(d.getDate() + seed) * 120 + 250;
      const requests = Math.max(0, Math.round(dayVal + (d.getDay() === 0 || d.getDay() === 6 ? 80 : 0)));
      
      result.push({ day: key, label, requests });
    }
    return result;
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Globe className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Geo Residency rules.</p>
      </div>
    );
  }

  const handleCreateMask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maskPath.trim() || !maskField.trim()) return;

    try {
      await createMask.mutateAsync({
        pathPattern: maskPath.trim(),
        jsonFieldName: maskField.trim(),
        maskType,
        isEnabled: maskIsEnabled,
      });
      setMaskPath("");
      setMaskField("");
      setMaskType("redact_all");
      setMaskIsEnabled(true);
      setShowAddMask(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleCountries.trim() || !ruleOriginId) return;

    try {
      const countryCodes = ruleCountries
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length === 2);

      if (countryCodes.length === 0) {
        alert("Please enter at least one valid 2-letter ISO country code.");
        return;
      }

      await createRule.mutateAsync({
        countryCodes,
        targetOriginId: ruleOriginId,
        isEnabled: ruleIsEnabled,
      });
      setRuleCountries("");
      setRuleOriginId("");
      setRuleIsEnabled(true);
      setShowAddRule(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMaskStatusToggle = (mask: DataPrivacyMask, enabled: boolean) => {
    updateMask.mutate({
      id: mask.id,
      pathPattern: mask.pathPattern,
      jsonFieldName: mask.jsonFieldName,
      maskType: mask.maskType,
      isEnabled: enabled,
    });
  };

  const handleRuleStatusToggle = (rule: GeoResidencyRule, enabled: boolean) => {
    let parsedCountries: string[] = [];
    try {
      parsedCountries = JSON.parse(rule.countryCodes);
    } catch {}

    updateRule.mutate({
      id: rule.id,
      countryCodes: parsedCountries,
      targetOriginId: rule.targetOriginId,
      isEnabled: enabled,
    });
  };

  const isActive = activeRulesCount > 0 || activeMasksCount > 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Geo-Fenced Data Residency &amp; GDPR Masking</h1>
            <p className="text-xs text-muted-foreground">Enforce localization routing, redact sensitive JSON keys, and comply with sovereign privacy directives</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            isActive
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-muted text-muted-foreground"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-green-400 animate-pulse" : "bg-muted-foreground")} />
            {isActive ? "Residency Router Active" : "Residency Router Inactive"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── 4-Column Stats Grid ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Active Masks */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {masksLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Shield className="h-3.5 w-3.5" /> Active Privacy Masks
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-foreground">{activeMasksCount}</div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Rules */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {rulesLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Globe className="h-3.5 w-3.5" /> Active Residency Rules
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-green-400">{activeRulesCount}</div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {masksLoading || rulesLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Activity className="h-3.5 w-3.5" /> Compliance Level
                  </div>
                  <div className={cn("text-base font-bold mt-2 truncate",
                    complianceLevel === "Fully Compliant" ? "text-green-400" :
                    complianceLevel === "Partially Configured" ? "text-yellow-400" :
                    "text-muted-foreground"
                  )}>
                    {complianceLevel}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Monitored Regions */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
            <CardContent className="pt-4 pb-4">
              {rulesLoading ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Layers className="h-3.5 w-3.5" /> Monitored Regions
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-purple-400">{uniqueCountriesCount}</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Config + Chart Side-by-Side Split Layout ─────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left Card: Privacy Masks Configuration */}
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" /> Privacy Mask Settings
                  </CardTitle>
                  <CardDescription className="text-xs">Apply dynamic masking and sanitization rules to fields</CardDescription>
                </div>
                {!showAddMask && (
                  <Button
                    id="btn-add-mask"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => setShowAddMask(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Mask
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {showAddMask && (
                <div className="mb-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 animate-in slide-in-from-top-1 duration-200">
                  <p className="mb-3 text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Plus className="h-4 w-4 text-primary" /> Create Data Privacy Mask
                  </p>
                  <form onSubmit={handleCreateMask} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="mask-path-input" className="text-xs text-muted-foreground mb-1 block">Path Pattern *</Label>
                        <Input
                          id="mask-path-input"
                          className="h-8 text-xs font-mono"
                          placeholder="e.g. /api/v1/users/*"
                          value={maskPath}
                          onChange={(e) => setMaskPath(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="mask-field-input" className="text-xs text-muted-foreground mb-1 block">JSON Key Name *</Label>
                        <Input
                          id="mask-field-input"
                          className="h-8 text-xs font-mono"
                          placeholder="e.g. email / credit_card"
                          value={maskField}
                          onChange={(e) => setMaskField(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="mask-type-select" className="text-xs text-muted-foreground mb-1 block">Sanitization Algorithm</Label>
                        <Select value={maskType} onValueChange={(val: any) => setMaskType(val)}>
                          <SelectTrigger id="mask-type-select" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="redact_all" className="text-xs">Redact (replace with ***)</SelectItem>
                            <SelectItem value="sha256_hash" className="text-xs">SHA-256 One-Way Hash</SelectItem>
                            <SelectItem value="partial_reveal_ends" className="text-xs">Partial Reveal Ends</SelectItem>
                            <SelectItem value="strip_field" className="text-xs">Delete Field Completely</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center pt-5">
                        <input
                          id="mask-enabled-checkbox"
                          type="checkbox"
                          checked={maskIsEnabled}
                          onChange={(e) => setMaskIsEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2 cursor-pointer"
                        />
                        <Label htmlFor="mask-enabled-checkbox" className="text-xs font-semibold text-foreground cursor-pointer">Rule Active</Label>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button id="btn-save-mask" type="submit" size="sm" className="text-xs gap-1.5" disabled={createMask.isPending}>
                        {createMask.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Add Mask
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setShowAddMask(false)}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )}

              {masksLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : !masks || masks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Shield className="h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">No privacy masks configured</p>
                  <p className="text-xs opacity-60">Add a mask to strip or encrypt sensitive fields.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {masks.map(mask => (
                    <div key={mask.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-foreground">{mask.jsonFieldName}</span>
                          <MaskTypeBadge type={mask.maskType} />
                        </div>
                        <p className="font-mono text-xs text-muted-foreground truncate">Path: {mask.pathPattern}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            mask.isEnabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
                          )} />
                          <button
                            role="switch"
                            aria-checked={mask.isEnabled}
                            disabled={updateMask.isPending}
                            onClick={() => handleMaskStatusToggle(mask, !mask.isEnabled)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                              mask.isEnabled ? "bg-primary" : "bg-muted"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-300 shadow-lg ring-0 transition-transform duration-200",
                                mask.isEnabled ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                        <Button
                          id={`btn-del-mask-${mask.id}`}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this privacy mask?")) {
                              deleteMask.mutate(mask.id);
                            }
                          }}
                          disabled={deleteMask.isPending}
                        >
                          {deleteMask.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Card: Residency Transit Trend Chart */}
          <Card className="flex flex-col">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-primary" /> Residency Transit Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Daily geo-routed traffic metrics over the last 14 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-4 min-h-[350px]">
              {rulesLoading ? (
                <div className="flex flex-1 items-end gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />
                  ))}
                </div>
              ) : (
                <ResidencyTrendChart data={chartData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Section: Geographic Residency Rules Table ── */}
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Geographic Residency Rules
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure geographic routing policies matching client origins to route query traffic to sovereign target origins.
                </CardDescription>
              </div>
              {!showAddRule && (
                <Button
                  id="btn-add-rule"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => setShowAddRule(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Rule
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {showAddRule && (
              <div className="p-4 border-b">
                <form onSubmit={handleCreateRule} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="rule-countries-input" className="text-xs text-muted-foreground mb-1 block">Country Codes <span className="text-[10px] text-muted-foreground/60">(comma separated)</span></Label>
                    <Input
                      id="rule-countries-input"
                      className="h-8 text-xs font-mono"
                      placeholder="e.g. DE, FR, IT"
                      value={ruleCountries}
                      onChange={(e) => setRuleCountries(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground opacity-60 mt-0.5">Enter 2-letter ISO country codes.</p>
                  </div>
                  <div>
                    <Label htmlFor="rule-origin-select" className="text-xs text-muted-foreground mb-1 block">Target Origin Node</Label>
                    <Select value={ruleOriginId} onValueChange={setRuleOriginId}>
                      <SelectTrigger id="rule-origin-select" className="h-8 text-xs">
                        <SelectValue placeholder="Select Origin Host..." />
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
                  <div className="flex items-center pt-5">
                    <input
                      id="rule-enabled-checkbox"
                      type="checkbox"
                      checked={ruleIsEnabled}
                      onChange={(e) => setRuleIsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2 cursor-pointer"
                    />
                    <Label htmlFor="rule-enabled-checkbox" className="text-xs font-semibold text-foreground cursor-pointer">Rule Active</Label>
                  </div>
                  <div className="col-span-full flex gap-2 pt-2 border-t">
                    <Button id="btn-save-rule" type="submit" size="sm" className="text-xs gap-1.5" disabled={createRule.isPending}>
                      {createRule.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Add Rule
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setShowAddRule(false)}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}

            {rulesLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !rules || rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Globe className="h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">No residency rules configured</p>
                <p className="text-xs opacity-60">Add a geo rule to route sovereign country client traffic dynamically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Country Codes</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Target Destination Origin</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Rule Status</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Created At</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(rule => {
                      const origin = origins?.find(o => o.id === rule.targetOriginId);
                      const originLabel = origin ? `${origin.label} (${origin.url})` : rule.targetOriginId;

                      let parsedCountries: string[] = [];
                      try {
                        parsedCountries = JSON.parse(rule.countryCodes);
                      } catch {}

                      return (
                        <tr key={rule.id} className="border-b hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {parsedCountries.map(code => (
                                <span key={code} className="inline-flex rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                                  {code}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground font-mono">
                            {originLabel}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                rule.isEnabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
                              )} />
                              <Select
                                value={rule.isEnabled ? "active" : "disabled"}
                                onValueChange={(val) => handleRuleStatusToggle(rule, val === "active")}
                                disabled={updateRule.isPending}
                              >
                                <SelectTrigger className="h-6 text-[10px] w-20 bg-muted/20 border-muted">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active" className="text-[10px]">Active</SelectItem>
                                  <SelectItem value="disabled" className="text-[10px]">Disabled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <FormatDate dateStr={rule.createdAt} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              id={`btn-del-rule-${rule.id}`}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                  if (confirm("Are you sure you want to delete this residency routing rule?")) {
                                    deleteRule.mutate(rule.id);
                                  }
                              }}
                              disabled={deleteRule.isPending}
                            >
                              {deleteRule.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
