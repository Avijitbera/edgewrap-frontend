"use client";

import { useState, useMemo } from "react";
import {
  Key,
  Plus,
  Copy,
  CheckCheck,
  RotateCcw,
  Trash2,
  ShieldOff,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  Smartphone,
  Monitor,
  Server,
  Activity,
  Clock,
  Shield,
  X,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useRotateApiKey,
  type ApiKey,
  type ApiKeyCreated,
  type ApiKeyRotated,
  type CreateApiKeyBody,
} from "@/lib/queries/api-keys";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
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

// ─── Platform Badge ────────────────────────────────────────────────────────────

function PlatformBadge({
  allowed,
  icon,
  label,
}: {
  allowed: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        allowed
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border text-muted-foreground/50 line-through"
      )}
    >
      {icon}
      {label}
    </span>
  );
}

// ─── Reveal Box ───────────────────────────────────────────────────────────────

function RevealBox({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false);
  const { copied, copy } = useCopy();

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <code className="flex-1 break-all font-mono text-xs">
          {show ? value : "•".repeat(Math.min(value.length, 48))}
        </code>
        <button
          onClick={() => setShow((s) => !s)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => copy(value, label)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied === label ? (
            <CheckCheck className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Once-Show Dialog ─────────────────────────────────────────────────────────

function OnceCredentialsModal({
  data,
  onClose,
}: {
  data: ApiKeyCreated | ApiKeyRotated;
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Save Your Credentials</h2>
              <p className="text-xs text-muted-foreground">
                These values are shown <strong className="text-foreground">once</strong> — copy them now.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {"warning" in data && data.warning}
          </div>

          <RevealBox label="API Key" value={data.key} />
          {data.secret && <RevealBox label="API Secret" value={data.secret} />}

          <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground/70 mb-1">Usage Example</p>
            <code className="break-all font-mono text-xs">
              Authorization: Bearer {data.key}
            </code>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              id="credentials-confirmed"
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-muted-foreground">
              I have copied and stored these credentials securely.
            </span>
          </label>
        </div>

        <div className="border-t px-5 py-3">
          <Button
            id="close-credentials-modal"
            onClick={onClose}
            disabled={!confirmed}
            className="w-full"
            size="sm"
          >
            I&apos;ve Saved My Credentials — Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Key Form ──────────────────────────────────────────────────────────

interface CreateKeyFormProps {
  projectId: string;
  onClose: () => void;
  onCreated: (data: ApiKeyCreated) => void;
}

function CreateKeyForm({ projectId, onClose, onCreated }: CreateKeyFormProps) {
  const createKey = useCreateApiKey(projectId);

  const [form, setForm] = useState<CreateApiKeyBody>({
    name: "",
    description: "",
    environment: "live",
    allowMobile: false,
    allowWeb: true,
    allowDesktop: false,
    allowServer: false,
  });

  const setField = <K extends keyof CreateApiKeyBody>(
    k: K,
    v: CreateApiKeyBody[K]
  ) => setForm((prev) => ({ ...prev, [k]: v }));

  const atLeastOnePlatform =
    form.allowMobile || form.allowWeb || form.allowDesktop || form.allowServer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atLeastOnePlatform) return;
    const body: CreateApiKeyBody = {
      ...form,
      description: form.description || undefined,
    };
    const result = await createKey.mutateAsync(body);
    onCreated(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold">Create API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="key-name" className="text-xs">
              Key Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="key-name"
              placeholder="e.g. Mobile App Key"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              className="h-8 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="key-description" className="text-xs">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="key-description"
              placeholder="What's this key for?"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Environment */}
          <div className="space-y-1.5">
            <Label htmlFor="key-env" className="text-xs">
              Environment
            </Label>
            <Select
              value={form.environment}
              onValueChange={(v) =>
                setField("environment", v as "live" | "test")
              }
            >
              <SelectTrigger id="key-env" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live" className="text-xs">
                  🟢 Live
                </SelectItem>
                <SelectItem value="test" className="text-xs">
                  🔵 Test
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform Permissions */}
          <div className="space-y-2">
            <Label className="text-xs">
              Platform Access{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    key: "allowWeb",
                    icon: <Globe className="h-3.5 w-3.5" />,
                    label: "Web",
                    id: "allow-web",
                  },
                  {
                    key: "allowMobile",
                    icon: <Smartphone className="h-3.5 w-3.5" />,
                    label: "Mobile",
                    id: "allow-mobile",
                  },
                  {
                    key: "allowDesktop",
                    icon: <Monitor className="h-3.5 w-3.5" />,
                    label: "Desktop",
                    id: "allow-desktop",
                  },
                  {
                    key: "allowServer",
                    icon: <Server className="h-3.5 w-3.5" />,
                    label: "Server",
                    id: "allow-server",
                  },
                ] as const
              ).map(({ key, icon, label, id }) => (
                <label
                  key={key}
                  id={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors text-xs",
                    form[key]
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setField(key, e.target.checked)}
                    className="sr-only"
                  />
                  {icon}
                  {label}
                  {key === "allowServer" && (
                    <span className="ml-auto text-[10px] text-amber-400">
                      +secret
                    </span>
                  )}
                </label>
              ))}
            </div>
            {!atLeastOnePlatform && (
              <p className="text-xs text-destructive">
                Select at least one platform.
              </p>
            )}
            {form.allowServer && (
              <p className="text-xs text-amber-400/80">
                Server keys also generate an API secret for backend usage.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              id="create-key-submit"
              type="submit"
              size="sm"
              disabled={createKey.isPending || !form.name || !atLeastOnePlatform}
              className="flex-1"
            >
              {createKey.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {createKey.isPending ? "Creating…" : "Create Key"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>

          {createKey.isError && (
            <p className="text-xs text-destructive">
              {(createKey.error as Error).message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Key Row ──────────────────────────────────────────────────────────────────

interface KeyRowProps {
  apiKey: ApiKey;
  projectId: string;
  onRotated: (data: ApiKeyRotated) => void;
}

function KeyRow({ apiKey, projectId, onRotated }: KeyRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const revoke = useRevokeApiKey(projectId);
  const rotate = useRotateApiKey(projectId);
  const { copied, copy } = useCopy();

  const isActive = apiKey.status === "active";
  const envColor =
    apiKey.environment === "live"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : "border-blue-500/30 bg-blue-500/10 text-blue-400";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-all duration-200",
        !isActive && "opacity-60"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isActive ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Key className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{apiKey.name}</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                envColor
              )}
            >
              {apiKey.environment}
            </span>
            {!isActive && (
              <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                revoked
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono text-muted-foreground">
              {apiKey.keyPrefix}****
            </code>
            {apiKey.secretPrefix && (
              <code className="text-xs font-mono text-muted-foreground">
                secret: {apiKey.secretPrefix}****
              </code>
            )}
          </div>
        </div>

        {/* Platform badges */}
        <div className="hidden md:flex items-center gap-1 flex-wrap">
          <PlatformBadge allowed={apiKey.allowWeb} icon={<Globe className="h-2.5 w-2.5" />} label="Web" />
          <PlatformBadge allowed={apiKey.allowMobile} icon={<Smartphone className="h-2.5 w-2.5" />} label="Mobile" />
          <PlatformBadge allowed={apiKey.allowDesktop} icon={<Monitor className="h-2.5 w-2.5" />} label="Desktop" />
          <PlatformBadge allowed={apiKey.allowServer} icon={<Server className="h-2.5 w-2.5" />} label="Server" />
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {apiKey.totalRequestCount.toLocaleString()} req
          </span>
          {apiKey.lastUsedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelative(apiKey.lastUsedAt)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isActive && (
            <>
              {/* Rotate */}
              {!confirmRotate ? (
                <Button
                  id={`rotate-key-${apiKey.id}`}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setConfirmRotate(true)}
                  title="Rotate key"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-400">Rotate?</span>
                  <Button
                    id={`confirm-rotate-${apiKey.id}`}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300"
                    disabled={rotate.isPending}
                    onClick={async () => {
                      const data = await rotate.mutateAsync({ keyId: apiKey.id });
                      onRotated(data);
                      setConfirmRotate(false);
                    }}
                  >
                    {rotate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setConfirmRotate(false)}
                  >
                    No
                  </Button>
                </div>
              )}

              {/* Revoke */}
              {!confirmRevoke ? (
                <Button
                  id={`revoke-key-${apiKey.id}`}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmRevoke(true)}
                  title="Revoke key"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-destructive">Revoke?</span>
                  <Button
                    id={`confirm-revoke-${apiKey.id}`}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive hover:text-red-400"
                    disabled={revoke.isPending}
                    onClick={async () => {
                      await revoke.mutateAsync({ keyId: apiKey.id });
                      setConfirmRevoke(false);
                    }}
                  >
                    {revoke.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setConfirmRevoke(false)}
                  >
                    No
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Expand */}
          <Button
            id={`expand-key-${apiKey.id}`}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground"
            onClick={() => setExpanded((x) => !x)}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3">
          {apiKey.description && (
            <p className="text-xs text-muted-foreground">{apiKey.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Key Prefix
              </p>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono">{apiKey.keyPrefix}****</code>
                <button
                  onClick={() => copy(apiKey.keyPrefix, `kp-${apiKey.id}`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === `kp-${apiKey.id}` ? (
                    <CheckCheck className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Created
              </p>
              <p className="text-xs">{formatDate(apiKey.createdAt)}</p>
            </div>
            {apiKey.requestsPerMinute && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Rate / Min
                </p>
                <p className="text-xs font-mono">{apiKey.requestsPerMinute.toLocaleString()}</p>
              </div>
            )}
            {apiKey.requestsPerDay && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Rate / Day
                </p>
                <p className="text-xs font-mono">{apiKey.requestsPerDay.toLocaleString()}</p>
              </div>
            )}
            {apiKey.expiresAt && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Expires
                </p>
                <p className="text-xs">{formatDate(apiKey.expiresAt)}</p>
              </div>
            )}
            {apiKey.lastUsedIp && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Last IP
                </p>
                <p className="text-xs font-mono">{apiKey.lastUsedIp}</p>
              </div>
            )}
          </div>

          {/* Allowed Origins */}
          {apiKey.allowedOrigins && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Allowed Origins
              </p>
              <div className="flex flex-wrap gap-1">
                {(JSON.parse(apiKey.allowedOrigins) as string[]).map((o) => (
                  <code
                    key={o}
                    className="rounded border bg-muted/30 px-1.5 py-0.5 text-xs font-mono"
                  >
                    {o}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: keys, isLoading } = useApiKeys(projectId);
  const [showCreate, setShowCreate] = useState(false);
  const [credential, setCredential] = useState<
    ApiKeyCreated | ApiKeyRotated | null
  >(null);
  const [filter, setFilter] = useState<"all" | "active" | "revoked">("all");
  const [envFilter, setEnvFilter] = useState<"all" | "live" | "test">("all");

  const filtered = useMemo(() => {
    if (!keys) return [];
    return keys.filter((k) => {
      if (filter !== "all" && k.status !== filter) return false;
      if (envFilter !== "all" && k.environment !== envFilter) return false;
      return true;
    });
  }, [keys, filter, envFilter]);

  const activeCount = keys?.filter((k) => k.status === "active").length ?? 0;
  const revokedCount = keys?.filter((k) => k.status === "revoked").length ?? 0;
  const totalRequests = keys?.reduce((s, k) => s + k.totalRequestCount, 0) ?? 0;

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Key className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to manage API keys.</p>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {showCreate && (
        <CreateKeyForm
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onCreated={(data) => {
            setShowCreate(false);
            setCredential(data);
          }}
        />
      )}
      {credential && (
        <OnceCredentialsModal
          data={credential}
          onClose={() => setCredential(null)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* ── Page Header ───────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">API Keys</h1>
              <p className="text-xs text-muted-foreground">
                Manage access credentials for your project
              </p>
            </div>
          </div>
          <Button
            id="create-api-key-btn"
            size="sm"
            onClick={() => setShowCreate(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New Key
          </Button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {/* ── Stats ────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                label: "Active Keys",
                value: isLoading ? "—" : activeCount,
                icon: <Shield className="h-4 w-4 text-green-400" />,
                color: "text-green-400",
              },
              {
                label: "Revoked Keys",
                value: isLoading ? "—" : revokedCount,
                icon: <ShieldOff className="h-4 w-4 text-red-400" />,
                color: "text-red-400",
              },
              {
                label: "Total Requests",
                value: isLoading ? "—" : totalRequests.toLocaleString(),
                icon: <Activity className="h-4 w-4 text-blue-400" />,
                color: "text-blue-400",
              },
              {
                label: "Free Tier Limit",
                value: "5 keys",
                icon: <Key className="h-4 w-4 text-muted-foreground" />,
                color: "text-muted-foreground",
              },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} className="py-0">
                <CardContent className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("text-xl font-bold tabular-nums", color)}>
                      {value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Filters + List ────────────────────────── */}
          <Card className="py-0">
            <CardHeader className="border-b px-5 pb-3 pt-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-sm font-semibold">Keys</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Status filter */}
                  <Select
                    value={filter}
                    onValueChange={(v) =>
                      setFilter(v as "all" | "active" | "revoked")
                    }
                  >
                    <SelectTrigger
                      id="filter-status"
                      className="h-7 w-28 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        All
                      </SelectItem>
                      <SelectItem value="active" className="text-xs">
                        Active
                      </SelectItem>
                      <SelectItem value="revoked" className="text-xs">
                        Revoked
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Env filter */}
                  <Select
                    value={envFilter}
                    onValueChange={(v) =>
                      setEnvFilter(v as "all" | "live" | "test")
                    }
                  >
                    <SelectTrigger
                      id="filter-env"
                      className="h-7 w-24 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        All envs
                      </SelectItem>
                      <SelectItem value="live" className="text-xs">
                        Live
                      </SelectItem>
                      <SelectItem value="test" className="text-xs">
                        Test
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                  <Key className="h-10 w-10 opacity-20" />
                  <p className="text-sm">
                    {keys?.length === 0
                      ? "No API keys yet — create your first one."
                      : "No keys match the current filters."}
                  </p>
                  {keys?.length === 0 && (
                    <Button
                      id="create-first-key"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create First Key
                    </Button>
                  )}
                </div>
              ) : (
                filtered.map((k) => (
                  <KeyRow
                    key={k.id}
                    apiKey={k}
                    projectId={projectId}
                    onRotated={(data) => setCredential(data)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* ── Security Notes ───────────────────────── */}
          <Card className="py-0 border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 px-5 py-4">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-400">
                  Security Best Practices
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                  <li>
                    Never expose API keys in client-side code or public
                    repositories.
                  </li>
                  <li>
                    Rotate keys periodically and immediately if compromised.
                  </li>
                  <li>
                    Use the minimum required platform permissions for each key.
                  </li>
                  <li>
                    Set rate limits to prevent abuse.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
