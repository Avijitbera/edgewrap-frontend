"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Zap,
  Activity,
  Database,
  Cpu,
  Shield,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  FileText,
  ExternalLink,
  ArrowUpRight,
  RefreshCw,
  Info,
  Layers,
  KeyRound,
  Globe,
} from "lucide-react";
import {
  useSubscription,
  useUsage,
  useInvoices,
  useCheckout,
  useBillingPortal,
  useCancelSubscription,
  usePlans,
  type Invoice,
  type Plan,
} from "@/lib/queries/billing";
import { useSidebarProject } from "@/components/layout/sidebar";
import { useProjects } from "@/lib/queries/projects";
import { useApiKeys } from "@/lib/queries/api-keys";
import { useOrigins } from "@/lib/queries/origins";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCurrency(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(usd);
}

function formatDate(str: string | null | undefined): string {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UsageBar({
  used,
  limit,
  color = "primary",
}: {
  used: number;
  limit: number | null;
  color?: string;
}) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  const danger = pct >= 90;
  const warning = pct >= 70;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-foreground">{formatNumber(used)}</span>
        <span className="text-muted-foreground font-medium">
          {limit === 0
            ? "Disabled"
            : limit !== null && limit !== undefined
              ? `of ${formatNumber(limit)}`
              : "Unlimited"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            danger ? "bg-red-500" : warning ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: Invoice["status"] }) {
  const meta: Record<Invoice["status"], { label: string; className: string }> = {
    paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    open: { label: "Open", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
    uncollectible: { label: "Uncollectible", className: "bg-red-500/10 text-red-400 border-red-500/30" },
    void: { label: "Void", className: "bg-muted text-muted-foreground border-border" },
  };
  const m = meta[status] ?? meta.draft;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", m.className)}>
      {m.label}
    </span>
  );
}

