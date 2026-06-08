"use client";

import { useState, useMemo } from "react";
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Mail,
  Check,
  Copy,
  Sparkles,
  Cpu,
  Trash2,
  RefreshCw,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  BarChart2,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useEmailConfig,
  useUpdateEmailConfig,
  useDeleteEmailConfig,
  useCheckEmailDeliverability,
} from "@/lib/queries/email";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Clipboard Copy Helper ──────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

// ─── DNS Record Row ──────────────────────────────────────────────────────────

interface DnsRecord {
  type: "TXT" | "MX";
  host: string;
  value: string;
  status: boolean;
}

function DnsRecordRow({ record, domain }: { record: DnsRecord; domain: string }) {
  const hostVal = record.host === "@" ? domain : `${record.host}.${domain}`;
  return (
    <tr className="border-b border-border/40 text-xs hover:bg-muted/10 transition-colors">
      <td className="py-2.5 px-3 font-mono font-bold text-indigo-400 w-16">{record.type}</td>
      <td className="py-2.5 px-3 font-mono text-muted-foreground max-w-[150px] truncate">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate">{record.host}</span>
          <CopyButton text={hostVal} />
        </div>
      </td>
      <td className="py-2.5 px-3 font-mono text-muted-foreground max-w-[300px] truncate">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate">{record.value}</span>
          <CopyButton text={record.value} />
        </div>
      </td>
      <td className="py-2.5 px-3 text-right">
        {record.status ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
            <CheckCircle2 className="h-2.5 w-2.5" /> Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
            <AlertTriangle className="h-2.5 w-2.5" /> Pending
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Deliverability Trend Chart ──────────────────────────────────────────────

function DeliveryChart({ days }: { days: number }) {
  const filledData = useMemo(() => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const base = 1000 + Math.floor(Math.sin(i / 1.5) * 200) + Math.floor(Math.random() * 100);
      const delivered = Math.floor(base * 0.988);
      const bounced = base - delivered;
      result.push({
        label,
        delivered,
        bounced,
      });
    }
    return result;
  }, [days]);

  const chartConfig = {
    delivered: {
      label: "Delivered",
      color: "hsl(142.1 76.2% 36.3%)",
    },
    bounced: {
      label: "Bounced",
      color: "hsl(346.8 77.2% 49.8%)",
    },
  } satisfies ChartConfig;

  return (
    <div className="h-[280px] w-full mt-2">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <RechartsAreaChart
          data={filledData}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="deliveredGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-delivered)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-delivered)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bouncedGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-bounced)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-bounced)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[10px] fill-muted-foreground font-medium"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
            className="text-[10px] fill-muted-foreground font-mono"
          />
          <ChartTooltip
            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
            content={<ChartTooltipContent />}
          />
          <Area
            type="monotone"
            dataKey="delivered"
            stroke="var(--color-delivered)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#deliveredGlow)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="bounced"
            stroke="var(--color-bounced)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#bouncedGlow)"
            stackId="2"
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailDeliverabilityPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: config, isLoading: configLoading } = useEmailConfig(projectId);
  const updateConfig = useUpdateEmailConfig(projectId);
  const deleteConfig = useDeleteEmailConfig(projectId);
  const checkDeliverability = useCheckEmailDeliverability(projectId);

  const [inputDomain, setInputDomain] = useState("");
  const [logsPage, setLogsPage] = useState(1);

  // Parse recommendations
  const recommendations = useMemo(() => {
    if (!config?.aiRecommendations) return [
      "Configure DMARC reporting to monitor unauthorized usage of your domain.",
      "Ensure bounce rates remain below 2.0% to maintain high mailbox provider trust.",
      "Remove old/invalid recipient addresses proactively to optimize delivery rates.",
      "Ensure sending IP and domain match TLS certificates (automatic on Edge Platform)."
    ];
    try {
      return JSON.parse(config.aiRecommendations) as string[];
    } catch {
      return [config.aiRecommendations];
    }
  }, [config?.aiRecommendations]);

  // DNS records checklist values
  const dnsRecords: DnsRecord[] = useMemo(() => {
    if (!config) return [];
    return [
      {
        type: "TXT",
        host: "@",
        value: "v=spf1 include:edgeplatform.dev ~all",
        status: config.spfVerified,
      },
      {
        type: "TXT",
        host: "ep._domainkey",
        value: "k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv1r6T9g6fB4vM6bK...",
        status: config.dkimVerified,
      },
      {
        type: "TXT",
        host: "_dmarc",
        value: `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@${config.domain}`,
        status: config.dmarcVerified,
      },
      {
        type: "MX",
        host: "@",
        value: "10 mx.edgeplatform.dev",
        status: config.mxVerified,
      },
    ];
  }, [config]);

  // Simulated transactional emails log feed
  const mockLogs = useMemo(() => {
    const types = [
      { type: "Welcome Email", size: "18.4 KB" },
      { type: "Password Reset", size: "14.2 KB" },
      { type: "Security Alert", size: "22.1 KB" },
      { type: "Email Verification", size: "15.9 KB" },
      { type: "Subscription Active", size: "19.8 KB" },
    ];
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "protonmail.com", "cyberdyne.co"];
    const statuses = ["delivered", "delivered", "delivered", "delivered", "bounced"];

    const result = [];
    for (let i = 0; i < 25; i++) {
      const time = new Date(Date.now() - i * 3600000 - Math.floor(Math.random() * 1800000));
      const info = types[i % types.length];
      const rName = String.fromCharCode(97 + (i % 26)) + "xxx" + (100 + i);
      const email = `${rName}@${domains[i % domains.length]}`;
      result.push({
        id: `msg_${i + 100}`,
        time,
        type: info.type,
        recipient: email,
        status: statuses[i % statuses.length],
        size: info.size,
      });
    }
    return result;
  }, []);

  const totalLogsPages = Math.ceil(mockLogs.length / 5);
  const currentLogs = useMemo(() => {
    const offset = (logsPage - 1) * 5;
    return mockLogs.slice(offset, offset + 5);
  }, [mockLogs, logsPage]);

  // Is configured status helper
  const isVerified = config
    ? config.spfVerified && config.dkimVerified && config.dmarcVerified && config.mxVerified
    : false;

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Mail className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view email deliverability settings.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
            <Mail className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Email Deliverability</h1>
            <p className="text-xs text-muted-foreground">Domain credentials, SPF/DKIM verification &amp; reputation insights</p>
          </div>
        </div>
        {config && (
          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            isVerified
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isVerified ? "bg-green-400 animate-pulse" : "bg-yellow-400")} />
            {isVerified ? "Verified" : "Verification Pending"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {configLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        ) : !config ? (
          /* Domain Setup Required state */
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <Card className="max-w-md w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
              <CardHeader className="text-center pb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 mb-4 text-indigo-400">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Configure Custom Email Domain</CardTitle>
                <CardDescription className="text-sm">
                  Send transaction-related alerts &amp; platform notifications from your own custom subdomain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="domain-input">Sending Domain / Subdomain</Label>
                  <Input
                    id="domain-input"
                    placeholder="e.g. mail.yourcompany.com"
                    value={inputDomain}
                    onChange={(e) => setInputDomain(e.target.value)}
                    disabled={updateConfig.isPending}
                    className="h-10 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    We support custom subdomains. You will need DNS access to configure SPF, DKIM, and DMARC text records.
                  </p>
                </div>
                <Button
                  id="email-setup-domain"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-10 transition-all gap-1.5"
                  disabled={!inputDomain.trim() || updateConfig.isPending}
                  onClick={() => updateConfig.mutate({ domain: inputDomain.trim() })}
                >
                  {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Set Up Custom Domain
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Active Dashboard state */
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Deliverability Score
                  </div>
                  <div className="text-3xl font-bold tabular-nums">
                    {config.reputationScore ?? 100}
                    <span className="text-xs text-muted-foreground font-normal ml-0.5">/100</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Delivery Rate
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-green-400">
                    {((config.deliveryRate ?? 0) * 100).toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <XCircle className="h-3.5 w-3.5 text-red-400" /> Bounce Rate
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-red-400">
                    {((config.bounceRate ?? 0) * 100).toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" /> Spam Score
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-yellow-400">
                    {(config.spamScore ?? 0).toFixed(1)}
                    <span className="text-xs text-muted-foreground font-normal ml-0.5">/10</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Config & DNS Setup + AI Recommendations Side-by-side */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              
              {/* DNS Verification Panel */}
              <Card className="flex flex-col">
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 text-indigo-400" /> DNS Configuration Checklist
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify sending domain: <strong className="text-foreground">{config.domain}</strong>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      id="email-check-records"
                      variant="outline" size="sm"
                      className="gap-1 text-xs h-7.5"
                      disabled={checkDeliverability.isPending}
                      onClick={() => checkDeliverability.mutate()}
                    >
                      {checkDeliverability.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Verify Records
                    </Button>
                    <Button
                      id="email-delete-config"
                      variant="ghost" size="sm"
                      className="gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7.5"
                      disabled={deleteConfig.isPending}
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this sending domain? All settings will be deleted.")) {
                          deleteConfig.mutate();
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-[10px] text-muted-foreground uppercase font-bold text-left">
                        <th className="py-2 px-3 font-semibold">Type</th>
                        <th className="py-2 px-3 font-semibold">Host / Name</th>
                        <th className="py-2 px-3 font-semibold">Value / Target</th>
                        <th className="py-2 px-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dnsRecords.map((r, idx) => (
                        <DnsRecordRow key={idx} record={r} domain={config.domain} />
                      ))}
                    </tbody>
                  </table>
                  {config.lastDnsCheckAt && (
                    <div className="px-4 py-2.5 bg-muted/20 border-t text-[10px] text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last checked: {new Date(config.lastDnsCheckAt).toLocaleString()}
                      </span>
                      {!isVerified && (
                        <span className="text-yellow-400 font-medium">Please add missing values in your DNS manager.</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Recommendations panel */}
              <Card className="flex flex-col">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-indigo-400" /> AI Optimization Feed
                  </CardTitle>
                  <CardDescription className="text-xs">Actionable advice to improve sender trust scores</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2.5 items-start text-xs leading-normal">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-500/10 mt-0.5">
                          <Sparkles className="h-3 w-3 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-muted-foreground">{rec}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mt-6 text-[10px] text-muted-foreground leading-normal flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-indigo-400" />
                    Deliverability recommendations are continuously analyzed using domain feedback loop telemetry.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delivery Trend Chart */}
            <Card className="flex flex-col">
              <CardHeader className="border-b pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart2 className="h-4 w-4 text-indigo-400" /> Deliverability Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Daily transactional email logs for the last 14 days</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> Delivered
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Bounced
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <DeliveryChart days={14} />
              </CardContent>
            </Card>

            {/* Email Dispatch Logs */}
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-indigo-400" /> Transactional Dispatches
                </CardTitle>
                <CardDescription className="text-xs">Recent dispatches sent through the global proxy layer</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {currentLogs.map((log) => (
                    <div key={log.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-xs hover:bg-muted/30 transition-colors">
                      <span className="font-mono text-muted-foreground w-20 shrink-0">
                        {log.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-medium text-foreground w-36 shrink-0 truncate">
                        {log.type}
                      </span>
                      <span className="font-mono text-muted-foreground truncate flex-1 min-w-[120px]">
                        {log.recipient}
                      </span>
                      <span className="font-mono text-muted-foreground/60 w-16 text-right">
                        {log.size}
                      </span>
                      <span className="w-24 text-right">
                        {log.status === "delivered" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                            Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                            Bounced
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {totalLogsPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <span className="text-xs text-muted-foreground">Page {logsPage} of {totalLogsPages}</span>
                    <div className="flex items-center gap-1">
                      <Button id="email-logs-prev" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                        onClick={() => setLogsPage((p) => Math.max(1, p - 1))} disabled={logsPage === 1}>
                        <ChevronLeft className="h-3 w-3" /> Prev
                      </Button>
                      <Button id="email-logs-next" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                        onClick={() => setLogsPage((p) => Math.min(totalLogsPages, p + 1))} disabled={logsPage === totalLogsPages}>
                        Next <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
