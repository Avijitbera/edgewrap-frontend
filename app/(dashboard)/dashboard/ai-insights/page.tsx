"use client";

import { useState } from "react";
import {
  Brain,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Bug,
  Mail,
  DollarSign,
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Filter,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useAiInsights,
  useAcknowledgeInsight,
  useGenerateInsights,
  type AiInsight,
  type InsightType,
  type InsightSeverity,
} from "@/lib/queries/ai-insights";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Metadata (server-compatible via layout) ──────────────────────────────────

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_META: Record<
  InsightSeverity,
  { label: string; color: string; icon: React.ElementType; glow: string }
> = {
  critical: {
    label: "Critical",
    color:
      "bg-rose-500/10 text-rose-400 border-rose-500/30",
    icon: AlertCircle,
    glow: "border-rose-500/30 shadow-rose-500/5",
  },
  warning: {
    label: "Warning",
    color:
      "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: AlertTriangle,
    glow: "border-amber-500/30 shadow-amber-500/5",
  },
  info: {
    label: "Info",
    color:
      "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: Info,
    glow: "border-border/60 shadow-none",
  },
};

const TYPE_META: Record<
  InsightType,
  { label: string; icon: React.ElementType; color: string }
> = {
  traffic_summary: {
    label: "Traffic Summary",
    icon: Activity,
    color: "text-blue-400",
  },
  anomaly_detected: {
    label: "Anomaly Detected",
    icon: AlertTriangle,
    color: "text-amber-400",
  },
  cache_optimization: {
    label: "Cache Optimization",
    icon: Zap,
    color: "text-yellow-400",
  },
  routing_recommendation: {
    label: "Routing",
    icon: Globe,
    color: "text-teal-400",
  },
  security_alert: {
    label: "Security Alert",
    icon: Shield,
    color: "text-rose-400",
  },
  cost_optimization: {
    label: "Cost Optimization",
    icon: DollarSign,
    color: "text-emerald-400",
  },
  error_pattern: {
    label: "Error Pattern",
    icon: Bug,
    color: "text-orange-400",
  },
  bot_pattern: {
    label: "Bot Pattern",
    icon: Bug,
    color: "text-purple-400",
  },
  geo_insight: {
    label: "Geo Insight",
    icon: Globe,
    color: "text-cyan-400",
  },
  email_deliverability: {
    label: "Email Deliverability",
    icon: Mail,
    color: "text-indigo-400",
  },
};

const ALL_TYPES: Array<{ label: string; value: InsightType | "" }> = [
  { label: "All Types", value: "" },
  { label: "Traffic Summary", value: "traffic_summary" },
  { label: "Anomaly Detected", value: "anomaly_detected" },
  { label: "Cache Optimization", value: "cache_optimization" },
  { label: "Routing Recommendation", value: "routing_recommendation" },
  { label: "Security Alert", value: "security_alert" },
  { label: "Cost Optimization", value: "cost_optimization" },
  { label: "Error Pattern", value: "error_pattern" },
  { label: "Bot Pattern", value: "bot_pattern" },
  { label: "Geo Insight", value: "geo_insight" },
  { label: "Email Deliverability", value: "email_deliverability" },
];

