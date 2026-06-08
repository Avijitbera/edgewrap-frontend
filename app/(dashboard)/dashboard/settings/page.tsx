"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Shield,
  Zap,
  Bot,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  PauseCircle,
  PlayCircle,
  X,
  Plus,
  ExternalLink,
  Copy,
  CheckCheck,
  Users,
  UserPlus,
  ArrowRightLeft,
  Database,
  ChevronDown,
  ChevronUp,
  Clock,
  LayoutGrid,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useProject,
  useUpdateProject,
  usePauseProject,
  useResumeProject,
  useDeleteProject,
  useCustomDomains,
  useAddCustomDomain,
  useRemoveCustomDomain,
  useVerifyCustomDomain,
  useProjectMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useInitiateTransfer,
  useCancelTransfer,
} from "@/lib/queries/settings";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
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
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        id={id}
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

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="py-0">
      <CardHeader className="border-b px-5 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs mt-0.5">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  );
}

// ─── Save Indicator ────────────────────────────────────────────────────────────

function SaveIndicator({
  isPending,
  isSuccess,
  isError,
  error,
}: {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: Error | null;
}) {
  if (isPending) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (isSuccess) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (isError) {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {(error as Error)?.message ?? "Error"}
      </span>
    );
  }
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject(projectId);
  const pauseProject = usePauseProject(projectId);
  const resumeProject = useResumeProject(projectId);
  const deleteProject = useDeleteProject(projectId);

  // Custom domains
  const { data: domains } = useCustomDomains(projectId);
  const addDomain = useAddCustomDomain(projectId);
  const removeDomain = useRemoveCustomDomain(projectId);
  const verifyDomain = useVerifyCustomDomain(projectId);

  // Members
  const { data: members } = useProjectMembers(projectId);
  const inviteMember = useInviteMember(projectId);
  const updateMemberRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);

  // Transfer
  const initiateTransfer = useInitiateTransfer(projectId);
  const cancelTransfer = useCancelTransfer(projectId);

  // Local form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [originTimeoutMs, setOriginTimeoutMs] = useState(30000);

  // Sync from project data
  useEffect(() => {
    if (project) {
      setName(project.name ?? "");
      setDescription(project.description ?? "");
      setOriginUrl(project.originUrl ?? "");
      setOriginTimeoutMs((project as any).originTimeoutMs ?? 30000);
    }
  }, [project]);

  // Custom domain input
  const [newDomain, setNewDomain] = useState("");

  // Member invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "developer" | "viewer">("developer");

  // Transfer
  const [transferEmail, setTransferEmail] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const { copied, copy } = useCopy();

  const handleSaveGeneral = () => {
    updateProject.mutate({ name, description, originUrl: originUrl || null, originTimeoutMs });
  };

  const handleToggle = (field: string) => (value: boolean) => {
    if (!projectId) return;
    updateProject.mutate({ [field]: value } as any);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    await addDomain.mutateAsync(newDomain.trim());
    setNewDomain("");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
    setInviteEmail("");
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmail.trim()) return;
    await initiateTransfer.mutateAsync(transferEmail.trim());
    setShowTransferConfirm(false);
    setTransferEmail("");
  };

  const handleDelete = async () => {
    if (deleteConfirm !== project?.name) return;
    await deleteProject.mutateAsync("User requested deletion");
  };

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Settings className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view settings.</p>
      </div>
    );
  }

  const isReadonly = project?.status === "readonly";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ───────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Project Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure and manage your project
            </p>
          </div>
        </div>
        {project && (
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              project.status === "active"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : project.status === "readonly"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                project.status === "active"
                  ? "bg-green-400 animate-pulse"
                  : project.status === "readonly"
                  ? "bg-amber-400"
                  : "bg-red-400"
              )}
            />
            {project.status}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 p-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : (
          <>
            {/* ── Readonly Banner ───────────────────────── */}
            {isReadonly && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    Project is read-only
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(project as any)?._readonlyNotice ??
                      "This project is currently read-only. Configuration edits are disabled."}
                  </p>
                </div>
              </div>
            )}

            {/* ── Project Info ──────────────────────────── */}
            <Section
              icon={<LayoutGrid className="h-3.5 w-3.5 text-primary" />}
              title="General"
              description="Basic project information"
            >
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="setting-name" className="text-xs">
                      Project Name
                    </Label>
                    <Input
                      id="setting-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isReadonly}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="setting-slug" className="text-xs">
                      Slug
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="setting-slug"
                        value={project?.slug ?? ""}
                        readOnly
                        className="h-8 text-sm bg-muted/30 font-mono"
                      />
                      <button
                        onClick={() => copy(project?.slug ?? "", "slug")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied === "slug" ? (
                          <CheckCheck className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="setting-desc" className="text-xs">
                    Description{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="setting-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this project do?"
                    disabled={isReadonly}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Edge URL */}
                {project?.edgeUrl && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Edge URL</Label>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
                      <code className="flex-1 text-xs font-mono text-muted-foreground break-all">
                        {project.edgeUrl}
                      </code>
                      <button
                        onClick={() => copy(project.edgeUrl!, "edge-url")}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {copied === "edge-url" ? (
                          <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={project.edgeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <SaveIndicator
                    isPending={updateProject.isPending}
                    isSuccess={updateProject.isSuccess}
                    isError={updateProject.isError}
                    error={updateProject.error as Error}
                  />
                  <Button
                    id="save-general-settings"
                    size="sm"
                    onClick={handleSaveGeneral}
                    disabled={updateProject.isPending || isReadonly}
                  >
                    {updateProject.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            </Section>

            {/* ── Origin ────────────────────────────────── */}
            <Section
              icon={<Globe className="h-3.5 w-3.5 text-primary" />}
              title="Origin"
              description="Configure the upstream server this project proxies to"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="setting-origin-url" className="text-xs">
                    Origin URL
                  </Label>
                  <Input
                    id="setting-origin-url"
                    placeholder="https://api.yourdomain.com"
                    value={originUrl}
                    onChange={(e) => setOriginUrl(e.target.value)}
                    disabled={isReadonly}
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setting-origin-timeout" className="text-xs">
                    Timeout (ms)
                  </Label>
                  <Input
                    id="setting-origin-timeout"
                    type="number"
                    min={1000}
                    max={120000}
                    step={500}
                    value={originTimeoutMs}
                    onChange={(e) => setOriginTimeoutMs(Number(e.target.value))}
                    disabled={isReadonly}
                    className="h-8 text-sm w-40"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Min 1 000 ms · Max 120 000 ms
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    id="save-origin-settings"
                    size="sm"
                    onClick={handleSaveGeneral}
                    disabled={updateProject.isPending || isReadonly}
                  >
                    Save Origin
                  </Button>
                </div>
              </div>
            </Section>

            {/* ── Services Toggles ──────────────────────── */}
            <Section
              icon={<Shield className="h-3.5 w-3.5 text-primary" />}
              title="Services"
              description="Enable or disable edge services for this project"
            >
              <div className="divide-y divide-border">
                <Toggle
                  id="toggle-waf"
                  label="Web Application Firewall (WAF)"
                  description="OWASP rules, IP controls, and AI anomaly detection"
                  checked={project?.wafEnabled ?? false}
                  onChange={handleToggle("wafEnabled")}
                  disabled={isReadonly}
                />
                <Toggle
                  id="toggle-ddos"
                  label="DDoS Protection"
                  description="Rate limiting and volumetric attack mitigation"
                  checked={project?.ddosProtectionEnabled ?? false}
                  onChange={handleToggle("ddosProtectionEnabled")}
                  disabled={isReadonly}
                />
                <Toggle
                  id="toggle-cache"
                  label="Edge Cache"
                  description="Cache API responses at the edge to reduce origin load"
                  checked={project?.cacheEnabled ?? false}
                  onChange={handleToggle("cacheEnabled")}
                  disabled={isReadonly}
                />
                <Toggle
                  id="toggle-bot"
                  label="Bot Detection"
                  description="Identify and manage automated traffic"
                  checked={project?.botDetectionEnabled ?? false}
                  onChange={handleToggle("botDetectionEnabled")}
                  disabled={isReadonly}
                />
                <Toggle
                  id="toggle-replay"
                  label="Request Replay"
                  description="Replay failed requests for debugging"
                  checked={project?.replayEnabled ?? false}
                  onChange={handleToggle("replayEnabled")}
                  disabled={isReadonly}
                />
                <Toggle
                  id="toggle-ai-insights"
                  label="AI Security & Performance Insights"
                  description="AI-generated summaries, anomaly detections, and cost optimization recommendations"
                  checked={project?.aiInsightsEnabled ?? false}
                  onChange={handleToggle("aiInsightsEnabled")}
                  disabled={isReadonly}
                />
              </div>
              <SaveIndicator
                isPending={updateProject.isPending}
                isSuccess={updateProject.isSuccess}
                isError={updateProject.isError}
                error={updateProject.error as Error}
              />
            </Section>

            {/* ── Custom Domains ────────────────────────── */}
            <Section
              icon={<Globe className="h-3.5 w-3.5 text-primary" />}
              title="Custom Domains"
              description="Point your own domain to this project's edge URL"
            >
              <div className="space-y-3">
                {/* Add domain */}
                <form onSubmit={handleAddDomain} className="flex items-center gap-2">
                  <Input
                    id="add-domain-input"
                    placeholder="api.yourdomain.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="h-8 text-sm flex-1 font-mono"
                    disabled={isReadonly}
                  />
                  <Button
                    id="add-domain-btn"
                    type="submit"
                    size="sm"
                    disabled={addDomain.isPending || isReadonly || !newDomain.trim()}
                    className="gap-1"
                  >
                    {addDomain.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Add
                  </Button>
                </form>

                {addDomain.isError && (
                  <p className="text-xs text-destructive">
                    {(addDomain.error as Error).message}
                  </p>
                )}

                {/* Domain list */}
                {domains && domains.length > 0 ? (
                  <div className="space-y-2">
                    {domains.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2"
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <code className="flex-1 text-xs font-mono">{d.domain}</code>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            d.status === "active"
                              ? "border-green-500/30 bg-green-500/10 text-green-400"
                              : d.status === "pending"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              : "border-red-500/30 bg-red-500/10 text-red-400"
                          )}
                        >
                          {d.status}
                        </span>
                        {d.status !== "active" && (
                          <Button
                            id={`verify-domain-${d.id}`}
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px]"
                            disabled={verifyDomain.isPending}
                            onClick={() => verifyDomain.mutate(d.id)}
                          >
                            {verifyDomain.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        )}
                        <button
                          onClick={() => removeDomain.mutate(d.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    No custom domains added yet.
                  </p>
                )}

                {/* DNS instructions */}
                {domains && domains.some((d) => d.status !== "active") && (
                  <div className="rounded-lg border bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground/70">
                      DNS Verification
                    </p>
                    <p>
                      Add a CNAME record pointing your domain to your edge URL:
                    </p>
                    {project?.edgeUrl && (
                      <div className="flex items-center gap-2 mt-1">
                        <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {project.edgeUrl.replace("https://", "")}
                        </code>
                        <button
                          onClick={() =>
                            copy(
                              project.edgeUrl!.replace("https://", ""),
                              "cname"
                            )
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copied === "cname" ? (
                            <CheckCheck className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>

            {/* ── Team Members ──────────────────────────── */}
            <Section
              icon={<Users className="h-3.5 w-3.5 text-primary" />}
              title="Team Members"
              description="Manage who has access to this project"
            >
              <div className="space-y-3">
                {/* Invite form */}
                <form
                  onSubmit={handleInvite}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <Input
                    id="invite-email"
                    placeholder="colleague@company.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                  <Select
                    value={inviteRole}
                    onValueChange={(v) =>
                      setInviteRole(
                        v as "admin" | "developer" | "viewer"
                      )
                    }
                  >
                    <SelectTrigger id="invite-role" className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                      <SelectItem value="developer" className="text-xs">Developer</SelectItem>
                      <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    id="invite-member-btn"
                    type="submit"
                    size="sm"
                    disabled={inviteMember.isPending || !inviteEmail.trim()}
                    className="gap-1"
                  >
                    {inviteMember.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3" />
                    )}
                    Invite
                  </Button>
                </form>

                {inviteMember.isSuccess && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Invitation sent!
                  </p>
                )}

                {/* Members list */}
                {members && members.length > 0 ? (
                  <div className="space-y-1.5">
                    {members.map((m) => {
                      const roleColors: Record<string, string> = {
                        admin: "border-purple-500/30 bg-purple-500/10 text-purple-400",
                        developer:
                          "border-blue-500/30 bg-blue-500/10 text-blue-400",
                        viewer:
                          "border-muted text-muted-foreground",
                      };
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase">
                            {m.userId.slice(0, 2)}
                          </div>
                          <span className="flex-1 text-xs font-mono truncate">
                            {m.userId}
                          </span>
                          <Select
                            value={m.role}
                            onValueChange={(v) =>
                              updateMemberRole.mutate({
                                memberId: m.id,
                                role: v as "admin" | "developer" | "viewer",
                              })
                            }
                          >
                            <SelectTrigger
                              id={`member-role-${m.id}`}
                              className={cn(
                                "h-6 w-24 text-[11px] border rounded-full px-2",
                                roleColors[m.role]
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                              <SelectItem value="developer" className="text-xs">Developer</SelectItem>
                              <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => removeMember.mutate(m.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    No team members yet.
                  </p>
                )}
              </div>
            </Section>

            {/* ── Project Actions ───────────────────────── */}
            <Section
              icon={<Database className="h-3.5 w-3.5 text-primary" />}
              title="Project State"
              description="Pause, resume, or transfer ownership"
            >
              <div className="space-y-3">
                {/* Pause / Resume */}
                {project?.status === "active" ? (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Pause Project</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Temporarily disable traffic proxying. You can resume any time.
                      </p>
                    </div>
                    <Button
                      id="pause-project-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => pauseProject.mutate()}
                      disabled={pauseProject.isPending}
                      className="gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    >
                      {pauseProject.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PauseCircle className="h-3.5 w-3.5" />
                      )}
                      Pause
                    </Button>
                  </div>
                ) : project?.status === "readonly" &&
                  (project as any).statusReason === "owner_paused" ? (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Resume Project</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Re-enable traffic proxying.
                      </p>
                    </div>
                    <Button
                      id="resume-project-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => resumeProject.mutate()}
                      disabled={resumeProject.isPending}
                      className="gap-1.5 border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      {resumeProject.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5" />
                      )}
                      Resume
                    </Button>
                  </div>
                ) : null}

                {/* Transfer Ownership */}
                <div className="rounded-lg border bg-muted/10 px-4 py-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium">Transfer Ownership</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Transfer this project to another user. They'll receive an invitation.
                    </p>
                  </div>

                  {(project as any)?.pendingTransferTo ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-amber-400 flex-1">
                        Transfer pending — expires{" "}
                        {project &&
                          formatDate((project as any).transferExpiresAt ?? "")}
                      </p>
                      <Button
                        id="cancel-transfer-btn"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() => cancelTransfer.mutate()}
                        disabled={cancelTransfer.isPending}
                      >
                        {cancelTransfer.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Cancel Transfer"
                        )}
                      </Button>
                    </div>
                  ) : showTransferConfirm ? (
                    <form onSubmit={handleTransfer} className="flex gap-2">
                      <Input
                        id="transfer-email"
                        placeholder="recipient@email.com"
                        type="email"
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        className="h-8 text-sm flex-1"
                        required
                      />
                      <Button
                        id="confirm-transfer-btn"
                        type="submit"
                        size="sm"
                        className="gap-1"
                        disabled={initiateTransfer.isPending}
                      >
                        {initiateTransfer.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="h-3 w-3" />
                        )}
                        Send
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTransferConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <Button
                      id="start-transfer-btn"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setShowTransferConfirm(true)}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Initiate Transfer
                    </Button>
                  )}
                </div>
              </div>
            </Section>

            {/* ── Danger Zone ───────────────────────────── */}
            <Card className="py-0 border-destructive/30">
              <CardHeader className="border-b border-destructive/20 px-5 pb-3 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-destructive">
                      Danger Zone
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Irreversible actions — proceed with caution
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-4">
                {!showDelete ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Delete Project</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Schedules a hard purge in 30 days. You can cancel within that window.
                      </p>
                    </div>
                    <Button
                      id="start-delete-btn"
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDelete(true)}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-destructive">
                      Confirm deletion
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Type{" "}
                      <strong className="text-foreground font-mono">
                        {project?.name}
                      </strong>{" "}
                      to confirm. This will schedule the project for deletion.
                    </p>
                    <Input
                      id="delete-confirm-input"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={project?.name}
                      className="h-8 text-sm border-destructive/50 focus-visible:ring-destructive"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        id="confirm-delete-btn"
                        variant="destructive"
                        size="sm"
                        disabled={
                          deleteConfirm !== project?.name ||
                          deleteProject.isPending
                        }
                        onClick={handleDelete}
                        className="gap-1.5"
                      >
                        {deleteProject.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Permanently Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDelete(false);
                          setDeleteConfirm("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    {deleteProject.isError && (
                      <p className="text-xs text-destructive">
                        {(deleteProject.error as Error).message}
                      </p>
                    )}
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
