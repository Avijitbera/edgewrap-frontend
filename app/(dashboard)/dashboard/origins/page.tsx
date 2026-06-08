"use client";

import { useState } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Star,
  StarOff,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Server,
  Link,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useOrigins,
  useCreateOrigin,
  useUpdateOrigin,
  useDeleteOrigin,
  useCustomDomains,
  useAddCustomDomain,
  useVerifyCustomDomain,
  useDeleteCustomDomain,
  type Origin,
  type CustomDomain,
  type OriginPayload,
} from "@/lib/queries/origins";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const REGIONS = [
  { value: "", label: "Auto / No preference" },
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return { copied, copy };
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
        className
      )}
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function HealthDot({ healthy, failures }: { healthy: boolean; failures: number }) {
  return (
    <span
      title={healthy ? "Healthy" : `Unhealthy (${failures} consecutive failures)`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        healthy
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-red-500/30 bg-red-500/10 text-red-400"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", healthy ? "bg-green-400 animate-pulse" : "bg-red-400")} />
      {healthy ? "Healthy" : "Unhealthy"}
    </span>
  );
}

function DomainStatusBadge({ status }: { status: CustomDomain["status"] }) {
  const meta = {
    active: { label: "Active", color: "border-green-500/30 bg-green-500/10 text-green-400", icon: <CheckCircle2 className="h-3 w-3" /> },
    pending: { label: "Pending", color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400", icon: <Clock className="h-3 w-3" /> },
    failed: { label: "Failed", color: "border-red-500/30 bg-red-500/10 text-red-400", icon: <XCircle className="h-3 w-3" /> },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", meta.color)}>
      {meta.icon}{meta.label}
    </span>
  );
}

// ─── Origin Form ──────────────────────────────────────────────────────────────

function OriginForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: Partial<OriginPayload>;
  onSubmit: (data: OriginPayload) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [weight, setWeight] = useState(String(initial?.weight ?? 100));
  const [hcPath, setHcPath] = useState(initial?.healthCheckPath ?? "/health");
  const [hcInterval, setHcInterval] = useState(String(initial?.healthCheckIntervalSec ?? 30));
  const [hcTimeout, setHcTimeout] = useState(String(initial?.healthCheckTimeoutMs ?? 5000));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      label,
      url,
      region: region || undefined,
      weight: Number(weight),
      healthCheckPath: hcPath,
      healthCheckIntervalSec: Number(hcInterval),
      healthCheckTimeoutMs: Number(hcTimeout),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="origin-label" className="text-xs text-muted-foreground mb-1 block">Label *</Label>
          <Input id="origin-label" className="h-8 text-xs" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Primary US East" required />
        </div>
        <div>
          <Label htmlFor="origin-url" className="text-xs text-muted-foreground mb-1 block">Origin URL *</Label>
          <Input id="origin-url" className="h-8 text-xs font-mono" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com" required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="origin-region" className="text-xs text-muted-foreground mb-1 block">Region</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger id="origin-region" className="h-8 text-xs">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value || "__auto__"} className="text-xs">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="origin-weight" className="text-xs text-muted-foreground mb-1 block">Weight</Label>
          <Input id="origin-weight" className="h-8 text-xs" type="number" min={1} max={1000} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="origin-hc-path" className="text-xs text-muted-foreground mb-1 block">Health check path</Label>
          <Input id="origin-hc-path" className="h-8 text-xs font-mono" value={hcPath} onChange={(e) => setHcPath(e.target.value)} placeholder="/health" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="origin-hc-interval" className="text-xs text-muted-foreground mb-1 block">Check interval (sec)</Label>
          <Input id="origin-hc-interval" className="h-8 text-xs" type="number" min={5} max={3600} value={hcInterval} onChange={(e) => setHcInterval(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="origin-hc-timeout" className="text-xs text-muted-foreground mb-1 block">Timeout (ms)</Label>
          <Input id="origin-hc-timeout" className="h-8 text-xs" type="number" min={500} max={30000} value={hcTimeout} onChange={(e) => setHcTimeout(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button id="origin-form-submit" type="submit" size="sm" className="gap-1.5 text-xs" disabled={isPending}>
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {initial?.label ? "Save changes" : "Add origin"}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Origin Card ──────────────────────────────────────────────────────────────

function OriginCard({
  origin,
  projectId,
}: {
  origin: Origin;
  projectId: string;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateOrigin(projectId);
  const remove = useDeleteOrigin(projectId);

  const handleUpdate = (data: OriginPayload) => {
    update.mutate({ id: origin.id, ...data }, { onSuccess: () => setEditing(false) });
  };

  const handleSetPrimary = () => {
    update.mutate({ id: origin.id, isPrimary: true });
  };

  const lastChecked = origin.lastCheckedAt
    ? new Date(typeof origin.lastCheckedAt === "number" ? origin.lastCheckedAt * 1000 : origin.lastCheckedAt)
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        origin.isPrimary ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      )}
    >
      {!editing ? (
        <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{origin.label}</span>
                  {origin.isPrimary && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Star className="h-2.5 w-2.5" /> Primary
                    </span>
                  )}
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    origin.status === "active"
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-muted text-muted-foreground"
                  )}>
                    {origin.status}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <a
                    href={origin.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {origin.url}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <CopyButton text={origin.url} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HealthDot healthy={origin.isHealthy} failures={origin.consecutiveFailures} />
              {!origin.isPrimary && (
                <Button
                  id={`origin-set-primary-${origin.id}`}
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={handleSetPrimary}
                  disabled={update.isPending}
                  title="Set as primary"
                >
                  <StarOff className="h-3 w-3" /> Primary
                </Button>
              )}
              <Button
                id={`origin-edit-${origin.id}`}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                id={`origin-delete-${origin.id}`}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => remove.mutate(origin.id)}
                disabled={remove.isPending}
              >
                {remove.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {origin.region && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> {origin.region}
              </span>
            )}
            <span>Weight: <span className="font-mono text-foreground">{origin.weight}</span></span>
            <span>Health check: <span className="font-mono text-foreground">{origin.healthCheckPath || "/health"}</span></span>
            <span>Every <span className="font-mono text-foreground">{origin.healthCheckIntervalSec}s</span></span>
            {lastChecked && (
              <span className="ml-auto text-muted-foreground/60">
                Last checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <p className="mb-3 text-sm font-medium">Edit origin</p>
          <OriginForm
            initial={{
              label: origin.label,
              url: origin.url,
              region: origin.region ?? undefined,
              weight: origin.weight,
              healthCheckPath: origin.healthCheckPath ?? undefined,
              healthCheckIntervalSec: origin.healthCheckIntervalSec,
              healthCheckTimeoutMs: origin.healthCheckTimeoutMs,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            isPending={update.isPending}
          />
        </div>
      )}
    </div>
  );
}

// ─── Custom Domain Row ────────────────────────────────────────────────────────

function DomainRow({
  domain,
  projectId,
  edgeDomain,
}: {
  domain: CustomDomain;
  projectId: string;
  edgeDomain: string;
}) {
  const verify = useVerifyCustomDomain(projectId);
  const remove = useDeleteCustomDomain(projectId);
  const [showInstructions, setShowInstructions] = useState(domain.status === "pending");

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm hover:bg-muted/20 transition-colors">
        <DomainStatusBadge status={domain.status} />
        <span className="font-mono text-foreground">{domain.domain}</span>

        <div className="ml-auto flex items-center gap-2">
          {domain.status !== "active" && (
            <Button
              id={`domain-instructions-${domain.id}`}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowInstructions((v) => !v)}
            >
              {showInstructions ? "Hide" : "Setup"}
            </Button>
          )}
          {domain.status !== "active" && (
            <Button
              id={`domain-verify-${domain.id}`}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => verify.mutate(domain.id)}
              disabled={verify.isPending}
            >
              {verify.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Verify
            </Button>
          )}
          <Button
            id={`domain-delete-${domain.id}`}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => remove.mutate(domain.id)}
            disabled={remove.isPending}
          >
            {remove.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* DNS Instructions */}
      {showInstructions && domain.status !== "active" && (
        <div className="mx-4 mb-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs space-y-2">
          <p className="font-medium text-yellow-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> DNS Setup Required
          </p>
          <p className="text-muted-foreground">Add a <strong className="text-foreground">CNAME</strong> record in your DNS provider:</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[11px]">
            <span className="text-muted-foreground">Name:</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">{domain.domain}</span>
              <CopyButton text={domain.domain} />
            </div>
            <span className="text-muted-foreground">Type:</span>
            <span className="text-foreground">CNAME</span>
            <span className="text-muted-foreground">Value:</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">{edgeDomain}</span>
              <CopyButton text={edgeDomain} />
            </div>
            <span className="text-muted-foreground">TTL:</span>
            <span className="text-foreground">Auto / 3600</span>
          </div>
          <p className="text-muted-foreground/70">DNS propagation can take up to 48 hours. Click Verify when done.</p>
        </div>
      )}

      {/* Success - verification token display */}
      {verify.isSuccess && verify.data && (
        <div className={cn(
          "mx-4 mb-3 rounded-lg border px-3 py-2 text-xs",
          verify.data.verified
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        )}>
          {verify.data.verified ? (
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> {verify.data.message}</span>
          ) : (
            <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> {verify.data.message}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OriginsPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: origins, isLoading: originsLoading } = useOrigins(projectId);
  const { data: domains, isLoading: domainsLoading } = useCustomDomains(projectId);

  const createOrigin = useCreateOrigin(projectId);
  const addDomain = useAddCustomDomain(projectId);

  const [showAddOrigin, setShowAddOrigin] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [domainError, setDomainError] = useState("");

  // Get edge domain from backend edgeUrl, fallback to generating it using name & ID if missing
  const edgeDomain = currentProject
    ? (currentProject.edgeUrl
      ? currentProject.edgeUrl.replace(/^https?:\/\//, "")
      : (() => {
          const cleanName = currentProject.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 30);
          const suffix = currentProject.id.slice(-6).toLowerCase();
          return `${cleanName}-${suffix}.edgewrap.com`;
        })())
    : "";

  const handleAddOrigin = (data: OriginPayload) => {
    createOrigin.mutate(
      { ...data, isPrimary: (origins?.length ?? 0) === 0 },
      { onSuccess: () => setShowAddOrigin(false) }
    );
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError("");
    if (!newDomain.trim()) return;
    addDomain.mutate(newDomain.trim(), {
      onSuccess: () => setNewDomain(""),
      onError: (err: any) => setDomainError(err?.message ?? "Failed to add domain"),
    });
  };

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Globe className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to manage origins and domains.</p>
      </div>
    );
  }

  const primaryOrigin = origins?.find((o) => o.isPrimary);
  const healthyCount = origins?.filter((o) => o.isHealthy).length ?? 0;
  const totalCount = origins?.length ?? 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Origins &amp; Domains</h1>
            <p className="text-xs text-muted-foreground">Upstream servers, failover routing &amp; custom domain mapping</p>
          </div>
        </div>

        {/* Edge URL chip */}
        {edgeDomain && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Edge URL</span>
            <span className="font-mono text-xs text-foreground">{edgeDomain}</span>
            <CopyButton text={`https://${edgeDomain}`} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* Health Summary */}
        {!originsLoading && totalCount > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Server className="h-3.5 w-3.5" /> Total Origins</div>
                <div className="text-3xl font-bold">{totalCount}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><CheckCircle2 className="h-3.5 w-3.5" /> Healthy</div>
                <div className="text-3xl font-bold text-green-400">{healthyCount}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Star className="h-3.5 w-3.5" /> Primary</div>
                <div className="text-sm font-semibold truncate mt-1">{primaryOrigin?.label ?? "—"}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Origins Section ─────────────────────── */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Server className="h-4 w-4 text-primary" /> Origin Servers
                </CardTitle>
                <CardDescription className="text-xs">
                  Define upstream servers. Traffic is load-balanced by weight; unhealthy origins are automatically excluded.
                </CardDescription>
              </div>
              {!showAddOrigin && (
                <Button
                  id="add-origin-btn"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowAddOrigin(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Origin
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Add form */}
            {showAddOrigin && (
              <>
                <div className="px-4 py-4">
                  <p className="mb-3 text-sm font-medium">New origin</p>
                  <OriginForm
                    onSubmit={handleAddOrigin}
                    onCancel={() => setShowAddOrigin(false)}
                    isPending={createOrigin.isPending}
                  />
                </div>
                <Separator />
              </>
            )}

            {/* Origins list */}
            {originsLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : (origins?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Server className="h-10 w-10 opacity-20" />
                <p className="text-sm">No origins configured yet</p>
                <Button
                  id="add-origin-empty"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowAddOrigin(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add your first origin
                </Button>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {origins!.map((origin) => (
                  <OriginCard key={origin.id} origin={origin} projectId={projectId} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Custom Domains Section ──────────────── */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Link className="h-4 w-4 text-primary" /> Custom Domains
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Map your own domain to this project via CNAME. We verify ownership via live DNS lookup.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Add domain form */}
            <form onSubmit={handleAddDomain} className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="custom-domain-input"
                  className="h-8 text-xs pl-8 font-mono"
                  value={newDomain}
                  onChange={(e) => { setNewDomain(e.target.value); setDomainError(""); }}
                  placeholder="api.yourdomain.com"
                  disabled={addDomain.isPending}
                />
              </div>
              <Button
                id="add-domain-btn"
                type="submit"
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                disabled={addDomain.isPending || !newDomain.trim()}
              >
                {addDomain.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add domain
              </Button>
            </form>

            {domainError && (
              <p className="mb-3 text-xs text-destructive flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> {domainError}
              </p>
            )}

            {/* Domains list */}
            {domainsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : (domains?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground rounded-lg border border-dashed">
                <Link className="h-8 w-8 opacity-20" />
                <p className="text-sm">No custom domains added</p>
                <p className="text-xs opacity-60">Add your domain above to get started</p>
              </div>
            ) : (
              <div className="rounded-lg border divide-y divide-border/60">
                {domains!.map((domain) => (
                  <DomainRow
                    key={domain.id}
                    domain={domain}
                    projectId={projectId}
                    edgeDomain={edgeDomain}
                  />
                ))}
              </div>
            )}

            {/* How it works */}
            <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> How CNAME verification works
              </p>
              <p>1. Add a CNAME record pointing your domain → <code className="font-mono text-foreground">{edgeDomain || "your-edge-domain.edgewrap.com"}</code></p>
              <p>2. Click <strong className="text-foreground">Verify</strong> — we run a live DNS lookup to confirm the CNAME.</p>
              <p>3. Once verified, traffic to your domain is routed through this project's edge.</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
