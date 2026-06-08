"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Edit2,
  ExternalLink,
  Link,
  Server,
  FileText,
  AlertCircle,
  HelpCircle,
  Play,
  Save,
  PlusCircle,
  MinusCircle,
  ArrowUpDown,
  ListFilter,
  Check,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useEdgeRules,
  useCreateEdgeRule,
  useUpdateEdgeRule,
  useDeleteEdgeRule,
  type EdgeRule,
  type EdgeRuleCondition,
  type EdgeRulePayload,
} from "@/lib/queries/rules";
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

const FIELDS = [
  { value: "path", label: "Request Path" },
  { value: "method", label: "HTTP Method" },
  { value: "ip", label: "IP Address" },
  { value: "country", label: "Country Code" },
  { value: "user_agent", label: "User Agent" },
  { value: "query", label: "Query String" },
];

const OPERATORS: Record<string, { label: string; value: string }[]> = {
  path: [
    { value: "starts_with", label: "starts with" },
    { value: "ends_with", label: "ends with" },
    { value: "contains", label: "contains" },
    { value: "eq", label: "equals" },
    { value: "neq", label: "does not equal" },
    { value: "matches", label: "matches regex" },
  ],
  method: [
    { value: "eq", label: "equals" },
    { value: "neq", label: "does not equal" },
  ],
  ip: [
    { value: "eq", label: "equals" },
    { value: "neq", label: "does not equal" },
    { value: "in_cidr", label: "matches CIDR block" },
  ],
  country: [
    { value: "eq", label: "equals" },
    { value: "neq", label: "does not equal" },
    { value: "in", label: "in list (comma-separated)" },
    { value: "not_in", label: "not in list" },
  ],
  user_agent: [
    { value: "contains", label: "contains" },
    { value: "eq", label: "equals" },
    { value: "matches", label: "matches regex" },
  ],
  query: [
    { value: "contains", label: "contains" },
    { value: "eq", label: "equals" },
    { value: "matches", label: "matches regex" },
  ],
};

const ACTIONS = [
  { value: "allow", label: "Allow / Bypass Checks" },
  { value: "block", label: "Block Request" },
  { value: "challenge", label: "Managed Challenge" },
  { value: "rate_limit", label: "Rate Limit Client" },
  { value: "redirect", label: "URL Redirect" },
  { value: "rewrite", label: "URL Rewrite" },
  { value: "add_header", label: "Add Header" },
  { value: "cache_override", label: "Cache Override" },
  { value: "log", label: "Log Only" },
];

