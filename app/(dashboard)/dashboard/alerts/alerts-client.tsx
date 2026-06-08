"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Webhook,
  Mail,
  Plus,
  Trash2,
  Loader2,
  Eye,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  Shield,
  Settings2,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useAlertPolicies,
  useCreateAlertPolicy,
  useUpdateAlertPolicy,
  useDeleteAlertPolicy,
  useAlertChannels,
  useCreateAlertChannel,
  useUpdateAlertChannel,
  useDeleteAlertChannel,
  useAlertDispatches,
  type AlertPolicy,
  type AlertChannel,
  type AlertDispatch,
} from "@/lib/queries/extended-edge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers & Badges ────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<AlertPolicy["triggerType"], string> = {
  waf_breach: "WAF Rule Violation",
  ddos_attack: "DDoS Attack Threshold",
  origin_down: "Origin Host Down",
  latency_spike: "Latency Spike",
  billing_limit: "Billing Limit Breach",
};

function TriggerTypeBadge({ type }: { type: AlertPolicy["triggerType"] }) {
  const label = TRIGGER_LABELS[type] ?? type;
  const colors: Record<AlertPolicy["triggerType"], string> = {
    waf_breach: "bg-red-500/10 text-red-400 border-red-500/20",
    ddos_attack: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    origin_down: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    latency_spike: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    billing_limit: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 font-medium text-[10px] sm:text-xs", colors[type] ?? "bg-muted text-muted-foreground border-border")}>
      {label}
    </span>
  );
}

