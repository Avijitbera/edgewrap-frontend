"use client";

import { useState } from "react";
import {
  Network,
  Shuffle,
  HelpCircle,
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
  Activity,
  Award,
} from "lucide-react";
import { useSidebarProject } from "@/components/layout/sidebar";
import {
  useLoadBalancerPools,
  useCreateLoadBalancerPool,
  useUpdateLoadBalancerPool,
  useDeleteLoadBalancerPool,
  type LoadBalancerPool,
} from "@/lib/queries/extended-edge";
import { useOrigins } from "@/lib/queries/origins";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers & Badges ────────────────────────────────────────────────────────

const ALGO_LABELS: Record<LoadBalancerPool["algorithm"], string> = {
  round_robin: "Round Robin",
  weighted_round_robin: "Weighted Round Robin",
  least_connections: "Least Connections",
  ip_hash: "IP Hash Distribution",
};

const ALGO_COLORS: Record<LoadBalancerPool["algorithm"], string> = {
  round_robin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  weighted_round_robin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  least_connections: "bg-green-500/10 text-green-400 border-green-500/20",
  ip_hash: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

function AlgorithmBadge({ algo }: { algo: LoadBalancerPool["algorithm"] }) {
  const label = ALGO_LABELS[algo] ?? algo;
  const color = ALGO_COLORS[algo] ?? "bg-muted text-muted-foreground border-border";

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

// ─── Main Client Page ──────────────────────────────────────────────────────────

export default function LoadBalancerClient() {
  const { currentProject } = useSidebarProject();
  const projectId = currentProject?.id ?? null;

  // Add Pool Modal Visibility State
  const [showAddPoolModal, setShowAddPoolModal] = useState(false);

  // Form Field State
  const [poolName, setPoolName] = useState("");
  const [poolAlgorithm, setPoolAlgorithm] = useState<LoadBalancerPool["algorithm"]>("round_robin");
  const [sessionAffinity, setSessionAffinity] = useState(false);
  const [cookieName, setCookieName] = useState("ac_affinity");
  const [cookieTtl, setCookieTtl] = useState("3600");

  // Local Mapped Origins builder state
  const [selectedOriginId, setSelectedOriginId] = useState("");
  const [selectedOriginWeight, setSelectedOriginWeight] = useState("100");
  const [localMappedOrigins, setLocalMappedOrigins] = useState<Array<{ originId: string; label: string; weight: number }>>([]);
  const [formError, setFormError] = useState("");

  // Queries & Mutations
  const { data: origins } = useOrigins(projectId);
  const { data: pools, isLoading: poolsLoading } = useLoadBalancerPools(projectId);
  const createPool = useCreateLoadBalancerPool(projectId);
  const deletePool = useDeleteLoadBalancerPool(projectId);

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground p-6">
        <Network className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a project to view Load Balancer configs.</p>
      </div>
    );
  }

  const handleAddOriginToLocal = () => {
    setFormError("");
    if (!selectedOriginId) return;

    if (localMappedOrigins.some(x => x.originId === selectedOriginId)) {
      setFormError("This origin is already added to the pool.");
      return;
    }

    const matched = origins?.find(o => o.id === selectedOriginId);
    if (!matched) return;

    setLocalMappedOrigins(prev => [
      ...prev,
      {
        originId: selectedOriginId,
        label: matched.label || matched.url,
        weight: Number(selectedOriginWeight) || 100,
      }
    ]);
    setSelectedOriginId("");
    setSelectedOriginWeight("100");
  };

  const handleRemoveLocalOrigin = (originId: string) => {
    setLocalMappedOrigins(prev => prev.filter(x => x.originId !== originId));
  };

  const handleCreatePoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!poolName.trim()) return;

    if (localMappedOrigins.length === 0) {
      setFormError("You must map at least one origin host to this load balancer pool.");
      return;
    }

    try {
      await createPool.mutateAsync({
        name: poolName.trim(),
        algorithm: poolAlgorithm,
        sessionAffinityEnabled: sessionAffinity,
        stickyCookieName: sessionAffinity ? cookieName.trim() : undefined,
        stickyCookieTtlSec: sessionAffinity ? Number(cookieTtl) : undefined,
        origins: localMappedOrigins.map(o => ({ originId: o.originId, weight: o.weight })),
      });

      setPoolName("");
      setPoolAlgorithm("round_robin");
      setSessionAffinity(false);
      setCookieName("ac_affinity");
      setCookieTtl("3600");
      setLocalMappedOrigins([]);
      setShowAddPoolModal(false);
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to create load balancer pool.");
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Advanced Load Balancing</h1>
            <p className="text-xs text-muted-foreground">Distribute traffic dynamically, enforce sticky affinity, and group hosts into high-availability pools</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            LB Router Online
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── Top Section: LB Pools & Telemetry Guide ──── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Active LB Pools list */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Load Balancer Pools</CardTitle>
                </div>
                <Button
                  id="btn-new-pool"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setFormError("");
                    setShowAddPoolModal(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> New Pool
                </Button>
              </div>
              <CardDescription className="text-xs">
                Manage groupings of origin servers and configure load allocation strategies for incoming requests.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {poolsLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !pools || pools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Network className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">No Load Balancer pools configured</p>
                  <p className="text-xs opacity-60">Create a pool and add origins to balance traffic.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pools.map(pool => (
                    <div key={pool.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-foreground">{pool.name}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <AlgorithmBadge algo={pool.algorithm} />
                            {pool.sessionAffinityEnabled ? (
                              <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                                Sticky Session Active ({pool.stickyCookieName})
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                Stateless Balancing
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          id={`btn-del-pool-${pool.id}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive-hover"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this load balancer pool?")) {
                              deletePool.mutate(pool.id);
                            }
                          }}
                          disabled={deletePool.isPending}
                        >
                          {deletePool.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>

                      {/* Origin list in pool */}
                      <div className="rounded-lg border bg-muted/20 p-2.5 space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Origins Assigned</span>
                        <div className="space-y-1.5 pt-1 text-xs">
                          {pool.origins && pool.origins.length > 0 ? (
                            pool.origins.map(mapping => {
                              const origin = origins?.find(o => o.id === mapping.originId);
                              const label = origin ? origin.label || origin.url : mapping.originId;
                              return (
                                <div key={mapping.originId} className="flex justify-between items-center font-mono">
                                  <span className="text-foreground/85 truncate max-w-xs">{label}</span>
                                  <span className="text-primary font-semibold text-[11px]">Weight: {mapping.weight}</span>
                                </div>
                              );
                            })
                          ) : (
                            <span className="italic opacity-60">No origins configured for this pool</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LB Algorithms Guide (Right) */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Load Balancing Algorithms</h3>
              </div>
              <CardDescription className="text-xs">
                How client requests are directed to target origin servers in high-availability configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4 text-xs leading-relaxed text-muted-foreground">
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 font-bold font-mono mt-0.5">R</div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">Weighted Round Robin</p>
                    <p className="text-muted-foreground">Spins requests sequentially across active nodes according to assigned weights, prioritizing high-capacity endpoints.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded bg-green-500/10 flex items-center justify-center text-green-400 shrink-0 font-bold font-mono mt-0.5">L</div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">Least Connections</p>
                    <p className="text-muted-foreground">Queries are directed to nodes with the fewest active requests, dynamically protecting servers from spike overloads.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 font-bold font-mono mt-0.5">S</div>
                  <div>
                    <p className="font-semibold text-foreground mb-0.5">Sticky Cookies (Session Affinity)</p>
                    <p className="text-muted-foreground">Injects a unique tracking cookie at the edge client, locking consecutive browser queries to the exact same host for session consistency.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-3 bg-muted/20 space-y-1 text-xs">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" /> Balancer Diagnostics
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-1 border-t pt-1">
                  <span className="text-muted-foreground">Active Pools:</span>
                  <span className="text-foreground">{pools?.length ?? 0} active</span>
                  <span className="text-muted-foreground">Routing Precision:</span>
                  <span className="text-green-400">High availability auto-failover</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── MODAL: CREATE LOAD BALANCER POOL ────────────────────── */}
      {showAddPoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-xl border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">New Load Balancer Pool</h3>
              </div>
              <button onClick={() => setShowAddPoolModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePoolSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                {formError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="pool-name-input" className="text-xs text-muted-foreground">Pool Name *</Label>
                    <Input
                      id="pool-name-input"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      placeholder="e.g. Production API Balancer"
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pool-algo-select" className="text-xs text-muted-foreground">Routing Strategy *</Label>
                    <Select value={poolAlgorithm} onValueChange={(val: any) => setPoolAlgorithm(val)}>
                      <SelectTrigger id="pool-algo-select" className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin" className="text-xs">Stateless Round Robin</SelectItem>
                        <SelectItem value="weighted_round_robin" className="text-xs">Weighted Round Robin</SelectItem>
                        <SelectItem value="least_connections" className="text-xs">Least Active Connections</SelectItem>
                        <SelectItem value="ip_hash" className="text-xs">IP Hash Node Binding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-xl p-3.5 space-y-3 bg-muted/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs text-foreground font-semibold">Enable Session Affinity</Label>
                      <p className="text-[10px] text-muted-foreground">Injects cookies at the edge to pin user sessions to the same host.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={sessionAffinity}
                      onChange={(e) => setSessionAffinity(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>

                  {sessionAffinity && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t animate-in slide-in-from-top-1 duration-200">
                      <div className="space-y-1">
                        <Label htmlFor="cookie-name-input" className="text-xs text-muted-foreground">Cookie Name</Label>
                        <Input
                          id="cookie-name-input"
                          value={cookieName}
                          onChange={(e) => setCookieName(e.target.value)}
                          placeholder="ac_affinity"
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cookie-ttl-input" className="text-xs text-muted-foreground">Affinity TTL (seconds)</Label>
                        <Input
                          id="cookie-ttl-input"
                          type="number"
                          value={cookieTtl}
                          onChange={(e) => setCookieTtl(e.target.value)}
                          placeholder="3600"
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Local Origin Mapping Selector */}
                <div className="space-y-2.5">
                  <Label className="text-xs text-foreground font-semibold">Assign Origins &amp; Weights *</Label>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select value={selectedOriginId} onValueChange={setSelectedOriginId}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select Origin server..." />
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
                    <div className="w-24">
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={selectedOriginWeight}
                        onChange={(e) => setSelectedOriginWeight(e.target.value)}
                        placeholder="100"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={handleAddOriginToLocal}
                      disabled={!selectedOriginId}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>

                  {/* Local Origin Mappings table */}
                  <div className="rounded-lg border bg-muted/20 overflow-hidden text-xs">
                    <div className="bg-muted/30 border-b px-3 py-1.5 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider grid grid-cols-3">
                      <span>Server Label</span>
                      <span className="text-center">Weight</span>
                      <span className="text-right">Action</span>
                    </div>
                    <div className="divide-y divide-border max-h-[150px] overflow-y-auto">
                      {localMappedOrigins.map(item => (
                        <div key={item.originId} className="px-3 py-2 grid grid-cols-3 items-center font-mono">
                          <span className="truncate text-foreground/80 font-sans font-medium">{item.label}</span>
                          <span className="text-center text-primary font-semibold">{item.weight}</span>
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLocalOrigin(item.originId)}
                              className="text-destructive hover:text-red-400 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {localMappedOrigins.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground italic text-xs">
                          No servers added to the pool yet. Add at least one origin host.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t px-5 py-3 flex justify-end gap-2 bg-muted/10 shrink-0">
                <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowAddPoolModal(false)}>
                  Cancel
                </Button>
                <Button id="btn-save-pool" type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={createPool.isPending}>
                  {createPool.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Pool
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