const ACTION_STYLES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  allow: { label: "Allow", color: "border-green-500/30 bg-green-500/10 text-green-400", icon: <CheckCircle2 className="h-3 w-3" /> },
  block: { label: "Block", color: "border-red-500/30 bg-red-500/10 text-red-400", icon: <XCircle className="h-3 w-3" /> },
  challenge: { label: "Challenge", color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400", icon: <Shield className="h-3 w-3" /> },
  rate_limit: { label: "Rate Limit", color: "border-purple-500/30 bg-purple-500/10 text-purple-400", icon: <Clock className="h-3 w-3" /> },
  redirect: { label: "Redirect", color: "border-blue-500/30 bg-blue-500/10 text-blue-400", icon: <ExternalLink className="h-3 w-3" /> },
  rewrite: { label: "Rewrite", color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400", icon: <Link className="h-3 w-3" /> },
  add_header: { label: "Add Header", color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400", icon: <Plus className="h-3 w-3" /> },
  cache_override: { label: "Cache Override", color: "border-teal-500/30 bg-teal-500/10 text-teal-400", icon: <Server className="h-3 w-3" /> },
  log: { label: "Log Only", color: "border-slate-500/30 bg-slate-500/10 text-slate-400", icon: <FileText className="h-3 w-3" /> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_STYLES[action] ?? {
    label: action,
    color: "border-border bg-card text-muted-foreground",
    icon: <HelpCircle className="h-3 w-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap", meta.color)}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function formatCondition(c: EdgeRuleCondition) {
  const fieldLabel = FIELDS.find((f) => f.value === c.field)?.label ?? c.field;
  const opLabel = (OPERATORS[c.field] || []).find((o) => o.value === c.op)?.label ?? c.op;
  let valStr = String(c.value);
  if (Array.isArray(c.value)) {
    valStr = `[${c.value.join(", ")}]`;
  }
  return (
    <span key={c.field + c.op + valStr} className="inline-flex items-center gap-1 bg-muted/40 border border-border/50 rounded-md px-1.5 py-0.5 text-[11px] font-mono whitespace-nowrap">
      <span className="text-muted-foreground">{fieldLabel}</span>
      <span className="text-primary font-semibold">{opLabel}</span>
      <span className="text-foreground">"{valStr}"</span>
    </span>
  );
}

function ActionConfigSummary({ action, config }: { action: EdgeRule["action"]; config: Record<string, any> }) {
  if (!config || Object.keys(config).length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground font-mono">
      <span className="text-muted-foreground/60">Config:</span>
      {action === "rate_limit" && (
        <span className="text-foreground">{config.requestsPerMinute} RPM {config.burstSize ? `(burst: ${config.burstSize})` : ""}</span>
      )}
      {action === "redirect" && (
        <span className="text-foreground">{config.statusCode} → {config.url}</span>
      )}
      {action === "rewrite" && (
        <span className="text-foreground">→ {config.url}</span>
      )}
      {action === "add_header" && (
        <span className="text-foreground">{config.name}: {config.value}</span>
      )}
      {action === "cache_override" && (
        <span className="text-foreground">TTL: {config.ttlSec}s {config.bypassCache ? "(Bypass Cache)" : ""}</span>
      )}
    </div>
  );
}

// ─── Rule Form Component ──────────────────────────────────────────────────────

function RuleForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: Partial<EdgeRulePayload>;
  onSubmit: (data: EdgeRulePayload) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState(String(initial?.priority ?? 100));
  const [action, setAction] = useState<EdgeRule["action"]>(initial?.action ?? "allow");
  const [isEnabled, setIsEnabled] = useState(initial?.isEnabled ?? true);

  // Conditions
  const [conditions, setConditions] = useState<EdgeRuleCondition[]>(() => {
    if (initial?.conditions) {
      return initial.conditions.map(c => {
        // If it was parsed as array for list operators, join with commas for the inputs
        if (Array.isArray(c.value)) {
          return { ...c, value: c.value.join(", ") };
        }
        return c;
      });
    }
    return [{ field: "path", op: "starts_with", value: "" }];
  });

  // Action Configurations
  const config = initial?.actionConfig ?? {};
  const [rateLimitRpm, setRateLimitRpm] = useState(String(config.requestsPerMinute ?? 60));
  const [rateLimitBurst, setRateLimitBurst] = useState(String(config.burstSize ?? 10));
  const [redirectUrl, setRedirectUrl] = useState(config.url ?? "");
  const [redirectCode, setRedirectCode] = useState(String(config.statusCode ?? 302));
  const [rewriteUrl, setRewriteUrl] = useState(config.url ?? "");
  const [headerName, setHeaderName] = useState(config.name ?? "");
  const [headerValue, setHeaderValue] = useState(config.value ?? "");
  const [cacheTtl, setCacheTtl] = useState(String(config.ttlSec ?? 300));
  const [cacheBypass, setCacheBypass] = useState(!!config.bypassCache);

  const handleAddFieldCondition = () => {
    setConditions((prev) => [...prev, { field: "path", op: "starts_with", value: "" }]);
  };

  const handleRemoveFieldCondition = (index: number) => {
    if (conditions.length === 1) return;
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, key: keyof EdgeRuleCondition, val: any) => {
    setConditions((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const updated = { ...c, [key]: val };
        if (key === "field") {
          // Reset operator to first allowed one for the newly selected field
          const ops = OPERATORS[val] || [];
          updated.op = ops[0]?.value ?? "eq";
          updated.value = "";
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Format conditions
    const finalConditions = conditions.map((c) => {
      // Split commas to array if op is list-based
      if ((c.op === "in" || c.op === "not_in") && typeof c.value === "string") {
        return {
          ...c,
          value: c.value.split(",").map((v) => v.trim()).filter(Boolean),
        };
      }
      // Numeric parser for numeric checks
      if ((c.op === "gt" || c.op === "lt") && typeof c.value === "string") {
        return {
          ...c,
          value: Number(c.value),
        };
      }
      return c;
    });

    // Resolve action configuration params
    let actionConfig: Record<string, any> | undefined = undefined;
    if (action === "rate_limit") {
      actionConfig = {
        requestsPerMinute: Number(rateLimitRpm) || 60,
        burstSize: Number(rateLimitBurst) || undefined,
      };
    } else if (action === "redirect") {
      actionConfig = {
        url: redirectUrl,
        statusCode: Number(redirectCode) || 302,
      };
    } else if (action === "rewrite") {
      actionConfig = {
        url: rewriteUrl,
      };
    } else if (action === "add_header") {
      actionConfig = {
        name: headerName,
        value: headerValue,
      };
    } else if (action === "cache_override") {
      actionConfig = {
        ttlSec: Number(cacheTtl) || 300,
        bypassCache: cacheBypass,
      };
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      priority: Number(priority) || 100,
      conditions: finalConditions,
      action,
      actionConfig,
      isEnabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="rule-name" className="text-xs text-muted-foreground mb-1 block">Rule Name *</Label>
          <Input
            id="rule-name"
            className="h-8 text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Block Malicious Scanner Paths"
            required
          />
        </div>
        <div>
          <Label htmlFor="rule-priority" className="text-xs text-muted-foreground mb-1 block">Priority *</Label>
          <Input
            id="rule-priority"
            className="h-8 text-xs font-mono"
            type="number"
            min={1}
            max={10000}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
          />
          <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">Lower priority runs first</span>
        </div>
      </div>

      <div>
        <Label htmlFor="rule-description" className="text-xs text-muted-foreground mb-1 block">Description</Label>
        <Input
          id="rule-description"
          className="h-8 text-xs"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the logic or intent of this rule"
        />
      </div>

      <Separator />

      {/* Conditions Builder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold text-foreground">Conditions (All must match - AND)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[11px] py-0 px-2 border-primary/20 hover:border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
            onClick={handleAddFieldCondition}
          >
            <PlusCircle className="h-3.5 w-3.5" /> Add Condition
          </Button>
        </div>

        <div className="space-y-2">
          {conditions.map((cond, index) => {
            const ops = OPERATORS[cond.field] || [];
            return (
              <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/10 p-2.5 relative group">
                {/* Field Select */}
                <div className="w-40 shrink-0">
                  <Select
                    value={cond.field}
                    onValueChange={(val) => handleConditionChange(index, "field", val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator Select */}
                <div className="w-44 shrink-0">
                  <Select
                    value={cond.op}
                    onValueChange={(val) => handleConditionChange(index, "op", val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {ops.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Input */}
                <div className="flex-1 min-w-[150px]">
                  {cond.field === "method" ? (
                    <Select
                      value={cond.value}
                      onValueChange={(val) => handleConditionChange(index, "value", val)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        {["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"].map((m) => (
                          <SelectItem key={m} value={m} className="text-xs font-mono">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="h-8 text-xs bg-background font-mono"
                      value={cond.value}
                      onChange={(e) => handleConditionChange(index, "value", e.target.value)}
                      placeholder={
                        cond.op === "in_cidr" ? "1.1.1.1/24" :
                        cond.op === "in" ? "US,CA,GB" :
                        "e.g. /admin/*"
                      }
                      required
                    />
                  )}
                </div>

                {/* Remove Condition */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-30"
                  onClick={() => handleRemoveFieldCondition(index)}
                  disabled={conditions.length === 1}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Action Builder */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rule-action" className="text-xs text-muted-foreground mb-1 block">Rule Action *</Label>
          <Select
            value={action}
            onValueChange={(val: any) => setAction(val)}
          >
            <SelectTrigger id="rule-action" className="h-8 text-xs">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Specific Configs */}
        <div className="rounded-lg border bg-muted/5 p-3 flex flex-col justify-center min-h-[70px]">
          {action === "allow" && (
            <p className="text-xs text-muted-foreground">Requests matching conditions bypass other custom checks immediately.</p>
          )}
          {action === "block" && (
            <p className="text-xs text-muted-foreground">Blocked requests fail with a HTTP 403 Forbidden page at edge.</p>
          )}
          {action === "challenge" && (
            <p className="text-xs text-muted-foreground">Displays a CF-style JS/Managed Challenge screen to verify humans.</p>
          )}
          {action === "log" && (
            <p className="text-xs text-muted-foreground">Incidents are logged into request analysis feeds without intervention.</p>
          )}

          {action === "rate_limit" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="rl-rpm" className="text-[10px] text-muted-foreground block mb-0.5">Limit (RPM)</Label>
                <Input id="rl-rpm" className="h-7 text-xs font-mono" type="number" min={1} value={rateLimitRpm} onChange={(e) => setRateLimitRpm(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="rl-burst" className="text-[10px] text-muted-foreground block mb-0.5">Burst Size (Optional)</Label>
                <Input id="rl-burst" className="h-7 text-xs font-mono" type="number" min={1} value={rateLimitBurst} onChange={(e) => setRateLimitBurst(e.target.value)} />
              </div>
            </div>
          )}

          {action === "redirect" && (
            <div className="space-y-2">
              <div>
                <Label htmlFor="redir-url" className="text-[10px] text-muted-foreground block mb-0.5">Redirect Destination URL</Label>
                <Input id="redir-url" className="h-7 text-xs font-mono" type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://newsite.com/target" required />
              </div>
              <div>
                <Label htmlFor="redir-code" className="text-[10px] text-muted-foreground block mb-0.5">Status Code</Label>
                <Select value={redirectCode} onValueChange={setRedirectCode}>
                  <SelectTrigger id="redir-code" className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["301", "302", "307", "308"].map((code) => (
                      <SelectItem key={code} value={code} className="text-xs">{code} — {code === "301" ? "Permanent" : "Temporary"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {action === "rewrite" && (
            <div>
              <Label htmlFor="rewrite-path" className="text-[10px] text-muted-foreground block mb-0.5">Internal Rewrite Target Path</Label>
              <Input id="rewrite-path" className="h-7 text-xs font-mono" value={rewriteUrl} onChange={(e) => setRewriteUrl(e.target.value)} placeholder="/api/v2/fallback" required />
            </div>
          )}

          {action === "add_header" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="hdr-name" className="text-[10px] text-muted-foreground block mb-0.5">Header Name</Label>
                <Input id="hdr-name" className="h-7 text-xs font-mono" value={headerName} onChange={(e) => setHeaderName(e.target.value)} placeholder="x-custom-rule" required />
              </div>
              <div>
                <Label htmlFor="hdr-val" className="text-[10px] text-muted-foreground block mb-0.5">Header Value</Label>
                <Input id="hdr-val" className="h-7 text-xs font-mono" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} placeholder="active" required />
              </div>
            </div>
          )}

          {action === "cache_override" && (
            <div className="space-y-2">
              <div>
                <Label htmlFor="cache-ttl" className="text-[10px] text-muted-foreground block mb-0.5">Custom TTL (seconds)</Label>
                <Input id="cache-ttl" className="h-7 text-xs font-mono" type="number" min={0} value={cacheTtl} onChange={(e) => setCacheTtl(e.target.value)} disabled={cacheBypass} required />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setCacheBypass(!cacheBypass)}
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    cacheBypass ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                      cacheBypass ? "translate-x-3" : "translate-x-0"
                    )}
                  />
                </button>
                <span className="text-[10px] text-muted-foreground">Bypass Cache entirely</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button id="rule-form-submit" type="submit" size="sm" className="gap-1.5 text-xs" disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {initial?.name ? "Save Rule Changes" : "Create Edge Rule"}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Rule Card Item Component ──────────────────────────────────────────────────

function RuleCard({
  rule,
  projectId,
}: {
  rule: EdgeRule;
  projectId: string;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateEdgeRule(projectId);
  const remove = useDeleteEdgeRule(projectId);

  // Parsers for conditions and configs
  const conditions = useMemo<EdgeRuleCondition[]>(() => {
    try {
      return typeof rule.conditions === "string" ? JSON.parse(rule.conditions) : rule.conditions;
    } catch {
      return [];
    }
  }, [rule.conditions]);

  const actionConfig = useMemo<Record<string, any>>(() => {
    try {
      return rule.actionConfig ? (typeof rule.actionConfig === "string" ? JSON.parse(rule.actionConfig) : rule.actionConfig) : {};
    } catch {
      return {};
    }
  }, [rule.actionConfig]);

  const handleToggleEnable = () => {
    update.mutate({ id: rule.id, isEnabled: !rule.isEnabled });
  };

  const handleUpdate = (data: EdgeRulePayload) => {
    update.mutate({ id: rule.id, ...data }, { onSuccess: () => setEditing(false) });
  };

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        rule.isEnabled ? "border-primary/20 bg-card/60" : "border-border bg-card/20 opacity-70"
      )}
    >
      {!editing ? (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/60 mt-0.5 shrink-0">
                <Shield className={cn("h-4 w-4", rule.isEnabled ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{rule.name}</span>
                  <span className="inline-flex items-center rounded-full border border-muted/50 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                    P-{rule.priority}
                  </span>
                  <span className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[9px] font-medium leading-none uppercase tracking-wider",
                    rule.source === "ai_suggested" ? "border-purple-500/20 bg-purple-500/10 text-purple-400" :
                    rule.source === "imported" ? "border-sky-500/20 bg-sky-500/10 text-sky-400" :
                    "border-border bg-muted/20 text-muted-foreground"
                  )}>
                    {rule.source}
                  </span>
                </div>
                {rule.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/20 px-2 py-0.5 rounded border border-border/50">
                Matches: <span className="font-semibold text-foreground">{rule.matchCount.toLocaleString()}</span>
              </div>

              {/* Status Switch */}
              <button
                onClick={handleToggleEnable}
                disabled={update.isPending}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
                  rule.isEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                    rule.isEnabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>

              <Button
                id={`rule-edit-${rule.id}`}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>

              <Button
                id={`rule-delete-${rule.id}`}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => remove.mutate(rule.id)}
                disabled={remove.isPending}
              >
                {remove.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Rule Match Details */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Criteria (AND):</span>
              {conditions.length > 0 ? (
                conditions.map((c) => formatCondition(c))
              ) : (
                <span className="text-xs text-muted-foreground italic">No conditions specified</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Action:</span>
              <ActionBadge action={rule.action} />
              <ActionConfigSummary action={rule.action} config={actionConfig} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted/5">
          <p className="mb-3 text-sm font-semibold">Edit Edge Rule</p>
          <RuleForm
            initial={{
              name: rule.name,
              description: rule.description ?? undefined,
              priority: rule.priority,
              conditions,
              action: rule.action,
              actionConfig,
              isEnabled: rule.isEnabled,
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

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function RulesPage() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  const { data: rules, isLoading: rulesLoading } = useEdgeRules(projectId);
  const createRule = useCreateEdgeRule(projectId);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateRule = (data: EdgeRulePayload) => {
    createRule.mutate(data, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Shield className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to manage edge rules.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Edge Rules</h1>
            <p className="text-xs text-muted-foreground">Custom request routing, header injection, caching rules &amp; access controls</p>
          </div>
        </div>

        {!showAddForm && (
          <Button
            id="add-rule-btn"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add Rule
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Rules Card Wrapper */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ListFilter className="h-4 w-4 text-primary" /> Edge Decision Pipeline
                </CardTitle>
                <CardDescription className="text-xs">
                  Edge rules are evaluated in sequential order based on priority. Matches execute actions immediately.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Create Form */}
            {showAddForm && (
              <>
                <div className="px-5 py-5 bg-muted/5">
                  <p className="mb-4 text-sm font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-primary" /> Create New Edge Rule
                  </p>
                  <RuleForm
                    onSubmit={handleCreateRule}
                    onCancel={() => setShowAddForm(false)}
                    isPending={createRule.isPending}
                  />
                </div>
                <Separator />
              </>
            )}

            {/* Rules Feed */}
            {rulesLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            ) : (rules?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <Shield className="h-12 w-12 opacity-15" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">No edge rules configured</p>
                  <p className="text-xs opacity-60">Create standard routing, headers, rate limits or override caches</p>
                </div>
                <Button
                  id="add-rule-empty"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs mt-2 border-primary/20 hover:border-primary/40 text-primary bg-primary/5"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add your first rule
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                {/* Sort rules by priority (just in case they aren't ordered from backend) */}
                {[...rules!]
                  .sort((a, b) => a.priority - b.priority)
                  .map((rule) => (
                    <RuleCard key={rule.id} rule={rule} projectId={projectId} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