const CHANNEL_ICONS: Record<AlertChannel["type"], React.ComponentType<{ className?: string }>> = {
  slack: MessageSquareIcon,
  discord: MessageSquareIcon,
  pagerduty: PhoneCall,
  email: Mail,
  webhook: Webhook,
};

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChannelTypeBadge({ type }: { type: AlertChannel["type"] }) {
  const Icon = CHANNEL_ICONS[type] ?? Webhook;
  const labels: Record<AlertChannel["type"], string> = {
    slack: "Slack Workspace",
    discord: "Discord Server",
    pagerduty: "PagerDuty Trigger",
    email: "Email Dispatch",
    webhook: "Raw HTTP Webhook",
  };

  const colors: Record<AlertChannel["type"], string> = {
    slack: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    discord: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pagerduty: "bg-red-500/10 text-red-400 border-red-500/20",
    email: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    webhook: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium text-[10px] sm:text-xs", colors[type] ?? "bg-muted text-muted-foreground border-border")}>
      <Icon className="h-3 w-3 shrink-0" />
      {labels[type] ?? type}
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

function DispatchStatusBadge({ status }: { status: AlertDispatch["dispatchStatus"] }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
        <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
        Delivered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
      <XCircle className="h-3 w-3 text-red-400 shrink-0" />
      Failed
    </span>
  );
}

function CodeBlock({ code, title }: { code: string | null | undefined; title?: string }) {
  if (!code) return <p className="text-[11px] text-muted-foreground italic p-2 border rounded border-dashed bg-muted/10">No body payload captured</p>;
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

// ─── Main Client Page ──────────────────────────────────────────────────────────

export default function AlertsClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const [activeTab, setActiveTab] = useState<"policies" | "channels" | "dispatches">("policies");
  const [dispatchPage, setDispatchPage] = useState(1);

  // Modals visibility states
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [viewingDispatch, setViewingDispatch] = useState<AlertDispatch | null>(null);

  // Add Policy Form state
  const [policyName, setPolicyName] = useState("");
  const [policyTriggerType, setPolicyTriggerType] = useState<AlertPolicy["triggerType"]>("waf_breach");
  const [policyThreshold, setPolicyThreshold] = useState("");
  const [policyIsEnabled, setPolicyIsEnabled] = useState(true);

  // Add Channel Form state
  const [channelType, setChannelType] = useState<AlertChannel["type"]>("slack");
  const [channelConfig, setChannelConfig] = useState("");
  const [channelIsEnabled, setChannelIsEnabled] = useState(true);

  // Queries & Mutations
  const { data: policies, isLoading: policiesLoading } = useAlertPolicies(projectId);
  const createPolicy = useCreateAlertPolicy(projectId);
  const updatePolicy = useUpdateAlertPolicy(projectId);
  const deletePolicy = useDeleteAlertPolicy(projectId);

  const { data: channels, isLoading: channelsLoading } = useAlertChannels(projectId);
  const createChannel = useCreateAlertChannel(projectId);
  const updateChannel = useUpdateAlertChannel(projectId);
  const deleteChannel = useDeleteAlertChannel(projectId);

  const { data: dispatchesResp, isLoading: dispatchesLoading } = useAlertDispatches(projectId, {
    page: dispatchPage,
    limit: 10,
  });

  // Reset page pagination when tab changes
  useEffect(() => {
    setDispatchPage(1);
  }, [activeTab]);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Bell className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Alerts &amp; Incidents.</p>
      </div>
    );
  }

  const handleCreatePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim()) return;

    try {
      await createPolicy.mutateAsync({
        name: policyName.trim(),
        triggerType: policyTriggerType,
        threshold: policyThreshold ? Number(policyThreshold) : undefined,
        isEnabled: policyIsEnabled,
      });
      setPolicyName("");
      setPolicyTriggerType("waf_breach");
      setPolicyThreshold("");
      setPolicyIsEnabled(true);
      setShowAddPolicyModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelConfig.trim()) return;

    try {
      await createChannel.mutateAsync({
        type: channelType,
        config: channelConfig.trim(),
        isEnabled: channelIsEnabled,
      });
      setChannelType("slack");
      setChannelConfig("");
      setChannelIsEnabled(true);
      setShowAddChannelModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePolicyStatusChange = (policy: AlertPolicy, enabled: boolean) => {
    updatePolicy.mutate({
      id: policy.id,
      name: policy.name,
      triggerType: policy.triggerType,
      threshold: policy.threshold ?? undefined,
      isEnabled: enabled,
    });
  };

  const handleChannelStatusChange = (channel: AlertChannel, enabled: boolean) => {
    updateChannel.mutate({
      id: channel.id,
      type: channel.type,
      config: channel.config,
      isEnabled: enabled,
    });
  };

  const dispatches = dispatchesResp?.data ?? [];
  const dispatchesMeta = dispatchesResp?.meta;
  const totalPages = dispatchesMeta ? Math.ceil(dispatchesMeta.total / 10) : 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Alerts &amp; Incidents</h1>
            <p className="text-xs text-muted-foreground">Configure warning rules and hook up notification channels for security events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Alerting Engine Active
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── Main Tab Navigation ───────────────────────── */}
        <div className="space-y-4">
          <div className="flex border-b border-border pb-px gap-4">
            <button
              onClick={() => setActiveTab("policies")}
              className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-colors relative",
                activeTab === "policies" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                Alert Policies
              </div>
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-colors relative",
                activeTab === "channels" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Webhook className="h-4 w-4" />
                Notification Channels
              </div>
            </button>
            <button
              onClick={() => setActiveTab("dispatches")}
              className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-colors relative",
                activeTab === "dispatches" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                Dispatch Audit Logs
              </div>
            </button>
          </div>

          {/* ── TAB CONTENT: ALERT POLICIES ───────────────── */}
          {activeTab === "policies" && (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Trigger Policies</CardTitle>
                    <CardDescription className="text-xs">Configure criteria thresholds that fire alerting incident messages.</CardDescription>
                  </div>
                  <Button
                    id="btn-new-policy"
                    size="sm"
                    className="gap-1.5 text-xs self-start sm:self-auto"
                    onClick={() => setShowAddPolicyModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Policy
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {policiesLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !policies || policies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <Bell className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No Alert policies found</p>
                    <p className="text-xs opacity-60">Create an alert rule to get notified during performance or security anomalies.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Policy Name</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Trigger Condition</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Threshold Value</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Rule Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Created At</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policies.map(policy => (
                          <tr key={policy.id} className="border-b hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {policy.name}
                            </td>
                            <td className="px-4 py-3">
                              <TriggerTypeBadge type={policy.triggerType} />
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              {policy.threshold !== null ? (
                                <span>
                                  {policy.triggerType === "latency_spike" && `${policy.threshold}ms`}
                                  {policy.triggerType === "billing_limit" && `$${policy.threshold}`}
                                  {policy.triggerType !== "latency_spike" && policy.triggerType !== "billing_limit" && `${policy.threshold} hits`}
                                </span>
                              ) : (
                                <span className="italic opacity-60">— (immediate)</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  policy.isEnabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
                                )} />
                                <Select
                                  value={policy.isEnabled ? "enabled" : "disabled"}
                                  onValueChange={(val) => handlePolicyStatusChange(policy, val === "enabled")}
                                  disabled={updatePolicy.isPending}
                                >
                                  <SelectTrigger className="h-7 text-[10px] w-24 bg-muted/20 border-muted">
                                    <Settings2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="enabled" className="text-[10px]">Active</SelectItem>
                                    <SelectItem value="disabled" className="text-[10px]">Disabled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <FormatDate dateStr={policy.createdAt} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                id={`btn-del-policy-${policy.id}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive-hover"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this alert policy?")) {
                                    deletePolicy.mutate(policy.id);
                                  }
                                }}
                                disabled={deletePolicy.isPending}
                              >
                                {deletePolicy.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
          )}

          {/* ── TAB CONTENT: NOTIFICATION CHANNELS ────────── */}
          {activeTab === "channels" && (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Outbound Channels</CardTitle>
                    <CardDescription className="text-xs">Establish target integrations where alert dispatches are delivered.</CardDescription>
                  </div>
                  <Button
                    id="btn-new-channel"
                    size="sm"
                    className="gap-1.5 text-xs self-start sm:self-auto"
                    onClick={() => setShowAddChannelModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Channel
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {channelsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !channels || channels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <Webhook className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No notification channels configured</p>
                    <p className="text-xs opacity-60">Connect Slack, Discord, webhooks, or emails to receive alerts.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Channel Type</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Target Endpoint / Destination</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Channel Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Connected At</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {channels.map(channel => (
                          <tr key={channel.id} className="border-b hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3">
                              <ChannelTypeBadge type={channel.type} />
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground break-all max-w-xs sm:max-w-md">
                              {channel.config}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  channel.isEnabled ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
                                )} />
                                <Select
                                  value={channel.isEnabled ? "enabled" : "disabled"}
                                  onValueChange={(val) => handleChannelStatusChange(channel, val === "enabled")}
                                  disabled={updateChannel.isPending}
                                >
                                  <SelectTrigger className="h-7 text-[10px] w-24 bg-muted/20 border-muted">
                                    <Settings2 className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="enabled" className="text-[10px]">Enabled</SelectItem>
                                    <SelectItem value="disabled" className="text-[10px]">Disabled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <FormatDate dateStr={channel.createdAt} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                id={`btn-del-channel-${channel.id}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive-hover"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this notification channel?")) {
                                    deleteChannel.mutate(channel.id);
                                  }
                                }}
                                disabled={deleteChannel.isPending}
                              >
                                {deleteChannel.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
          )}

          {/* ── TAB CONTENT: DISPATCH AUDIT LOGS ─────────── */}
          {activeTab === "dispatches" && (
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div>
                  <CardTitle className="text-base">Alert Dispatch Audit Logs</CardTitle>
                  <CardDescription className="text-xs">Browse all historical dispatches transmitted to connected channels.</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {dispatchesLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !dispatches || dispatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <Activity className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No alert dispatch logs found</p>
                    <p className="text-xs opacity-60">Any fired alerts will log their outbound transmissions here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Dispatched At</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Trigger Policy</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Channel Type</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Error Details</th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispatches.map((disp) => {
                          const policy = policies?.find(p => p.id === disp.policyId);
                          const policyName = policy ? policy.name : "System Trigger";
                          const channel = channels?.find(c => c.id === disp.channelId);
                          const channelType = channel ? channel.type : "webhook";

                          return (
                            <tr key={disp.id} className="border-b hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setViewingDispatch(disp)}>
                              <td className="px-4 py-3 text-muted-foreground font-mono">
                                <FormatDate dateStr={disp.dispatchedAt} />
                              </td>
                              <td className="px-4 py-3 font-semibold text-foreground">
                                {policyName}
                              </td>
                              <td className="px-4 py-3">
                                <ChannelTypeBadge type={channelType} />
                              </td>
                              <td className="px-4 py-3">
                                <DispatchStatusBadge status={disp.dispatchStatus} />
                              </td>
                              <td className="px-4 py-3 font-mono text-red-400 max-w-xs truncate">
                                {disp.errorMessage || <span className="text-muted-foreground/30 font-sans italic">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  id={`btn-view-disp-${disp.id}`}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[10px] font-semibold gap-1 hover:bg-muted"
                                  onClick={() => setViewingDispatch(disp)}
                                >
                                  <Eye className="h-3 w-3" />
                                  Details
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {dispatchesResp && totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{dispatchPage}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setDispatchPage(p => Math.max(1, p - 1))}
                        disabled={dispatchPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setDispatchPage(p => Math.min(totalPages, p + 1))}
                        disabled={dispatchPage === totalPages}
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

      {/* ── MODAL: CREATE POLICY ────────────────────────────────── */}
      {showAddPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">New Incident Trigger Policy</h3>
              </div>
              <button onClick={() => setShowAddPolicyModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePolicySubmit}>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="policy-name-input" className="text-xs text-muted-foreground">Policy Name *</Label>
                  <Input
                    id="policy-name-input"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="e.g. High WAF Threat Blocks"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="policy-trigger-select" className="text-xs text-muted-foreground">Trigger Condition Type *</Label>
                  <Select value={policyTriggerType} onValueChange={(val: any) => setPolicyTriggerType(val)}>
                    <SelectTrigger id="policy-trigger-select" className="h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waf_breach" className="text-xs">WAF Violation Breach</SelectItem>
                      <SelectItem value="ddos_attack" className="text-xs">DDoS Attack Limit</SelectItem>
                      <SelectItem value="origin_down" className="text-xs">Origin Host Offline</SelectItem>
                      <SelectItem value="latency_spike" className="text-xs">Latency Delay Spike</SelectItem>
                      <SelectItem value="billing_limit" className="text-xs">Monthly Cost Limit Exceeded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="policy-threshold-input" className="text-xs text-muted-foreground">Threshold Value <span className="text-[10px] text-muted-foreground/60">(optional)</span></Label>
                  <Input
                    id="policy-threshold-input"
                    type="number"
                    value={policyThreshold}
                    onChange={(e) => setPolicyThreshold(e.target.value)}
                    placeholder={
                      policyTriggerType === "latency_spike" ? "e.g. 1500 (ms)" :
                      policyTriggerType === "billing_limit" ? "e.g. 150 ($)" :
                      "e.g. 50 (hits)"
                    }
                    className="h-9 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground opacity-70">
                    Defines the numeric trigger condition (e.g. latency in milliseconds, billing in USD, count in request units).
                  </p>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs text-foreground font-semibold">Enable Rule</Label>
                    <p className="text-[10px] text-muted-foreground">Activate this policy rule on saving.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={policyIsEnabled}
                    onChange={(e) => setPolicyIsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              <div className="border-t px-5 py-3 flex justify-end gap-2 bg-muted/10">
                <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowAddPolicyModal(false)}>
                  Cancel
                </Button>
                <Button id="btn-save-policy" type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={createPolicy.isPending}>
                  {createPolicy.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Policy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE CHANNEL ───────────────────────────────── */}
      {showAddChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">New Outbound Dispatch Channel</h3>
              </div>
              <button onClick={() => setShowAddChannelModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateChannelSubmit}>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="channel-type-select" className="text-xs text-muted-foreground">Channel Type *</Label>
                  <Select value={channelType} onValueChange={(val: any) => setChannelType(val)}>
                    <SelectTrigger id="channel-type-select" className="h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slack" className="text-xs">Slack Workspace Connection</SelectItem>
                      <SelectItem value="discord" className="text-xs">Discord Server Connection</SelectItem>
                      <SelectItem value="email" className="text-xs">Direct Email Alert</SelectItem>
                      <SelectItem value="pagerduty" className="text-xs">PagerDuty Service Key</SelectItem>
                      <SelectItem value="webhook" className="text-xs">Generic HTTPS Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="channel-config-input" className="text-xs text-muted-foreground">Destination / Hook URL / Email *</Label>
                  <Input
                    id="channel-config-input"
                    value={channelConfig}
                    onChange={(e) => setChannelConfig(e.target.value)}
                    placeholder={
                      channelType === "email" ? "e.g. alerts@company.com" :
                      channelType === "pagerduty" ? "e.g. routing_key_123" :
                      "https://hooks.example.com/services/..."
                    }
                    className="h-9 text-xs font-mono"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground opacity-70">
                    Connection configuration credentials matching the target integration channel.
                  </p>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs text-foreground font-semibold">Enable Channel</Label>
                    <p className="text-[10px] text-muted-foreground">Activate this alert target immediately.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={channelIsEnabled}
                    onChange={(e) => setChannelIsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              <div className="border-t px-5 py-3 flex justify-end gap-2 bg-muted/10">
                <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowAddChannelModal(false)}>
                  Cancel
                </Button>
                <Button id="btn-save-channel" type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={createChannel.isPending}>
                  {createChannel.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Add Channel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW DISPATCH DETAILS ───────────────────────── */}
      {viewingDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Outbound Dispatch Alert Audit</h3>
              </div>
              <button onClick={() => setViewingDispatch(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Summary telemetry */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 rounded-xl border bg-muted/20 p-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Status Code</span>
                  <DispatchStatusBadge status={viewingDispatch.dispatchStatus} />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Dispatch ID</span>
                  <span className="font-semibold text-foreground truncate block max-w-[150px]" title={viewingDispatch.id}>{viewingDispatch.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wider font-sans font-semibold">Timestamp</span>
                  <FormatDate dateStr={viewingDispatch.dispatchedAt} />
                </div>
              </div>

              {viewingDispatch.errorMessage && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Transmission Failure Error
                  </h4>
                  <pre className="font-mono text-xs text-red-400/90 whitespace-pre-wrap">{viewingDispatch.errorMessage}</pre>
                </div>
              )}

              <CodeBlock code={viewingDispatch.payloadSent} title="Transmitted Alert JSON Payload" />
            </div>
            <div className="border-t px-5 py-3 shrink-0 flex justify-end bg-muted/10">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setViewingDispatch(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