const ALL_SEVERITIES: Array<{ label: string; value: InsightSeverity | "" }> = [
  { label: "All Severities", value: "" },
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: string | number): string {
  const date =
    typeof ts === "number"
      ? new Date(ts < 1e10 ? ts * 1000 : ts) // unix seconds or ms
      : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Components ──────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  const meta = SEVERITY_META[severity];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.color
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function TypeBadge({ type }: { type: InsightType }) {
  const meta = TYPE_META[type] ?? {
    label: type,
    icon: Info,
    color: "text-muted-foreground",
  };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground",
        meta.color
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-2xl font-bold font-mono tracking-tight">
                {value}
              </p>
            )}
            {sub && !isLoading && (
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              color
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({
  insight,
  onAcknowledge,
  isAcknowledging,
}: {
  insight: AiInsight;
  onAcknowledge: (id: string) => void;
  isAcknowledging: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const severityMeta = SEVERITY_META[insight.severity];
  const typeMeta = TYPE_META[insight.type];
  const TypeIcon = typeMeta?.icon ?? Info;
  const isAcknowledged = !!insight.acknowledgedAt;

  // Try to parse drilldown data for display
  let parsedData: Record<string, unknown> | null = null;
  try {
    if (insight.data) parsedData = JSON.parse(insight.data);
  } catch {
    parsedData = null;
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden border transition-all duration-200 bg-card/80 backdrop-blur-sm hover:shadow-lg",
        isAcknowledged
          ? "border-border/40 opacity-70"
          : severityMeta.glow,
        insight.severity === "critical" && !isAcknowledged
          ? "shadow-rose-500/10 shadow-md"
          : insight.severity === "warning" && !isAcknowledged
          ? "shadow-amber-500/10 shadow-sm"
          : ""
      )}
    >
      {/* Left accent bar */}
      {!isAcknowledged && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
            insight.severity === "critical"
              ? "bg-rose-500"
              : insight.severity === "warning"
              ? "bg-amber-500"
              : "bg-blue-500"
          )}
        />
      )}

      <CardContent className={cn("p-5", !isAcknowledged && "pl-6")}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              isAcknowledged
                ? "border-border/40 bg-muted/20 text-muted-foreground"
                : insight.severity === "critical"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : insight.severity === "warning"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-blue-500/30 bg-blue-500/10 text-blue-400"
            )}
          >
            <TypeIcon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <TypeBadge type={insight.type} />
                  <SeverityBadge severity={insight.severity} />
                  {isAcknowledged && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Acknowledged
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold leading-tight text-foreground">
                  {insight.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(insight.createdAt)}
                </span>
              </div>
            </div>

            {/* Summary */}
            <p
              className={cn(
                "mt-2 text-xs text-muted-foreground leading-relaxed",
                !expanded && "line-clamp-2"
              )}
            >
              {insight.summary}
            </p>

            {/* Recommendation */}
            {insight.recommendation && expanded && (
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-violet-400" />
                  Recommendation
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.recommendation}
                </p>
              </div>
            )}

            {/* Drilldown data */}
            {parsedData && expanded && (
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-blue-400" />
                  Context Data
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(parsedData)
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="text-muted-foreground capitalize">
                          {k.replace(/_/g, " ")}:{" "}
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {typeof v === "number"
                            ? v.toLocaleString()
                            : typeof v === "boolean"
                            ? v
                              ? "Yes"
                              : "No"
                            : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setExpanded((p) => !p)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
              {!isAcknowledged && (
                <Button
                  id={`acknowledge-${insight.id}`}
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 gap-1.5 text-xs"
                  onClick={() => onAcknowledge(insight.id)}
                  disabled={isAcknowledging}
                >
                  {isAcknowledging ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Acknowledge
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyInsights({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
        <Brain className="h-8 w-8 text-violet-400" />
      </div>
      <div>
        <p className="text-base font-semibold">
          {hasFilters ? "No matching insights" : "No insights yet"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {hasFilters
            ? "Try adjusting your filters to see more insights."
            : "AI insights are generated automatically based on your traffic patterns. Click Generate to run analysis now."}
        </p>
      </div>
    </div>
  );
}

function NoProject() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
        <Brain className="h-8 w-8 text-violet-400" />
      </div>
      <div>
        <p className="text-base font-semibold">No project selected</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Select a project from the sidebar to view AI-generated insights and
          recommendations.
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AiInsightsPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const [filterType, setFilterType] = useState<InsightType | "">("");
  const [filterSeverity, setFilterSeverity] = useState<InsightSeverity | "">(
    ""
  );
  const [page, setPage] = useState(1);

  const LIMIT = 10;

  const { data: insightsResp, isLoading, refetch } = useAiInsights(projectId, {
    type: filterType || undefined,
    severity: filterSeverity || undefined,
    page,
    limit: LIMIT,
  });

  const acknowledge = useAcknowledgeInsight(projectId);
  const generate = useGenerateInsights(projectId);

  const insights = insightsResp?.data ?? [];
  const meta = insightsResp?.meta;
  const totalPages = meta ? Math.ceil(meta.total / LIMIT) : 0;

  // Summary counts from current page
  const criticalCount = insights.filter((i) => i.severity === "critical" && !i.acknowledgedAt).length;
  const warningCount = insights.filter((i) => i.severity === "warning" && !i.acknowledgedAt).length;
  const infoCount = insights.filter((i) => i.severity === "info").length;
  const acknowledgedCount = insights.filter((i) => !!i.acknowledgedAt).length;

  const hasFilters = !!filterType || !!filterSeverity;

  const handleAcknowledge = (id: string) => {
    acknowledge.mutate(id);
  };

  const handleGenerate = () => {
    generate.mutate();
  };

  const handleFilterChange = () => {
    setPage(1); // Reset to first page on filter change
  };

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                AI Insights
              </h1>
              <p className="text-xs text-muted-foreground">
                Select a project to view insights
              </p>
            </div>
          </div>
        </div>
        <NoProject />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                AI Insights
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentProject
                  ? `AI-powered analysis — ${currentProject.name}`
                  : "Automated traffic analysis & recommendations"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              id="ai-insights-refresh"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh
            </Button>
            <Button
              id="ai-insights-generate"
              size="sm"
              className="gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleGenerate}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {generate.isPending ? "Generating…" : "Generate Insights"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* ── Generate Success Banner ──────────────────────── */}
        {generate.isSuccess && (
          <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-400">
                Generation queued
              </p>
              <p className="text-xs text-violet-300/80 mt-0.5">
                AI insight generation has been queued. New insights will appear
                here within a few seconds.
              </p>
            </div>
            <button
              onClick={() => generate.reset()}
              className="text-violet-400/60 hover:text-violet-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Stats Row ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Critical"
            value={isLoading ? "—" : criticalCount}
            sub="unacknowledged"
            icon={AlertCircle}
            color="border-rose-500/20 bg-rose-500/10 text-rose-400"
            isLoading={isLoading}
          />
          <StatCard
            label="Warnings"
            value={isLoading ? "—" : warningCount}
            sub="unacknowledged"
            icon={AlertTriangle}
            color="border-amber-500/20 bg-amber-500/10 text-amber-400"
            isLoading={isLoading}
          />
          <StatCard
            label="Informational"
            value={isLoading ? "—" : infoCount}
            sub="on this page"
            icon={Info}
            color="border-blue-500/20 bg-blue-500/10 text-blue-400"
            isLoading={isLoading}
          />
          <StatCard
            label="Acknowledged"
            value={isLoading ? "—" : acknowledgedCount}
            sub="on this page"
            icon={CheckCircle2}
            color="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            isLoading={isLoading}
          />
        </div>

        {/* ── AI Insight Info Banner ───────────────────────── */}
        <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <Brain className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              How AI Insights work
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Insights are generated automatically by analyzing your traffic
              patterns, security events, cache performance, and error rates
              using Gemini AI. They highlight anomalies, optimization
              opportunities, and security threats — and provide actionable
              recommendations. New insights are generated every 6 hours, or you
              can trigger generation manually.
            </p>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────── */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter:</span>
              </div>

              <Select
                value={filterType || "__all__"}
                onValueChange={(v) => {
                  setFilterType(v === "__all__" ? "" : (v as InsightType));
                  handleFilterChange();
                }}
              >
                <SelectTrigger
                  id="filter-type"
                  className="h-8 w-48 text-xs bg-muted/40 border-muted"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_TYPES.map((t) => (
                    <SelectItem
                      key={t.value || "__all__"}
                      value={t.value || "__all__"}
                      className="text-xs"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterSeverity || "__all__"}
                onValueChange={(v) => {
                  setFilterSeverity(v === "__all__" ? "" : (v as InsightSeverity));
                  handleFilterChange();
                }}
              >
                <SelectTrigger
                  id="filter-severity"
                  className="h-8 w-44 text-xs bg-muted/40 border-muted"
                >
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SEVERITIES.map((s) => (
                    <SelectItem
                      key={s.value || "__all__"}
                      value={s.value || "__all__"}
                      className="text-xs"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  id="filter-clear"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground"
                  onClick={() => {
                    setFilterType("");
                    setFilterSeverity("");
                    setPage(1);
                  }}
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </Button>
              )}

              {meta && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {meta.total} total insight{meta.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Insights Feed ─────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <InsightSkeleton key={i} />
            ))
          ) : insights.length === 0 ? (
            <EmptyInsights hasFilters={hasFilters} />
          ) : (
            insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onAcknowledge={handleAcknowledge}
                isAcknowledging={acknowledge.isPending}
              />
            ))
          )}
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              id="ai-insights-prev"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3 w-3" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              id="ai-insights-next"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* ── Type Distribution Card ───────────────────────── */}
        {!isLoading && insights.length > 0 && (
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Insight Distribution</CardTitle>
              <CardDescription className="text-xs">
                Breakdown by type across current page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(
                  insights.reduce(
                    (acc, ins) => {
                      acc[ins.type] = (acc[ins.type] ?? 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const meta =
                      TYPE_META[type as InsightType] ?? {
                        label: type,
                        icon: Info,
                        color: "text-muted-foreground",
                      };
                    const Icon = meta.icon;
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                        <span className="text-xs text-muted-foreground">
                          {meta.label}
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