export default function BillingPage() {
  const { data: subData, isLoading: subLoading, refetch: refetchSub } = useSubscription();
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useUsage();
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices();
  const { data: plansData, isLoading: plansLoading } = usePlans();

  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: projectsList, isLoading: projectsLoading } = useProjects();
  const { data: apiKeysList, isLoading: apiKeysLoading } = useApiKeys(projectId);
  const { data: originsList, isLoading: originsLoading } = useOrigins(projectId);

  const projectsCount = projectsList?.length ?? 0;
  const apiKeysCount = apiKeysList?.filter((k) => k.status === "active").length ?? 0;
  const originsCount = originsList?.length ?? 0;
  const resourcesLoading = projectsLoading || apiKeysLoading || originsLoading || usageLoading;

  const checkout = useCheckout();
  const portal = useBillingPortal();
  const cancelMutation = useCancelSubscription();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showPlans, setShowPlans] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const subscription = subData?.subscription ?? null;
  const currentPlan = subData?.plan ?? null;
  const totals = usage?.totals;
  const periodStart = usage?.periodStart;
  const periodEnd = usage?.periodEnd;
  const freeUsed = usage?.freeRequestsUsed ?? 0;
  const freeLimit = usage?.freeRequestsLimit ?? 20_000;

  const activePlans = plansData?.filter((p) => p.isActive) ?? [];

  const handleCheckout = async (planId: string) => {
    try {
      const { checkoutUrl } = await checkout.mutateAsync({
        planId,
        billingCycle,
        successUrl: window.location.origin + "/dashboard/billing?success=true",
        cancelUrl: window.location.origin + "/dashboard/billing?canceled=true",
      });
      window.location.href = checkoutUrl;
    } catch (err: any) {
      alert(err.message ?? "Checkout failed.");
    }
  };

  const handleManageBilling = async () => {
    try {
      const { portalUrl } = await portal.mutateAsync(window.location.origin + "/dashboard/billing");
      window.open(portalUrl, "_blank");
    } catch (err: any) {
      alert(err.message ?? "Portal redirect failed.");
    }
  };

  const handleCancelSubscription = async (force: boolean) => {
    try {
      const res = await cancelMutation.mutateAsync({ force });
      alert(res.message || "Subscription cancelled successfully.");
      setShowCancelModal(false);
      refetchSub();
    } catch (err: any) {
      alert(err.message || "Failed to cancel subscription.");
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Subscriptions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your subscription tier, billing portal settings, and view API usage metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {periodEnd && (
            <span className="text-xs text-muted-foreground mr-2">
              Period: <span className="font-medium text-foreground">{formatDate(periodStart)}</span> to{" "}
              <span className="font-medium text-foreground">{formatDate(periodEnd)}</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => {
              refetchSub();
              refetchUsage();
              refetchInvoices();
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Sync
          </Button>
        </div>
      </div>

      {/* Usage & Limits Card */}
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resource Usage & Quotas</CardTitle>
          <CardDescription className="text-xs">
            Real-time consumption and limits for traffic and configuration resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Traffic metrics */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3">Traffic & Execution</h4>
            {resourcesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Requests */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-blue-400" />
                      {subscription ? "Total Requests" : "Free Requests (Global)"}
                    </p>
                  </div>
                  <UsageBar
                    used={subscription ? (totals?.totalRequests ?? 0) : freeUsed}
                    limit={subscription ? (currentPlan?.requestsPerMonthLimit ?? null) : freeLimit}
                  />
                </div>

                {/* Bandwidth */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-cyan-400" />
                      Bandwidth
                    </p>
                  </div>
                  <UsageBar
                    used={Math.round((totals?.totalBandwidthBytes ?? 0) / (1024 * 1024 * 1024))}
                    limit={currentPlan?.bandwidthGbLimit ?? 1}
                  />
                </div>

                {/* AI Calls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-purple-400" />
                      AI Calls
                    </p>
                  </div>
                  <UsageBar
                    used={totals?.aiTotalCalls ?? 0}
                    limit={
                      subscription
                        ? (currentPlan?.id === "pro"
                          ? 50000
                          : currentPlan?.id === "team"
                            ? 250000
                            : currentPlan?.id === "enterprise" || currentPlan?.id?.startsWith("enterprise_")
                              ? 9999999
                              : 0)
                        : 0
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <Separator className="opacity-40" />

          {/* Configuration/Resource limits */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3">Resource Configuration</h4>
            {resourcesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Projects */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-orange-400" />
                      Projects (Account-wide)
                    </p>
                  </div>
                  <UsageBar
                    used={projectsCount}
                    limit={currentPlan?.projectsLimit ?? 3}
                  />
                </div>

                {/* API Keys */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-yellow-400" />
                      Active API Keys (Selected Project)
                    </p>
                  </div>
                  <UsageBar
                    used={apiKeysCount}
                    limit={currentPlan?.apiKeysPerProjectLimit ?? 3}
                  />
                </div>

                {/* Origins */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-green-400" />
                      Origins (Selected Project)
                    </p>
                  </div>
                  <UsageBar
                    used={originsCount}
                    limit={currentPlan?.originsPerProjectLimit ?? 2}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className={cn("grid gap-6", subscription ? "md:grid-cols-3" : "grid-cols-1 max-w-3xl")}>
        {/* Current Plan Overview Card */}
        <Card className={cn("border-border/60 bg-card/50", subscription ? "md:col-span-2" : "col-span-1")}>
          <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Current Subscription</CardTitle>
              <CardDescription className="text-xs">
                Your current active plan and billing status
              </CardDescription>
            </div>
            {subscription && (
              <span className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                subscription.status === "active" || subscription.status === "trialing"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              )}>
                {subscription.status}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {subLoading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : currentPlan ? (
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {formatCurrency(
                      subscription?.billingCycle === "yearly"
                        ? (currentPlan.priceYearlyUsd ?? currentPlan.priceMonthlyUsd * 12) / 12
                        : currentPlan.priceMonthlyUsd
                    )}
                  </span>
                  <span className="mb-1 text-xs text-muted-foreground">/ month</span>
                  <span className="mb-1 text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded capitalize">
                    Billed {subscription?.billingCycle}
                  </span>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{currentPlan.name} Plan</p>
                    {subscription?.cancelAtPeriodEnd && (
                      <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                        Cancels on {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentPlan.description ?? "Access to premium edge caching, proxy routing, and AI rules."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground font-medium">Monthly Cost</p>
                    <p className="font-semibold mt-0.5 text-foreground">
                      {formatCurrency(currentPlan.priceMonthlyUsd)}
                    </p>
                  </div>
                  {currentPlan.priceYearlyUsd && (
                    <div>
                      <p className="text-muted-foreground font-medium">Yearly Rate</p>
                      <p className="font-semibold mt-0.5 text-foreground">
                        {formatCurrency(currentPlan.priceYearlyUsd)}/yr
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground font-medium">Renews On</p>
                    <p className="font-semibold mt-0.5 text-foreground">
                      {subscription ? formatDate(subscription.currentPeriodEnd) : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={handleManageBilling}
                    disabled={portal.isPending}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-9"
                  >
                    {portal.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    Manage Payment Method
                  </Button>
                  <Button
                    onClick={() => setShowPlans(!showPlans)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-9 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
                  >
                    {showPlans ? "Hide Plans" : "Change Plan"}
                  </Button>
                  {subscription && subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
                    <Button
                      onClick={() => setShowCancelModal(true)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-9 border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/40"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-dashed p-6 flex flex-col items-center justify-center text-center">
                  <Info className="h-8 w-8 text-neutral-500 mb-2" />
                  <p className="text-sm font-bold">You are on the Free Tier</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                    Enjoy up to {formatNumber(freeLimit)} free requests per month. Upgrade to Starter or Pro to unlock pay-as-you-go scaling and AI modules.
                  </p>
                </div>

                <Button
                  onClick={() => setShowPlans(!showPlans)}
                  size="sm"
                  className="w-full gap-1.5 text-xs h-9 bg-orange-500 hover:bg-orange-400 font-bold"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {showPlans ? "Hide Upgrade Options" : "Upgrade Plan"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PAYG Cost Meter Card (Only shown if subscribed) */}
        {subscription && (
          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pay-As-You-Go Cost</CardTitle>
              <CardDescription className="text-xs">
                Over-quota usage cost this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-4xl font-extrabold tracking-tight font-mono text-primary">
                      {formatCurrency(totals?.paygCostUsd ?? 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Accumulated PAYG charges
                    </span>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Billed Requests</span>
                      <span className="font-mono font-semibold">{formatNumber(totals?.paygRequests ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Spend Cap Limit</span>
                      <span className="font-semibold">
                        {subscription?.paygSpendCapUsd ? formatCurrency(subscription.paygSpendCapUsd) : "No Spend Cap"}
                      </span>
                    </div>
                  </div>

                  {currentPlan?.payAsYouGoEnabled ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[11px] text-emerald-400 flex items-start gap-1.5 leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        PAYG active. Extra requests charged at {formatCurrency(currentPlan.paygPricePerRequest ?? 0)} / 10K.
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-[11px] text-yellow-500 flex items-start gap-1.5 leading-relaxed">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        PAYG disabled. Traffic will be blocked once limits are exhausted.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Spacer */}

      {/* Upgrade & Tier Selector (Toggled by showPlans state) */}
      {showPlans && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Select Plan Tier</h2>
              <p className="text-xs text-muted-foreground">
                Upgrade or downgrade your platform resources at any time.
              </p>
            </div>

            {/* Billing Cycle Switch */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card/85 p-1 h-9">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium transition-all",
                  billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-all",
                  billingCycle === "yearly" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
                <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 text-[9px] font-semibold">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {plansLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {activePlans
                .filter((p) => p.id !== "free" && p.id !== "enterprise" && !p.id.startsWith("enterprise_"))
                .map((plan) => {
                  const isCurrent = currentPlan?.id === plan.id;
                  const price = billingCycle === "yearly" ? plan.priceYearlyUsd : plan.priceMonthlyUsd;
                  const displayPrice = price ? (cycle: typeof billingCycle) => cycle === "yearly" ? price / 12 : price : () => 0;

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative flex flex-col rounded-2xl border bg-card p-5 transition-all duration-300 hover:border-border/80 hover:shadow-lg",
                        plan.id === "pro" ? "border-orange-500/40 bg-orange-500/[0.02]" : "border-border/60"
                      )}
                    >
                      {plan.id === "pro" && (
                        <div className="absolute -top-3 left-0 right-0 flex justify-center">
                          <span className="rounded-full border border-orange-500/40 bg-orange-500/20 px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">
                            Recommended
                          </span>
                        </div>
                      )}

                      <div className="mb-4 flex-1">
                        <h3 className="text-sm font-bold text-foreground capitalize">{plan.name}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1 min-h-8">
                          {plan.description ?? "Standard volume proxy options."}
                        </p>
                        <div className="mt-3 flex items-end gap-1">
                          <span className="text-2xl font-extrabold text-foreground">
                            ${displayPrice(billingCycle).toFixed(0)}
                          </span>
                          <span className="mb-0.5 text-[10px] text-muted-foreground">/mo</span>
                        </div>
                        {billingCycle === "yearly" && price && (
                          <p className="text-[9px] text-emerald-400 mt-0.5">
                            Billed ${price}/yr
                          </p>
                        )}

                        <Separator className="my-4 opacity-50" />

                        <ul className="space-y-2 text-[11px] text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{formatNumber(plan.requestsPerMonthLimit)} requests/mo</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{plan.bandwidthGbLimit} GB Bandwidth included</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{plan.projectsLimit} Projects limit</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{plan.requestsPerSecondLimit} Requests/sec RPS</span>
                          </li>
                          {plan.aiWafEnabled ? (
                            <li className="flex items-center gap-2 font-medium text-purple-400">
                              <Zap className="h-3 w-3 text-purple-400 shrink-0" />
                              <span>AI security features enabled</span>
                            </li>
                          ) : (
                            <li className="flex items-center gap-2 text-neutral-600 line-through">
                              <Check className="h-3 w-3 text-neutral-600 shrink-0" />
                              <span>AI security features</span>
                            </li>
                          )}
                        </ul>
                      </div>

                      <Button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={isCurrent || checkout.isPending}
                        variant={plan.id === "pro" ? "default" : "outline"}
                        size="sm"
                        className="w-full text-xs font-semibold h-9"
                      >
                        {checkout.isPending && checkout.variables?.planId === plan.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        ) : null}
                        {isCurrent ? "Active Plan" : `Upgrade to ${plan.name}`}
                      </Button>
                    </div>
                  );
                })}

              {/* Custom Enterprise Card */}
              <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 justify-between">
                <div className="mb-4 flex-1">
                  <h3 className="text-sm font-bold text-foreground">Enterprise</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 min-h-8">
                    Custom request volumes, tailored SLAs, and direct support contracts.
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-2xl font-extrabold text-foreground">Custom</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Negotiated pricing contracts
                  </p>

                  <Separator className="my-4 opacity-50" />

                  <ul className="space-y-2 text-[11px] text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span>Unlimited request scaling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span>Custom bandwidth limits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span>Unlimited active projects</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-purple-400">
                      <Zap className="h-3 w-3 text-purple-400 shrink-0" />
                      <span>Dedicated CSM + Slack channel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span>Custom SLA uptime response</span>
                    </li>
                  </ul>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold h-9 border-orange-500/20 text-orange-400 hover:bg-orange-500/5 hover:border-orange-500/40"
                >
                  <Link href="/dashboard/contact-sales">
                    Contact Sales
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice History (Only shown if subscribed) */}
      {subscription && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Billing History</CardTitle>
            <CardDescription className="text-xs">
              Review past payments and download PDF invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-muted-foreground">
                  <thead>
                    <tr className="border-b border-border/60 pb-2">
                      <th className="py-2.5 font-medium text-foreground">Date</th>
                      <th className="py-2.5 font-medium text-foreground">Invoice ID</th>
                      <th className="py-2.5 font-medium text-foreground">Amount</th>
                      <th className="py-2.5 font-medium text-foreground">Status</th>
                      <th className="py-2.5 font-medium text-foreground text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/10">
                        <td className="py-3 font-medium text-foreground">{formatDate(inv.createdAt)}</td>
                        <td className="py-3 font-mono">{inv.stripeInvoiceId ?? inv.polarOrderId ?? inv.id.slice(0, 12)}</td>
                        <td className="py-3 font-mono text-foreground">{formatCurrency(inv.amount)}</td>
                        <td className="py-3">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 text-right">
                          {inv.invoiceUrl ? (
                            <a
                              href={inv.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              PDF <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No historical invoices found.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl border bg-card p-6 shadow-lg space-y-4"
            >
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold">Cancel Subscription</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose how you would like to cancel your subscription. Standard cancellation preserves access to premium benefits until the end of your billing cycle. Immediate cancellation terminates access immediately.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => handleCancelSubscription(false)}
                  disabled={cancelMutation.isPending}
                  variant="outline"
                  className="w-full text-xs font-semibold justify-start h-10 border-border"
                >
                  {cancelMutation.isPending && !cancelMutation.variables?.force && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Standard: Cancel at end of cycle
                </Button>
                <Button
                  onClick={() => handleCancelSubscription(true)}
                  disabled={cancelMutation.isPending}
                  variant="destructive"
                  className="w-full text-xs font-semibold justify-start h-10"
                >
                  {cancelMutation.isPending && cancelMutation.variables?.force && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Force Cancel: Terminate immediately
                </Button>
                <Button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelMutation.isPending}
                  variant="ghost"
                  className="w-full text-xs font-semibold h-10 border border-transparent hover:border-border"
                >
                  Keep Subscription
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
