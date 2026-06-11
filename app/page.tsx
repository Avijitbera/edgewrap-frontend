"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getToken, apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Zap, Bot, Database, Activity, Eye,
  GitBranch, Globe, Lock, ChevronRight, ArrowRight,
  Sparkles, Check, Server, BarChart3, Shield,
  XCircle, AlertTriangle, CheckCircle2, TrendingUp,
  RefreshCw, Wifi, WifiOff, Cpu, Star,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: "ddos",
    icon: ShieldAlert,
    name: "DDoS Protection",
    tagline: "Adaptive rate limiting at the edge",
    desc: "Sliding-window RPS counters + unique-IP thresholds with stateful edge logic. Challenge, block or mitigate automatically.",
    accent: "#f97316",
    accentClass: "text-orange-400",
    glowClass: "shadow-orange-500/25",
    borderClass: "border-orange-500/40",
    badgeText: "Active",
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  {
    id: "bot",
    icon: Bot,
    name: "Bot Detection",
    tagline: "AI-powered fingerprint scoring",
    desc: "Behavioural analysis, user-agent anomaly detection, and ML-based bot probability scoring on every request.",
    accent: "#a855f7",
    accentClass: "text-violet-400",
    glowClass: "shadow-violet-500/25",
    borderClass: "border-violet-500/40",
    badgeText: "AI",
    badgeClass: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  {
    id: "waf",
    icon: Shield,
    name: "WAF",
    tagline: "OWASP + AI anomaly detection",
    desc: "Block SQLi, XSS and zero-day threats with OWASP rules combined with AI anomaly detection in real time.",
    accent: "#ef4444",
    accentClass: "text-red-400",
    glowClass: "shadow-red-500/25",
    borderClass: "border-red-500/40",
    badgeText: "OWASP",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  {
    id: "cache",
    icon: Database,
    name: "Edge Cache",
    tagline: "Distributed cache with AI TTL tuning",
    desc: "Cache API responses at global edge locations. AI optimises TTLs from live traffic patterns. Stale-while-revalidate built-in.",
    accent: "#3b82f6",
    accentClass: "text-blue-400",
    glowClass: "shadow-blue-500/25",
    borderClass: "border-blue-500/40",
    badgeText: "Fast",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  {
    id: "healer",
    icon: Activity,
    name: "Auto Healer",
    tagline: "Self-healing circuit breaker",
    desc: "FSM circuit breaker (closed → open → half-open) with AI diagnosis, automatic retry strategies and stale-cache fallback.",
    accent: "#22c55e",
    accentClass: "text-green-400",
    glowClass: "shadow-green-500/25",
    borderClass: "border-green-500/40",
    badgeText: "Self-healing",
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  {
    id: "shield",
    icon: Eye,
    name: "Secret Shield",
    tagline: "Regex + AI secret scanning",
    desc: "Detects and masks API keys, tokens and PII in requests and responses before they can leak to logs or clients.",
    accent: "#eab308",
    accentClass: "text-yellow-400",
    glowClass: "shadow-yellow-500/25",
    borderClass: "border-yellow-500/40",
    badgeText: "Privacy",
    badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  {
    id: "routing",
    icon: GitBranch,
    name: "Smart Routing",
    tagline: "Geo-AI, health-aware routing",
    desc: "EMA latency tracking, weighted random, health-aware and geo-intelligent origin selection with automatic failover.",
    accent: "#06b6d4",
    accentClass: "text-cyan-400",
    glowClass: "shadow-cyan-500/25",
    borderClass: "border-cyan-500/40",
    badgeText: "Geo-AI",
    badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "analytics",
    icon: BarChart3,
    name: "Analytics",
    tagline: "Real-time traffic intelligence",
    desc: "Request logs, AI-generated traffic summaries, p50/p95 latency, error rates and PAYG metering for every edge request.",
    accent: "#ec4899",
    accentClass: "text-pink-400",
    glowClass: "shadow-pink-500/25",
    borderClass: "border-pink-500/40",
    badgeText: "Real-time",
    badgeClass: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  },
];

const STATS = [
  { label: "Edge Services", value: "8+" },
  { label: "AI Modules", value: "9" },
  { label: "Avg Latency", value: "<10ms" },
  { label: "Uptime SLA", value: "99.9%" },
];

const FEATURES = [
  "Global edge network across 300+ locations",
  "Stateful edge logic with no cold starts",
  "AI-powered threat detection at every hop",
  "Zero-config SSL & TLS termination",
  "Stripe & Polar billing integration",
  "Webhook delivery with retry queues",
];

const PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "For personal projects and hobbyists.",
    highlight: false,
    badge: null,
    features: [
      "3 projects limit",
      "20K requests / month",
      "1 GB bandwidth limit",
      "50 requests / second limit",
      "3 API keys per project",
      "Basic WAF, cache, DDoS",
      "Community support",
    ],
    cta: "Get started free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Starter",
    monthlyPrice: 19,
    yearlyPrice: 15,
    desc: "For developers with production traffic.",
    highlight: false,
    badge: null,
    features: [
      "5 projects limit",
      "2M requests / month",
      "50 GB bandwidth limit",
      "500 requests / second limit",
      "10 API keys & 5 origins",
      "Pay-as-you-go enabled",
      "PAYG: $0.02 / 10k requests",
      "7 days log retention",
    ],
    cta: "Start Starter trial",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 39,
    desc: "For growing teams needing full AI security.",
    highlight: true,
    badge: "Most popular",
    features: [
      "15 projects limit",
      "10M requests / month",
      "200 GB bandwidth limit",
      "2,000 requests / second limit",
      "All 9 AI modules enabled",
      "50K AI calls/mo bundled",
      "PAYG: $0.016 / 10k requests",
      "30 days log retention",
    ],
    cta: "Start Pro trial",
    ctaVariant: "primary" as const,
  },
  {
    name: "Team",
    monthlyPrice: 129,
    yearlyPrice: 103,
    desc: "For scaling companies with high volume.",
    highlight: false,
    badge: "Best value",
    features: [
      "50 projects limit",
      "50M requests / month",
      "1 TB bandwidth limit",
      "10,000 requests / second limit",
      "All 9 AI modules enabled",
      "250K AI calls/mo bundled",
      "PAYG: $0.012 / 10k requests",
      "90 days log retention",
    ],
    cta: "Start Team trial",
    ctaVariant: "outline" as const,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    desc: "Custom volume, SLAs and dedicated support.",
    highlight: false,
    badge: null,
    features: [
      "999 projects limit",
      "Custom request volume",
      "Custom bandwidth limit",
      "Unlimited requests / second",
      "Dedicated CSM + Slack",
      "Custom negotiated AI rates",
      "SLA support response hours",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Service demo panels
// ─────────────────────────────────────────────────────────────────────────────

function DdosDemo() {
  const [tick, setTick] = useState(0);
  const bars = [2, 5, 3, 8, 4, 12, 7, 3, 9, 15, 6, 11, 4, 8, 3, 10, 14, 6, 9, 5];
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);
  const events = [
    { action: "blocked", ip: "182.xx.xx.31", rps: "2,340" },
    { action: "mitigated", ip: "45.xx.xx.12", rps: "890" },
    { action: "challenged", ip: "91.xx.xx.7", rps: "450" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[{ l: "Total", v: "1,247", c: "text-orange-400" }, { l: "Blocked", v: "891", c: "text-red-400" }, { l: "Mitigated", v: "356", c: "text-green-400" }].map((s) => (
          <div key={s.l} className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
            <p className="text-[10px] text-neutral-500 mb-1">{s.l}</p>
            <p className={`text-base font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
        <p className="text-[10px] text-neutral-500 mb-2">RPS trend</p>
        <div className="flex items-end gap-0.5 h-14">
          {bars.map((h, i) => {
            const active = (i === (tick % bars.length));
            return (
              <div key={i} className="flex-1 rounded-sm transition-all duration-700"
                style={{ height: `${(h / 15) * 100}%`, background: active ? "#f97316" : "oklch(0.65 0.22 30 / 40%)" }} />
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-white/8 overflow-hidden" style={{ background: "oklch(0.14 0 0)" }}>
        {events.map((ev, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0">
            <span className={`text-[10px] rounded-full border px-1.5 py-0.5 font-medium shrink-0 ${ev.action === "blocked" ? "bg-red-500/15 text-red-400 border-red-500/30"
              : ev.action === "mitigated" ? "bg-green-500/15 text-green-400 border-green-500/30"
                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
              }`}>{ev.action}</span>
            <span className="text-[10px] font-mono text-neutral-500 flex-1">{ev.ip}</span>
            <span className="text-[10px] font-mono text-orange-400">{ev.rps} rps</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BotDemo() {
  const [scanning, setScanning] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setScanning((s) => (s + 1) % 5), 900);
    return () => clearInterval(id);
  }, []);
  const requests = [
    { ua: "Chrome/124 (human)", score: 4, verdict: "allow" },
    { ua: "python-requests/2.31", score: 92, verdict: "block" },
    { ua: "Googlebot/2.1", score: 8, verdict: "allow" },
    { ua: "curl/8.1.0 custom", score: 67, verdict: "challenge" },
    { ua: "Mozilla/5.0 headless", score: 85, verdict: "block" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-neutral-500 font-mono mb-3">Incoming requests — bot probability scoring</p>
      {requests.map((r, i) => (
        <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-300 ${scanning === i ? "border-violet-500/50 bg-violet-500/5" : "border-white/5 bg-white/[0.02]"
          }`}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-neutral-300 truncate">{r.ua}</p>
          </div>
          {scanning === i && <div className="h-1 w-1 rounded-full bg-violet-400 animate-pulse shrink-0" />}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${r.score}%`,
                background: r.score > 70 ? "#ef4444" : r.score > 40 ? "#eab308" : "#22c55e"
              }} />
            </div>
            <span className="text-[10px] font-mono w-5 text-right" style={{
              color: r.score > 70 ? "#f87171" : r.score > 40 ? "#facc15" : "#4ade80"
            }}>{r.score}</span>
            <span className={`text-[10px] rounded-full border px-1.5 py-0.5 font-medium w-16 text-center ${r.verdict === "block" ? "bg-red-500/15 text-red-400 border-red-500/30"
              : r.verdict === "allow" ? "bg-green-500/15 text-green-400 border-green-500/30"
                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
              }`}>{r.verdict}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WafDemo() {
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => { setActive(i % 4); i++; }, 1000);
    return () => clearInterval(id);
  }, []);
  const threats = [
    { type: "SQL Injection", payload: "' OR 1=1 --", severity: "critical", blocked: true },
    { type: "XSS", payload: "<script>alert(1)</script>", severity: "high", blocked: true },
    { type: "Path Traversal", payload: "../../etc/passwd", severity: "high", blocked: true },
    { type: "Normal request", payload: "GET /api/users?id=42", severity: "none", blocked: false },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-neutral-500 font-mono mb-3">WAF rule engine — live analysis</p>
      {threats.map((t, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2.5 transition-all duration-500 ${active === i ? (t.blocked ? "border-red-500/40 bg-red-500/5" : "border-green-500/40 bg-green-500/5")
          : "border-white/5 bg-white/[0.02]"
          }`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-[10px] font-semibold ${t.severity === "critical" ? "text-red-400"
              : t.severity === "high" ? "text-orange-400"
                : "text-green-400"
              }`}>{t.type}</span>
            {t.blocked
              ? <span className="flex items-center gap-1 text-[10px] text-red-400"><XCircle className="h-3 w-3" /> BLOCKED</span>
              : <span className="flex items-center gap-1 text-[10px] text-green-400"><CheckCircle2 className="h-3 w-3" /> ALLOWED</span>
            }
          </div>
          <p className="text-[10px] font-mono text-neutral-500 truncate">{t.payload}</p>
          {active === i && (
            <div className="mt-1.5 h-0.5 rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full animate-pulse" style={{ width: "100%", background: t.blocked ? "#ef4444" : "#22c55e" }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CacheDemo() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 1500); return () => clearInterval(id); }, []);
  const routes = [
    { path: "/api/products", ttl: 300, hits: 12840, ratio: 94 },
    { path: "/api/users/me", ttl: 60, hits: 4210, ratio: 78 },
    { path: "/api/config", ttl: 3600, hits: 980, ratio: 99 },
    { path: "/api/search", ttl: 30, hits: 7640, ratio: 61 },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[{ l: "Hit rate", v: "87%", c: "text-blue-400" }, { l: "Cached keys", v: "24.1K", c: "text-blue-300" }, { l: "Bytes saved", v: "1.2 GB", c: "text-cyan-400" }].map(s => (
          <div key={s.l} className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
            <p className="text-[10px] text-neutral-500 mb-1">{s.l}</p>
            <p className={`text-base font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {routes.map((r, i) => (
          <div key={i} className={`rounded-lg border px-3 py-2.5 transition-all duration-500 ${tick % routes.length === i ? "border-blue-500/40 bg-blue-500/5" : "border-white/5 bg-white/[0.02]"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-neutral-300">{r.path}</span>
              <span className="text-[10px] text-neutral-500">TTL {r.ttl}s · {r.hits.toLocaleString()} hits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${r.ratio}%` }} />
              </div>
              <span className="text-[10px] text-blue-400 font-mono w-7 text-right">{r.ratio}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealerDemo() {
  const states = ["closed", "open", "half_open", "closed"] as const;
  const [stateIdx, setStateIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStateIdx((s) => (s + 1) % states.length), 2000);
    return () => clearInterval(id);
  }, []);
  const state = states[stateIdx];
  const color = state === "closed" ? "#22c55e" : state === "open" ? "#ef4444" : "#eab308";
  const logs = [
    { msg: "Origin responded 500 — failure count: 3", t: "0.1s" },
    { msg: "Threshold reached — circuit OPEN", t: "0.2s" },
    { msg: "AI diagnosis: memory exhaustion on origin", t: "0.4s" },
    { msg: "Serving stale cache response", t: "0.5s" },
    { msg: "Half-open probe sent to origin", t: "5.0s" },
    { msg: "Probe succeeded — circuit CLOSED", t: "5.1s" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-8 py-4">
        {(["closed", "open", "half_open"] as const).map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-700"
              style={{ borderColor: state === s ? color : "rgba(255,255,255,0.1)", background: state === s ? `${color}20` : "transparent" }}>
              {state === s && <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: color }} />}
              <Cpu className="h-5 w-5 transition-colors duration-500" style={{ color: state === s ? color : "rgba(255,255,255,0.2)" }} />
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">{s.replace("_", " ")}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/8 overflow-hidden" style={{ background: "oklch(0.14 0 0)" }}>
        <p className="text-[10px] text-neutral-500 px-3 py-2 border-b border-white/5">Recovery log</p>
        {logs.slice(0, stateIdx + 2 > logs.length ? logs.length : stateIdx + 2).map((l, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-1.5 border-b border-white/5 last:border-0">
            <span className="text-[10px] font-mono text-neutral-600 shrink-0">{l.t}</span>
            <span className="text-[10px] text-neutral-400">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecretDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => { const id = setInterval(() => setStep((s) => (s + 1) % 4), 1800); return () => clearInterval(id); }, []);
  const body = `{\n  "user": "avijit",\n  "token": "sk-prod-xK9mN2pQ7rL4vW",\n  "db_url": "postgres://user:p4$$w0rd@host/db"\n}`;
  const masked = `{\n  "user": "avijit",\n  "token": "[REDACTED:api_key]",\n  "db_url": "[REDACTED:db_creds]"\n}`;
  const secrets = [
    { pattern: "sk-prod-*", type: "API Key", line: 3 },
    { pattern: "postgres://*", type: "DB URL", line: 4 },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
          <p className="text-[10px] text-neutral-500 mb-2">Request body</p>
          <pre className="text-[10px] font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap">{step < 2 ? body : body}</pre>
        </div>
        <div className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
          <p className="text-[10px] text-neutral-500 mb-2">After masking</p>
          <pre className={`text-[10px] font-mono leading-relaxed whitespace-pre-wrap transition-all duration-500 ${step >= 2 ? "text-yellow-300" : "text-neutral-600"}`}>{masked}</pre>
        </div>
      </div>
      <div className="space-y-1.5">
        {secrets.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-500 ${step > i ? "border-yellow-500/40 bg-yellow-500/5" : "border-white/5 bg-white/[0.02]"
            }`}>
            <Eye className={`h-3.5 w-3.5 shrink-0 transition-colors duration-500 ${step > i ? "text-yellow-400" : "text-neutral-600"}`} />
            <span className="text-[10px] font-mono text-neutral-400 flex-1">{s.pattern}</span>
            <span className="text-[10px] text-neutral-500">{s.type}</span>
            {step > i && <span className="text-[10px] text-yellow-400 font-semibold">MASKED</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutingDemo() {
  const [active, setActive] = useState(0);
  const origins = [
    { name: "us-east-1", latency: 8, weight: 50, healthy: true },
    { name: "eu-west-1", latency: 24, weight: 30, healthy: true },
    { name: "ap-south-1", latency: 41, weight: 15, healthy: false },
    { name: "us-west-2", latency: 12, weight: 5, healthy: true },
  ];
  useEffect(() => { const id = setInterval(() => setActive((a) => (a + 1) % origins.length), 1600); return () => clearInterval(id); }, []);
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-neutral-500 font-mono">Origin health + EMA latency tracking</p>
      {origins.map((o, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2.5 transition-all duration-500 ${active === i ? "border-cyan-500/40 bg-cyan-500/5" : "border-white/5 bg-white/[0.02]"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full shrink-0 ${o.healthy ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-[10px] font-mono text-neutral-300 flex-1">{o.name}</span>
            {!o.healthy && <WifiOff className="h-3 w-3 text-red-400 shrink-0" />}
            {o.healthy && <Wifi className="h-3 w-3 text-neutral-600 shrink-0" />}
            <span className="text-[10px] font-mono text-cyan-400">{o.latency}ms</span>
            <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-500 transition-all duration-700" style={{ width: `${o.weight}%` }} />
            </div>
            <span className="text-[10px] text-neutral-500 w-6 text-right">{o.weight}%</span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-center gap-3 pt-1">
        <RefreshCw className="h-3.5 w-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
        <span className="text-[10px] text-neutral-500">Probing origins every 60s</span>
      </div>
    </div>
  );
}

function AnalyticsDemo() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 800); return () => clearInterval(id); }, []);
  const points = [12, 19, 14, 28, 22, 35, 18, 42, 31, 26, 38, 45, 29, 52, 33, 48, 41, 36, 55, 44];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[{ l: "Req/min", v: "1,240", c: "text-pink-400" }, { l: "P95", v: "38ms", c: "text-pink-300" }, { l: "Errors", v: "0.2%", c: "text-red-400" }, { l: "Cached", v: "87%", c: "text-green-400" }].map(s => (
          <div key={s.l} className="rounded-lg border border-white/8 p-2.5" style={{ background: "oklch(0.14 0 0)" }}>
            <p className="text-[9px] text-neutral-500 mb-1">{s.l}</p>
            <p className={`text-sm font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
        <p className="text-[10px] text-neutral-500 mb-2">Requests per minute</p>
        <svg viewBox="0 0 200 60" className="w-full h-16">
          <defs>
            <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={points.map((p, i) => `${(i / (points.length - 1)) * 200},${60 - (p / 55) * 55}`).join(" ")}
            fill="none" stroke="#ec4899" strokeWidth="1.5"
          />
          <polygon
            points={[
              ...points.map((p, i) => `${(i / (points.length - 1)) * 200},${60 - (p / 55) * 55}`),
              "200,60", "0,60"
            ].join(" ")}
            fill="url(#pinkGrad)"
          />
          <circle cx={(((tick % points.length)) / (points.length - 1)) * 200}
            cy={60 - (points[tick % points.length] / 55) * 55} r="3" fill="#ec4899" />
        </svg>
      </div>
      <div className="rounded-lg border border-white/8 p-3 flex items-start gap-2" style={{ background: "oklch(0.14 0 0)" }}>
        <Sparkles className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-neutral-400 leading-relaxed">
          <span className="text-pink-400 font-medium">AI Insight:</span> Traffic spike detected at peak hours. Cache hit rate improved by 12% after TTL tuning. Error rate stable at 0.2%.
        </p>
      </div>
    </div>
  );
}

const SERVICE_DEMOS: Record<string, React.ReactNode> = {
  ddos: <DdosDemo />,
  bot: <BotDemo />,
  waf: <WafDemo />,
  cache: <CacheDemo />,
  healer: <HealerDemo />,
  shield: <SecretDemo />,
  routing: <RoutingDemo />,
  analytics: <AnalyticsDemo />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Interactive "See It In Action" demos
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_TABS = [
  { id: "waf", label: "WAF Protection", icon: Shield, accent: "#ef4444", desc: "Watch the firewall block threats in real-time" },
  { id: "ddos", label: "DDoS Shield", icon: ShieldAlert, accent: "#f97316", desc: "See adaptive rate limiting repel volumetric attacks" },
  { id: "cache", label: "Edge Cache", icon: Database, accent: "#3b82f6", desc: "Observe intelligent caching at the edge" },
  { id: "geo", label: "Geo Routing", icon: Globe, accent: "#06b6d4", desc: "Explore smart routing across global edge nodes" },
];

const WAF_ATTACK_TYPES = [
  { id: "sqli", label: "SQLi", payload: "' OR 1=1 --" },
  { id: "xss", label: "XSS", payload: "<script>alert(1)</script>" },
  { id: "ssrf", label: "SSRF", payload: "http://169.254.169.254/" },
  { id: "clean", label: "Clean", payload: "GET /api/users?id=42" },
];

function WafAttackInteractive() {
  const [particles, setParticles] = useState<{ id: number; y: number; malicious: boolean; label: string }[]>([]);
  const [stats, setStats] = useState({ blocked: 0, allowed: 0 });
  const [selectedAttack, setSelectedAttack] = useState("sqli");
  const [shieldHit, setShieldHit] = useState(false);
  const [log, setLog] = useState<{ id: number; type: string; payload: string; blocked: boolean }[]>([]);
  const nextId = useRef(0);

  const spawnParticle = useCallback((type: string) => {
    const attack = WAF_ATTACK_TYPES.find((a) => a.id === type)!;
    const isMalicious = type !== "clean";
    const id = nextId.current++;
    const y = 10 + Math.random() * 80;

    setParticles((prev) => [...prev, { id, y, malicious: isMalicious, label: attack.label }]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
      if (isMalicious) {
        setStats((prev) => ({ ...prev, blocked: prev.blocked + 1 }));
        setShieldHit(true);
        setLog((prev) => [{ id, type: attack.label, payload: attack.payload, blocked: true }, ...prev].slice(0, 4));
        setTimeout(() => setShieldHit(false), 300);
      } else {
        setStats((prev) => ({ ...prev, allowed: prev.allowed + 1 }));
      }
    }, 2200);
  }, []);

  useEffect(() => {
    const types = ["sqli", "clean", "xss", "clean", "ssrf"];
    let idx = 0;
    const cycle = () => {
      const type = types[idx % types.length];
      setSelectedAttack(type);
      const count = type !== "clean" ? 3 : 2;
      for (let i = 0; i < count; i++) setTimeout(() => spawnParticle(type), i * 300);
      idx++;
    };
    cycle();
    const timer = setInterval(cycle, 4500);
    return () => clearInterval(timer);
  }, [spawnParticle]);

  const handleLaunch = () => {
    const count = selectedAttack !== "clean" ? 5 : 3;
    for (let i = 0; i < count; i++) setTimeout(() => spawnParticle(selectedAttack), i * 120);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { l: "Blocked", v: stats.blocked, c: "text-red-400" },
          { l: "Allowed", v: stats.allowed, c: "text-green-400" },
          {
            l: "Threat Level", v: stats.blocked > stats.allowed * 2 ? "HIGH" : stats.blocked > stats.allowed ? "MED" : "LOW",
            c: stats.blocked > stats.allowed * 2 ? "text-red-400" : stats.blocked > stats.allowed ? "text-orange-400" : "text-green-400"
          },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-white/8 p-3 text-center" style={{ background: "oklch(0.12 0 0)" }}>
            <p className="text-[10px] text-neutral-500 mb-1">{s.l}</p>
            <p className={`text-lg font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="relative rounded-xl border border-white/10 overflow-hidden" style={{ background: "oklch(0.06 0 0)", height: 260 }}>
        {/* Dot grid */}
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Shield wall */}
        <motion.div
          className="absolute top-0 bottom-0 z-10"
          style={{
            left: "62%", width: 3,
            background: shieldHit ? "rgba(239,68,68,0.9)" : "rgba(239,68,68,0.25)",
            boxShadow: shieldHit ? "0 0 20px 4px rgba(239,68,68,0.4)" : "0 0 8px 1px rgba(239,68,68,0.1)",
            transition: "all 0.2s",
          }}
        />
        {/* Shield dashes overlay */}
        <div className="absolute top-0 bottom-0 z-10" style={{
          left: "calc(62% - 1px)", width: 5,
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 6px, oklch(0.06 0 0) 6px, oklch(0.06 0 0) 12px)",
        }} />
        <div className="absolute z-10 text-[8px] font-mono tracking-wider" style={{ left: "62%", bottom: 10, transform: "translateX(-50%)", color: "rgba(239,68,68,0.45)" }}>WAF SHIELD</div>

        {/* Labels */}
        <div className="absolute z-10 text-[8px] font-mono tracking-wider" style={{ left: 16, top: 10, color: "rgba(255,255,255,0.2)" }}>INCOMING REQUESTS</div>
        <div className="absolute z-10 flex items-center gap-2 rounded-lg border border-white/8 px-3 py-2" style={{ right: 16, top: "50%", transform: "translateY(-50%)", background: "oklch(0.10 0 0)" }}>
          <Server className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-[9px] font-mono text-neutral-500">ORIGIN</span>
        </div>

        {/* Particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute z-20 flex items-center gap-1.5"
              style={{ top: `${p.y}%` }}
              initial={{ left: "-8%", opacity: 1, scale: 1 }}
              animate={
                p.malicious
                  ? { left: ["-8%", "60%", "60%"], opacity: [1, 1, 0], scale: [1, 1, 3] }
                  : { left: ["-8%", "60%", "105%"], opacity: [1, 1, 0] }
              }
              transition={{ duration: 2.2, times: [0, 0.65, 1], ease: "easeOut" }}
            >
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{
                  background: p.malicious ? "#ef4444" : "#22c55e",
                  boxShadow: `0 0 10px 2px ${p.malicious ? "rgba(239,68,68,0.5)" : "rgba(34,197,94,0.5)"}`,
                }}
              />
              <span className="text-[8px] font-mono whitespace-nowrap" style={{ color: p.malicious ? "#f87171" : "#4ade80" }}>
                {p.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Shield hit flash */}
        {shieldHit && (
          <motion.div
            className="absolute top-0 bottom-0 z-[9]"
            style={{ left: "58%", width: "12%" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 0.4 }}
          >
            <div className="h-full w-full" style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.4), transparent)" }} />
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {WAF_ATTACK_TYPES.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAttack(a.id)}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${selectedAttack === a.id
              ? a.id === "clean"
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-white/8 bg-white/[0.02] text-neutral-500 hover:text-neutral-300 hover:border-white/15"
              }`}
          >
            {a.label}
          </button>
        ))}
        <button
          onClick={handleLaunch}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/30 px-4 py-1.5 text-[11px] font-semibold text-red-400 transition-all hover:bg-red-500/25 active:scale-95"
        >
          <Zap className="h-3 w-3" /> Launch Attack
        </button>
      </div>

      {log.length > 0 && (
        <div className="mt-3 rounded-lg border border-white/8 overflow-hidden" style={{ background: "oklch(0.12 0 0)" }}>
          <p className="text-[10px] text-neutral-500 px-3 py-1.5 border-b border-white/5">Attack Log</p>
          {log.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 last:border-0">
              {entry.blocked ? <XCircle className="h-3 w-3 text-red-400 shrink-0" /> : <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />}
              <span className={`text-[10px] font-semibold ${entry.blocked ? "text-red-400" : "text-green-400"}`}>{entry.blocked ? "BLOCKED" : "PASSED"}</span>
              <span className="text-[10px] text-neutral-500">{entry.type}</span>
              <span className="text-[10px] font-mono text-neutral-600 truncate flex-1 text-right">{entry.payload}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DdosStormInteractive() {
  const [rps, setRps] = useState(2000);
  const [shieldOn, setShieldOn] = useState(true);
  const [particles, setParticles] = useState<{ id: number; startL: number; startT: number; endL: number; endT: number; blocked: boolean }[]>([]);
  const nextId = useRef(0);

  const threatLevel = rps > 20000 ? "CRITICAL" : rps > 10000 ? "HIGH" : rps > 5000 ? "MEDIUM" : "LOW";
  const blockedPct = shieldOn ? Math.min(98, Math.round(50 + (rps / 50000) * 48)) : 0;

  useEffect(() => {
    const rate = Math.max(1, Math.floor(rps / 2500));
    const interval = setInterval(() => {
      const batch: typeof particles = [];
      for (let i = 0; i < rate; i++) {
        const id = nextId.current++;
        const side = Math.floor(Math.random() * 4);
        let sL: number, sT: number;
        switch (side) {
          case 0: sL = Math.random() * 100; sT = -8; break;
          case 1: sL = 108; sT = Math.random() * 100; break;
          case 2: sL = Math.random() * 100; sT = 108; break;
          default: sL = -8; sT = Math.random() * 100; break;
        }
        const isB = shieldOn && Math.random() < blockedPct / 100;
        const dx = 50 - sL, dy = 50 - sT;
        const dist = Math.hypot(dx, dy) || 1;
        const R = 16;
        batch.push({ id, startL: sL, startT: sT, endL: isB ? 50 - (dx / dist) * R : 50, endT: isB ? 50 - (dy / dist) * R : 50, blocked: isB });
      }
      setParticles((prev) => [...prev, ...batch].slice(-45));
    }, 350);
    return () => clearInterval(interval);
  }, [rps, shieldOn, blockedPct]);

  useEffect(() => {
    const timer = setInterval(() => setParticles((prev) => prev.slice(-35)), 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { l: "RPS", v: rps.toLocaleString(), c: "text-orange-400" },
          { l: "Blocked", v: `${blockedPct}%`, c: "text-red-400" },
          { l: "Passed", v: `${100 - blockedPct}%`, c: "text-green-400" },
          { l: "Threat", v: threatLevel, c: rps > 10000 ? "text-red-400" : rps > 5000 ? "text-orange-400" : "text-green-400" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-white/8 p-3 text-center" style={{ background: "oklch(0.12 0 0)" }}>
            <p className="text-[10px] text-neutral-500 mb-1">{s.l}</p>
            <p className={`text-sm font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="relative rounded-xl border border-white/10 overflow-hidden" style={{ background: "oklch(0.06 0 0)", height: 280 }}>
        {/* Radial grid */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[12, 20, 28, 38].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
          ))}
        </svg>

        {/* Shield ring */}
        {shieldOn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="rounded-full border-2 border-dashed"
              style={{ width: "32%", height: "55%", borderColor: "rgba(249,115,22,0.35)" }}
              animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
        )}

        {/* Central server node */}
        <div className="absolute flex flex-col items-center justify-center" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
          <div className="flex items-center justify-center rounded-full border border-white/15" style={{ width: 44, height: 44, background: "oklch(0.10 0 0)" }}>
            <Server className="h-4 w-4 text-neutral-400" />
          </div>
          <span className="text-[8px] font-mono text-neutral-500 mt-1">API SERVER</span>
        </div>

        {/* Particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute z-20 rounded-full"
            style={{
              width: 6, height: 6,
              background: p.blocked ? "#ef4444" : "#22c55e",
              boxShadow: `0 0 8px 1px ${p.blocked ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
            }}
            initial={{ left: `${p.startL}%`, top: `${p.startT}%`, opacity: 0.8 }}
            animate={{
              left: `${p.endL}%`,
              top: `${p.endT}%`,
              opacity: p.blocked ? [0.8, 0.8, 0] : [0.8, 0.5, 0],
              scale: p.blocked ? [1, 1, 2.5] : [1, 0.8, 0],
            }}
            transition={{ duration: 1.5 + Math.random() * 0.5, ease: "easeIn" }}
          />
        ))}

        {/* Shield off overlay */}
        {!shieldOn && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5">
              <span className="text-[10px] font-semibold text-red-400">⚠ SHIELD DISABLED</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500 w-8 shrink-0">RPS</span>
          <input
            type="range" min="100" max="50000" step="100" value={rps}
            onChange={(e) => setRps(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-orange-500"
            style={{ background: `linear-gradient(to right, #f97316 ${(rps / 50000) * 100}%, rgba(255,255,255,0.08) ${(rps / 50000) * 100}%)` }}
          />
          <span className="text-[11px] font-mono text-orange-400 tabular-nums w-14 text-right">{rps.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500 w-8 shrink-0">🛡</span>
          <button onClick={() => setShieldOn(!shieldOn)}
            className={`relative rounded-full w-10 h-5 transition-all duration-300 ${shieldOn ? "bg-orange-500" : "bg-neutral-700"}`}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${shieldOn ? "left-[22px]" : "left-0.5"}`} />
          </button>
          <span className={`text-[11px] font-medium ${shieldOn ? "text-orange-400" : "text-neutral-600"}`}>
            {shieldOn ? "DDoS Protection Active" : "Protection Disabled"}
          </span>
        </div>
      </div>
    </div>
  );
}

function CacheFlowInteractive() {
  const [requests, setRequests] = useState<{ id: number; path: string; isHit: boolean }[]>([]);
  const [stats, setStats] = useState({ hits: 0, misses: 0 });
  const [cacheState, setCacheState] = useState<"warm" | "cold">("warm");
  const nextId = useRef(0);

  const CACHE_PATHS = ["/api/products", "/api/users/me", "/api/config", "/api/search"];

  const sendRequest = useCallback(() => {
    const id = nextId.current++;
    const path = CACHE_PATHS[Math.floor(Math.random() * CACHE_PATHS.length)];
    const isHit = cacheState === "warm" && Math.random() > 0.3;

    setRequests((prev) => [...prev, { id, path, isHit }]);

    const dur = isHit ? 2800 : 4200;
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setStats((prev) => (isHit ? { ...prev, hits: prev.hits + 1 } : { ...prev, misses: prev.misses + 1 }));
    }, dur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheState]);

  useEffect(() => {
    sendRequest();
    const timer = setInterval(sendRequest, 3500);
    return () => clearInterval(timer);
  }, [sendRequest]);

  const hitRate = stats.hits + stats.misses > 0 ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 0;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { l: "Hit Rate", v: `${hitRate}%`, c: "text-blue-400" },
          { l: "Cache Hits", v: stats.hits, c: "text-green-400" },
          { l: "Cache Misses", v: stats.misses, c: "text-orange-400" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-white/8 p-3 text-center" style={{ background: "oklch(0.12 0 0)" }}>
            <p className="text-[10px] text-neutral-500 mb-1">{s.l}</p>
            <p className={`text-lg font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="relative rounded-xl border border-white/10 overflow-hidden" style={{ background: "oklch(0.06 0 0)", height: 200 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        {/* Connection lines */}
        <div className="absolute h-px" style={{ left: "18%", right: "60%", top: "50%", background: "repeating-linear-gradient(to right, rgba(59,130,246,0.15) 0 8px, transparent 8px 16px)" }} />
        <div className="absolute h-px" style={{ left: "50%", right: "18%", top: "50%", background: "repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0 8px, transparent 8px 16px)" }} />

        {/* Nodes */}
        {[
          { label: "CLIENT", sub: "browser", x: "8%", icon: "🖥", color: "rgba(59,130,246,0.8)" },
          { label: "EDGE", sub: cacheState === "warm" ? "cache 🔥" : "cache ❄️", x: "38%", icon: "⚡", color: "rgba(59,130,246,1)" },
          { label: "ORIGIN", sub: "database", x: "74%", icon: "🗄", color: "rgba(255,255,255,0.4)" },
        ].map((node) => (
          <div key={node.label} className="absolute flex flex-col items-center" style={{ left: node.x, top: "50%", transform: "translate(-50%,-50%)" }}>
            <div className="flex items-center justify-center rounded-xl border border-white/10" style={{ width: 64, height: 52, background: "oklch(0.10 0 0)" }}>
              <span className="text-lg">{node.icon}</span>
            </div>
            <span className="text-[9px] font-mono mt-1.5 font-semibold" style={{ color: node.color }}>{node.label}</span>
            <span className="text-[8px] font-mono text-neutral-600">{node.sub}</span>
          </div>
        ))}

        {/* Animated request dots */}
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div key={req.id} className="absolute z-20 flex flex-col items-center" style={{ top: "calc(50% - 16px)" }}>
              <motion.div
                className="flex items-center gap-1"
                initial={{ left: "8%" }}
                animate={{
                  left: req.isHit
                    ? ["8%", "38%", "38%", "8%"]
                    : ["8%", "38%", "74%", "74%", "8%"],
                }}
                transition={{
                  duration: req.isHit ? 2.8 : 4.2,
                  times: req.isHit ? [0, 0.35, 0.5, 1] : [0, 0.2, 0.4, 0.55, 1],
                  ease: "easeInOut",
                }}
                style={{ position: "absolute" }}
              >
                <div className="h-3 w-3 rounded-full shrink-0" style={{
                  background: req.isHit ? "#22c55e" : "#3b82f6",
                  boxShadow: `0 0 10px 2px ${req.isHit ? "rgba(34,197,94,0.5)" : "rgba(59,130,246,0.5)"}`,
                }} />
                <span className="text-[7px] font-mono whitespace-nowrap" style={{ color: req.isHit ? "#4ade80" : "#93c5fd" }}>
                  {req.path}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hit / Miss labels at edge node */}
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={`label-${req.id}`}
              className="absolute z-30"
              style={{ left: "38%", top: "28%", transform: "translateX(-50%)" }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -5] }}
              transition={{ duration: req.isHit ? 2.8 : 4.2, times: req.isHit ? [0, 0.35, 0.55, 0.7] : [0, 0.2, 0.35, 0.5] }}
            >
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${req.isHit ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-orange-500/15 text-orange-400 border-orange-500/30"}`}>
                {req.isHit ? "✓ HIT" : "✗ MISS"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-4">
        <button onClick={sendRequest}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 px-4 py-1.5 text-[11px] font-semibold text-blue-400 transition-all hover:bg-blue-500/25 active:scale-95"
        >
          <Zap className="h-3 w-3" /> Send Request
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] text-neutral-500">Cache:</span>
          <button onClick={() => setCacheState(cacheState === "warm" ? "cold" : "warm")}
            className={`rounded-lg border px-3 py-1 text-[11px] font-medium transition-all ${cacheState === "warm" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-blue-500/30 bg-blue-500/10 text-blue-400"
              }`}
          >
            {cacheState === "warm" ? "🔥 Warm" : "❄️ Cold"}
          </button>
        </div>
      </div>
    </div>
  );
}

const GEO_POPS = [
  { id: "us-east", name: "US East", x: 200, y: 105, latency: 8, healthy: true },
  { id: "us-west", name: "US West", x: 115, y: 100, latency: 12, healthy: true },
  { id: "eu-west", name: "EU West", x: 365, y: 75, latency: 24, healthy: true },
  { id: "eu-central", name: "EU Central", x: 400, y: 85, latency: 28, healthy: false },
  { id: "ap-south", name: "AP South", x: 510, y: 145, latency: 45, healthy: true },
  { id: "ap-east", name: "AP East", x: 575, y: 110, latency: 38, healthy: true },
  { id: "sa-east", name: "SA East", x: 230, y: 205, latency: 52, healthy: true },
  { id: "af-south", name: "AF South", x: 400, y: 185, latency: 61, healthy: true },
];

const CONTINENT_DOTS: [number, number][] = [
  [125, 70], [140, 60], [155, 65], [170, 60], [185, 65], [200, 75], [175, 80], [155, 85], [135, 80], [150, 95], [165, 90], [180, 85], [195, 80], [210, 90], [170, 100], [155, 100], [140, 95],
  [195, 110], [190, 120], [200, 125],
  [210, 145], [220, 140], [230, 155], [225, 170], [220, 185], [210, 195], [200, 190], [205, 170], [215, 160],
  [345, 55], [355, 50], [365, 55], [375, 55], [385, 60], [370, 65], [360, 60], [375, 50], [390, 55], [395, 65], [385, 70], [350, 65],
  [365, 90], [375, 95], [385, 90], [380, 105], [390, 110], [385, 120], [375, 125], [380, 135], [385, 150], [375, 155], [370, 140], [375, 110],
  [420, 45], [435, 40], [450, 45], [465, 50], [480, 45], [495, 55], [510, 60], [525, 55], [540, 65], [530, 75], [520, 70], [505, 75], [490, 80], [475, 70], [460, 60], [445, 55], [510, 90], [520, 85], [535, 80],
  [405, 75], [415, 80], [420, 85],
  [540, 155], [555, 150], [550, 160], [560, 170], [545, 170],
];

function GeoRoutingInteractive() {
  const [selectedNode, setSelectedNode] = useState<string | null>("us-east");
  const [routeTarget, setRouteTarget] = useState<string | null>("us-west");
  const [showRoute, setShowRoute] = useState(true);

  const computeRoute = useCallback((nodeId: string) => {
    const source = GEO_POPS.find((n) => n.id === nodeId)!;
    const targets = GEO_POPS.filter((n) => n.id !== nodeId && n.healthy);
    return targets.reduce((best, n) => {
      const dist = Math.hypot(n.x - source.x, n.y - source.y);
      const bestDist = Math.hypot(best.x - source.x, best.y - source.y);
      return dist < bestDist ? n : best;
    });
  }, []);

  // Auto cycle
  useEffect(() => {
    const nodeIds = GEO_POPS.filter((n) => n.healthy).map((n) => n.id);
    let idx = 0;
    const cycle = () => {
      const id = nodeIds[idx % nodeIds.length];
      setSelectedNode(id);
      const nearest = computeRoute(id);
      setRouteTarget(nearest.id);
      setShowRoute(true);
      setTimeout(() => setShowRoute(false), 3000);
      idx++;
    };
    const timer = setInterval(cycle, 4500);
    return () => clearInterval(timer);
  }, [computeRoute]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    const nearest = computeRoute(nodeId);
    setRouteTarget(nearest.id);
    setShowRoute(true);
    setTimeout(() => setShowRoute(false), 3000);
  };

  const sourceNode = GEO_POPS.find((n) => n.id === selectedNode);
  const targetNode = GEO_POPS.find((n) => n.id === routeTarget);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { l: "Source", v: sourceNode?.name || "—", c: "text-cyan-400" },
          { l: "Routed To", v: targetNode?.name || "—", c: "text-green-400" },
          { l: "Latency", v: targetNode ? `${targetNode.latency}ms` : "—", c: "text-cyan-300" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-white/8 p-3 text-center" style={{ background: "oklch(0.12 0 0)" }}>
            <p className="text-[10px] text-neutral-500 mb-1">{s.l}</p>
            <p className={`text-base font-bold tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="relative rounded-xl border border-white/10 overflow-hidden" style={{ background: "oklch(0.06 0 0)" }}>
        <svg viewBox="0 0 700 270" className="w-full" style={{ height: 260 }} preserveAspectRatio="xMidYMid meet">
          {/* Continent dots */}
          {CONTINENT_DOTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(255,255,255,0.06)" />
          ))}

          {/* Subtle connection mesh */}
          {GEO_POPS.map((node, i) =>
            GEO_POPS.slice(i + 1).map((other) => (
              <line key={`${node.id}-${other.id}`} x1={node.x} y1={node.y} x2={other.x} y2={other.y} stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
            ))
          )}

          {/* Route arc */}
          {showRoute && sourceNode && targetNode && (() => {
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = Math.min(sourceNode.y, targetNode.y) - 35;
            const d = `M ${sourceNode.x} ${sourceNode.y} Q ${midX} ${midY} ${targetNode.x} ${targetNode.y}`;
            return (
              <>
                <motion.path d={d} fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="2" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <motion.circle r="4" fill="#06b6d4"
                  style={{ offsetPath: `path('${d}')`, offsetRotate: "0deg" }}
                  initial={{ offsetDistance: "0%", opacity: 1 }}
                  animate={{ offsetDistance: "100%", opacity: [1, 1, 0.5] }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <motion.circle r="4" fill="#06b6d4" filter="url(#glow)"
                  style={{ offsetPath: `path('${d}')`, offsetRotate: "0deg" }}
                  initial={{ offsetDistance: "0%", opacity: 0.4 }}
                  animate={{ offsetDistance: "100%", opacity: [0.4, 0.4, 0] }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </>
            );
          })()}

          {/* PoP nodes */}
          {GEO_POPS.map((node) => (
            <g key={node.id} onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
              {/* Pulse ring */}
              {node.healthy && (
                <motion.circle cx={node.x} cy={node.y} r="10" fill="none"
                  stroke={selectedNode === node.id ? "rgba(6,182,212,0.35)" : "rgba(34,197,94,0.15)"}
                  strokeWidth="1"
                  animate={{ r: [8, 14, 8], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              )}
              {/* Outer ring on selected */}
              {selectedNode === node.id && (
                <motion.circle cx={node.x} cy={node.y} r="16" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1"
                  animate={{ r: [14, 20, 14], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
              {/* Node dot */}
              <circle cx={node.x} cy={node.y} r="5"
                fill={!node.healthy ? "#ef4444" : selectedNode === node.id ? "#06b6d4" : "rgba(34,197,94,0.8)"}
                stroke={selectedNode === node.id ? "rgba(6,182,212,0.6)" : "rgba(255,255,255,0.08)"}
                strokeWidth={selectedNode === node.id ? 2 : 1}
              />
              {/* Label */}
              <text x={node.x} y={node.y + 18} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)" fontFamily="monospace">{node.name}</text>
              <text x={node.x} y={node.y + 28} textAnchor="middle" fontSize="7" fill={node.healthy ? "rgba(6,182,212,0.55)" : "rgba(239,68,68,0.6)"} fontFamily="monospace">
                {node.healthy ? `${node.latency}ms` : "DOWN"}
              </text>
            </g>
          ))}

          {/* Glow filter */}
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
        </svg>
      </div>

      <div className="flex items-center gap-4 mt-4 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400" /> Healthy</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Down</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Selected</span>
        <span className="ml-auto text-neutral-600 hidden sm:inline">Click any node to route</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="flex flex-col items-center gap-1"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.7s, transform 0.7s" }}>
      <span className="text-3xl font-bold tabular-nums text-white">{value}</span>
      <span className="text-xs text-neutral-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How It Works — Global Pipeline Section
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    id: "ddos",
    label: "DDoS Shield",
    icon: ShieldAlert,
    color: "#f97316",
    glow: "rgba(249,115,22,0.25)",
    detail: "Sliding-window RPS counters block volumetric floods before they reach your app.",
    action: "Rate-limits burst traffic",
    badge: "Edge",
  },
  {
    id: "bot",
    label: "Bot Detection",
    icon: Bot,
    color: "#a855f7",
    glow: "rgba(168,85,247,0.25)",
    detail: "ML fingerprint scoring classifies every agent — bots challenged or dropped instantly.",
    action: "Scores bot probability",
    badge: "AI",
  },
  {
    id: "waf",
    label: "WAF",
    icon: Shield,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.25)",
    detail: "OWASP rule set + AI anomaly detection blocks SQLi, XSS and zero-day payloads.",
    action: "Blocks attack patterns",
    badge: "OWASP",
  },
  {
    id: "shield",
    label: "Secret Shield",
    icon: Eye,
    color: "#eab308",
    glow: "rgba(234,179,8,0.25)",
    detail: "Regex + AI redacts API keys, tokens and PII before they leak to logs or clients.",
    action: "Redacts sensitive data",
    badge: "Privacy",
  },
  {
    id: "routing",
    label: "Smart Routing",
    icon: GitBranch,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.25)",
    detail: "EMA latency scoring + geo-intelligence picks the fastest healthy origin in real-time.",
    action: "Selects optimal origin",
    badge: "Geo-AI",
  },
  {
    id: "cache",
    label: "Edge Cache",
    icon: Database,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.25)",
    detail: "Distributed cache serves stale-while-revalidate responses at global edge locations.",
    action: "Serves cached response",
    badge: "Fast",
  },
  {
    id: "healer",
    label: "Auto Healer",
    icon: Activity,
    color: "#22c55e",
    glow: "rgba(34,197,94,0.25)",
    detail: "FSM circuit breaker detects failures, falls back to cache, and self-heals automatically.",
    action: "Monitors & self-heals",
    badge: "FSM",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "#ec4899",
    glow: "rgba(236,72,153,0.25)",
    detail: "Every hop is logged to the analytics queue — AI summarises traffic patterns per project.",
    action: "Logs & summarises traffic",
    badge: "Real-time",
  },
];

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Intersection observer — only animate when visible
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Auto-cycle through pipeline steps
  useEffect(() => {
    if (!isPlaying || !inView) return;
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 2000);
    return () => clearInterval(id);
  }, [isPlaying, inView]);

  const step = PIPELINE_STEPS[activeStep];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="border-t border-white/8"
      style={{ background: "oklch(0.10 0 0)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-24">

        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
            <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
            Request lifecycle
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">How every request flows through EdgeWrap</h2>
          <p className="mt-3 text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
            Each inbound API call passes through a layered defence and acceleration pipeline — all in under 10 ms.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px] lg:items-start">

          {/* ── Left: Pipeline flow ── */}
          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04))" }}
            />

            {/* Animated flowing beam overlay on the line */}
            <div
              className="absolute left-[22px] top-6 w-px overflow-hidden"
              style={{ height: "calc(100% - 48px)" }}
            >
              <motion.div
                className="w-full"
                style={{
                  height: "40%",
                  background: `linear-gradient(to bottom, transparent, ${step.color}80, transparent)`,
                }}
                animate={{ y: ["-100%", "250%"] }}
                transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {/* Incoming request badge */}
              <motion.div
                className="flex items-center gap-3 mb-1"
                initial={{ opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5 }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 z-10">
                  <Globe className="h-4.5 w-4.5 text-neutral-400" />
                </div>
                <div className="rounded-xl border border-white/8 px-4 py-2.5 flex-1" style={{ background: "oklch(0.13 0 0)" }}>
                  <p className="text-xs font-mono text-neutral-300">
                    <span className="text-orange-400 font-semibold">GET</span>{" "}
                    <span className="text-neutral-500">https://</span>your-project.edgewrap.com<span className="text-neutral-500">/api/v1/data</span>
                  </p>
                </div>
              </motion.div>

              {PIPELINE_STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = activeStep === i;
                const isPassed = i < activeStep;

                return (
                  <motion.div
                    key={s.id}
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => { setActiveStep(i); setIsPlaying(false); }}
                    initial={{ opacity: 0, x: -16 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  >
                    {/* Step node */}
                    <div
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 z-10 transition-all duration-500"
                      style={{
                        borderColor: isActive ? s.color : isPassed ? s.color + "55" : "rgba(255,255,255,0.1)",
                        background: isActive ? s.color + "22" : isPassed ? s.color + "10" : "oklch(0.10 0 0)",
                        boxShadow: isActive ? `0 0 18px ${s.glow}` : "none",
                      }}
                    >
                      {/* Ping ring on active */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ border: `2px solid ${s.color}` }}
                          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                      <Icon
                        className="h-4 w-4 transition-all duration-500"
                        style={{ color: isActive ? s.color : isPassed ? s.color + "bb" : "rgba(255,255,255,0.25)" }}
                      />
                    </div>

                    {/* Step card */}
                    <div
                      className="flex-1 rounded-xl border px-4 py-3 transition-all duration-500 group-hover:border-white/15"
                      style={{
                        borderColor: isActive ? s.color + "50" : isPassed ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.05)",
                        background: isActive ? s.color + "0d" : "rgba(255,255,255,0.02)",
                        boxShadow: isActive ? `0 0 24px ${s.glow}` : "none",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-semibold transition-colors duration-300"
                            style={{ color: isActive ? s.color : isPassed ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)" }}
                          >
                            {s.label}
                          </span>
                          <span
                            className="rounded-full border px-1.5 py-0.5 text-[9px] font-semibold"
                            style={{
                              borderColor: isActive ? s.color + "55" : "rgba(255,255,255,0.08)",
                              color: isActive ? s.color : "rgba(255,255,255,0.25)",
                              background: isActive ? s.color + "18" : "transparent",
                            }}
                          >
                            {s.badge}
                          </span>
                        </div>
                        {/* Status chip */}
                        {isPassed && !isActive && (
                          <span className="flex items-center gap-1 text-[9px] text-green-400 shrink-0">
                            <CheckCircle2 className="h-3 w-3" />
                            passed
                          </span>
                        )}
                        {isActive && (
                          <motion.span
                            className="flex items-center gap-1 text-[9px] shrink-0"
                            style={{ color: s.color }}
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: s.color }} />
                            processing
                          </motion.span>
                        )}
                      </div>
                      <p
                        className="text-[10px] transition-colors duration-300"
                        style={{ color: isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}
                      >
                        {s.action}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Response delivered */}
              <motion.div
                className="flex items-center gap-3 mt-1"
                initial={{ opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 z-10">
                  <CheckCircle2 className="h-4.5 w-4.5 text-green-400" />
                </div>
                <div className="rounded-xl border border-green-500/20 px-4 py-2.5 flex-1 bg-green-500/5">
                  <p className="text-xs font-mono">
                    <span className="text-green-400 font-semibold">200 OK</span>{" "}
                    <span className="text-neutral-500">· response delivered in</span>{" "}
                    <span className="text-cyan-400 font-semibold">&lt;10ms</span>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Right: Active step detail card ── */}
          <div className="sticky top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border overflow-hidden"
                style={{
                  borderColor: step.color + "40",
                  boxShadow: `0 0 40px ${step.glow}`,
                }}
              >
                {/* Card header */}
                <div
                  className="px-5 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: step.color + "25", background: step.color + "0d" }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ borderColor: step.color + "55", background: step.color + "22", color: step.color }}
                  >
                    {(() => { const Icon = step.icon; return <Icon className="h-5 w-5" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{step.label}</p>
                    <p className="text-[10px] font-mono" style={{ color: step.color + "cc" }}>{step.action}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <motion.div
                      className="h-2 w-2 rounded-full"
                      style={{ background: step.color }}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: step.color }}>Active</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4" style={{ background: "oklch(0.115 0 0)" }}>
                  <p className="text-sm text-neutral-300 leading-relaxed">{step.detail}</p>

                  {/* Mini metric bars */}
                  {step.id === "ddos" && (
                    <div className="space-y-2">
                      {[{ l: "Requests blocked", v: 87 }, { l: "Challenge rate", v: 9 }, { l: "Pass-through", v: 4 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.id === "bot" && (
                    <div className="space-y-2">
                      {[{ l: "Human traffic", v: 78 }, { l: "Good bots", v: 14 }, { l: "Bad bots blocked", v: 8 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.id === "waf" && (
                    <div className="space-y-2">
                      {[{ l: "SQLi blocked", v: 41 }, { l: "XSS blocked", v: 33 }, { l: "Anomalies flagged", v: 26 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.id === "shield" && (
                    <div className="space-y-2">
                      {[{ l: "API keys redacted", v: 60 }, { l: "PII masked", v: 28 }, { l: "DB creds removed", v: 12 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.id === "routing" && (
                    <div className="space-y-2">
                      {[{ l: "us-east-1 · 8ms", v: 65 }, { l: "eu-west-1 · 24ms", v: 25 }, { l: "ap-south-1 · 41ms", v: 10 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span className="font-mono">{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.id === "cache" && (
                    <div className="space-y-2">
                      {[{ l: "Cache hits", v: 87 }, { l: "Stale-while-revalidate", v: 8 }, { l: "Origin fetches", v: 5 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.id === "healer" && (
                    <div className="space-y-2">
                      {[{ l: "Circuit closed (healthy)", v: 92 }, { l: "Half-open (probing)", v: 5 }, { l: "Circuit open (fallback)", v: 3 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.id === "analytics" && (
                    <div className="space-y-2">
                      {[{ l: "Events logged", v: 100 }, { l: "AI summaries", v: 62 }, { l: "Anomalies flagged", v: 4 }].map(m => (
                        <div key={m.l}>
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>{m.l}</span><span style={{ color: step.color }}>{m.v}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: step.color }}
                              initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Latency chip */}
                  <div className="flex items-center justify-between rounded-lg border border-white/8 px-3 py-2" style={{ background: "oklch(0.13 0 0)" }}>
                    <span className="text-[10px] text-neutral-500">Avg overhead</span>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: step.color }}>
                      {["ddos", "bot", "waf", "shield"].includes(step.id) ? "0.8ms" : ["routing", "cache"].includes(step.id) ? "0.4ms" : "0.2ms"}
                    </span>
                  </div>
                </div>

                {/* Card footer – navigation */}
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "oklch(0.11 0 0)" }}>
                  <button
                    onClick={() => { setActiveStep((activeStep - 1 + PIPELINE_STEPS.length) % PIPELINE_STEPS.length); setIsPlaying(false); }}
                    className="text-[10px] text-neutral-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    ← Prev
                  </button>
                  <div className="flex gap-1">
                    {PIPELINE_STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setActiveStep(i); setIsPlaying(false); }}
                        className="h-1 rounded-full transition-all duration-300"
                        style={{ width: activeStep === i ? 20 : 6, background: activeStep === i ? step.color : "rgba(255,255,255,0.15)" }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (!isPlaying) {
                        setIsPlaying(true);
                      } else {
                        setActiveStep((activeStep + 1) % PIPELINE_STEPS.length);
                        setIsPlaying(false);
                      }
                    }}
                    className="text-[10px] text-neutral-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    {isPlaying ? "⏸ Pause" : "Next →"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Play/Pause badge */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[10px] text-neutral-500 hover:text-white hover:border-white/20 transition-all"
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: isPlaying ? "#22c55e" : "#f97316" }} />
                {isPlaying ? "Auto-playing pipeline" : "Paused — click step to explore"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Threat Protection Map & Animation Component
// ─────────────────────────────────────────────────────────────────────────────

interface ThreatMapNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface ThreatMapUser extends ThreatMapNode {
  popId: string;
}

interface ThreatMapAttacker extends ThreatMapNode {
  popId: string;
}

const PROTECTION_MAP_NODES = {
  origin: { id: "origin", name: "Origin Database", x: 360, y: 140 },
  pops: [
    { id: "pop-us-west", name: "San Francisco PoP", x: 150, y: 120 },
    { id: "pop-us-east", name: "New York PoP", x: 240, y: 115 },
    { id: "pop-eu-london", name: "London PoP", x: 390, y: 95 },
    { id: "pop-eu-frankfurt", name: "Frankfurt PoP", x: 420, y: 100 },
    { id: "pop-as-tokyo", name: "Tokyo PoP", x: 620, y: 110 },
    { id: "pop-as-singapore", name: "Singapore PoP", x: 580, y: 170 },
    { id: "pop-as-mumbai", name: "Mumbai PoP", x: 530, y: 150 },
    { id: "pop-au-sydney", name: "Sydney PoP", x: 680, y: 220 },
    { id: "pop-sa-saopaulo", name: "São Paulo PoP", x: 290, y: 210 },
  ] as ThreatMapNode[],
  users: [
    { id: "user-california", name: "User (California)", x: 100, y: 130, popId: "pop-us-west" },
    { id: "user-boston", name: "User (Boston)", x: 220, y: 100, popId: "pop-us-east" },
    { id: "user-paris", name: "User (Paris)", x: 370, y: 105, popId: "pop-eu-london" },
    { id: "user-munich", name: "User (Munich)", x: 430, y: 110, popId: "pop-eu-frankfurt" },
    { id: "user-kyoto", name: "User (Kyoto)", x: 640, y: 100, popId: "pop-as-tokyo" },
    { id: "user-bangalore", name: "User (Bangalore)", x: 520, y: 160, popId: "pop-as-mumbai" },
    { id: "user-melbourne", name: "User (Melbourne)", x: 660, y: 240, popId: "pop-au-sydney" },
    { id: "user-rio", name: "User (Rio)", x: 300, y: 230, popId: "pop-sa-saopaulo" },
  ] as ThreatMapUser[],
  attackers: [
    { id: "attacker-1", name: "Botnet Node (North America)", x: 130, y: 70, popId: "pop-us-west" },
    { id: "attacker-2", name: "Botnet Node (East Europe)", x: 480, y: 80, popId: "pop-eu-frankfurt" },
    { id: "attacker-3", name: "Botnet Node (East Asia)", x: 600, y: 70, popId: "pop-as-tokyo" },
    { id: "attacker-4", name: "Botnet Node (South America)", x: 250, y: 240, popId: "pop-sa-saopaulo" },
    { id: "attacker-5", name: "Botnet Node (Middle East)", x: 495, y: 130, popId: "pop-as-mumbai" },
  ] as ThreatMapAttacker[]
};

const MAP_WAF_PAYLOADS = [
  { label: "SQLi", payload: "GET /users?id=1' UNION SELECT username, password FROM admin" },
  { label: "XSS", payload: "POST /comments?body=<script>alert('xss')</script>" },
  { label: "SSRF", payload: "GET /fetch?url=http://169.254.169.254/metadata" },
  { label: "RCE", payload: "GET /exec?cmd=cat%20/etc/passwd" },
];

function GlobalThreatProtectionMap() {
  const [trafficMode, setTrafficMode] = useState<"normal" | "ddos" | "waf">("normal");
  const [particles, setParticles] = useState<any[]>([]);
  const [stats, setStats] = useState({ allowed: 28430, blocked: 104 });
  const [rps, setRps] = useState(120);
  const [originCpu, setOriginCpu] = useState(2.8);
  const [edgeCpu, setEdgeCpu] = useState(8.2);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: "success" | "info" | "warn" | "error" }>>([]);
  const [flashingPops, setFlashingPops] = useState<Record<string, "green" | "blue" | "red" | "purple" | null>>({});
  const [flashingOrigin, setFlashingOrigin] = useState(false);
  const nextParticleId = useRef(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((text: string, type: "success" | "info" | "warn" | "error") => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [
      ...prev,
      { id, time: timeStr, text, type }
    ].slice(-50));
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const triggerPopFlash = useCallback((popId: string, color: "green" | "blue" | "red" | "purple") => {
    setFlashingPops(prev => ({ ...prev, [popId]: color }));
    setTimeout(() => {
      setFlashingPops(prev => ({ ...prev, [popId]: null }));
    }, 400);
  }, []);

  const triggerOriginFlash = useCallback(() => {
    setFlashingOrigin(true);
    setTimeout(() => setFlashingOrigin(false), 250);
  }, []);

  // 1. Spawning Logic based on active Mode
  const spawnLegitRequest = useCallback(() => {
    const user = PROTECTION_MAP_NODES.users[Math.floor(Math.random() * PROTECTION_MAP_NODES.users.length)];
    const pop = PROTECTION_MAP_NODES.pops.find(p => p.id === user.popId)!;
    const isHit = Math.random() < 0.82; // 82% Edge Cache Hit Rate
    const id = `legit-${nextParticleId.current++}`;

    const newParticle = {
      id,
      startX: user.x,
      startY: user.y,
      popX: pop.x,
      popY: pop.y,
      originX: PROTECTION_MAP_NODES.origin.x,
      originY: PROTECTION_MAP_NODES.origin.y,
      type: "legit" as const,
      isHit,
    };

    setParticles(prev => [...prev, newParticle]);

    // Cleanup particle state
    const duration = isHit ? 1600 : 3000;
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, duration);

    // Dynamic Pop & Origin pulses + logs
    if (isHit) {
      setTimeout(() => {
        triggerPopFlash(pop.id, "green");
        setStats(s => ({ ...s, allowed: s.allowed + 1 }));
        addLog(`ALLOWED - GET /api/v1/products from ${user.name} (Cache Hit, 4ms)`, "success");
      }, 800);
    } else {
      setTimeout(() => {
        triggerPopFlash(pop.id, "blue");
      }, 800);
      setTimeout(() => {
        triggerOriginFlash();
        setStats(s => ({ ...s, allowed: s.allowed + 1 }));
        addLog(`ALLOWED - GET /api/v1/user/me from ${user.name} (Cache Miss -> Secure Origin Fetch, 26ms)`, "info");
      }, 1500);
    }
  }, [addLog, triggerPopFlash, triggerOriginFlash]);

  const spawnAttackerRequest = useCallback(() => {
    const attacker = PROTECTION_MAP_NODES.attackers[Math.floor(Math.random() * PROTECTION_MAP_NODES.attackers.length)];
    const pop = PROTECTION_MAP_NODES.pops.find(p => p.id === attacker.popId)!;
    const id = `ddos-${nextParticleId.current++}`;

    const newParticle = {
      id,
      startX: attacker.x,
      startY: attacker.y,
      popX: pop.x,
      popY: pop.y,
      type: "ddos" as const,
    };

    setParticles(prev => [...prev, newParticle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1200);

    setTimeout(() => {
      triggerPopFlash(pop.id, "red");
      setStats(s => ({ ...s, blocked: s.blocked + 1 }));
      if (Math.random() < 0.15) {
        const fakeIp = `185.112.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        addLog(`BLOCKED - Volumetric flood from IP ${fakeIp} -> ${pop.name} (Rate Limited, 429)`, "error");
      }
    }, 1000);
  }, [addLog, triggerPopFlash]);

  const spawnWafRequest = useCallback(() => {
    const attacker = PROTECTION_MAP_NODES.attackers[Math.floor(Math.random() * PROTECTION_MAP_NODES.attackers.length)];
    const pop = PROTECTION_MAP_NODES.pops.find(p => p.id === attacker.popId)!;
    const id = `waf-${nextParticleId.current++}`;
    const exploit = MAP_WAF_PAYLOADS[Math.floor(Math.random() * MAP_WAF_PAYLOADS.length)];

    const newParticle = {
      id,
      startX: attacker.x,
      startY: attacker.y,
      popX: pop.x,
      popY: pop.y,
      type: "waf" as const,
      label: exploit.label,
    };

    setParticles(prev => [...prev, newParticle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1200);

    setTimeout(() => {
      triggerPopFlash(pop.id, "purple");
      setStats(s => ({ ...s, blocked: s.blocked + 1 }));
      addLog(`BLOCKED - WAF ${exploit.label} Attack payload: "${exploit.payload}" -> ${pop.name} (403 Forbidden)`, "warn");
    }, 1000);
  }, [addLog, triggerPopFlash]);

  // 2. Loop handlers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const run = () => {
      if (trafficMode === "normal") {
        spawnLegitRequest();
        if (Math.random() < 0.05) spawnAttackerRequest();
      } else if (trafficMode === "ddos") {
        for (let i = 0; i < 4; i++) {
          setTimeout(spawnAttackerRequest, i * 70);
        }
        if (Math.random() < 0.25) spawnLegitRequest();
      } else if (trafficMode === "waf") {
        spawnWafRequest();
        if (Math.random() < 0.3) spawnLegitRequest();
      }

      const interval = trafficMode === "ddos" ? 180 : trafficMode === "waf" ? 400 : 350;
      timer = setTimeout(run, interval);
    };

    run();
    return () => clearTimeout(timer);
  }, [trafficMode, spawnLegitRequest, spawnAttackerRequest, spawnWafRequest]);

  // 3. Dynamic Telemetry simulator
  useEffect(() => {
    const interval = setInterval(() => {
      if (trafficMode === "normal") {
        setOriginCpu(prev => Math.max(1.5, Math.min(3.5, prev + (Math.random() - 0.5) * 0.4)));
        setEdgeCpu(prev => Math.max(4.5, Math.min(8.5, prev + (Math.random() - 0.5) * 0.8)));
        setRps(prev => Math.max(105, Math.min(130, prev + Math.floor((Math.random() - 0.5) * 12))));
      } else if (trafficMode === "ddos") {
        // Safe and clean! The origin stays under 4% CPU because the attacks are stopped entirely at the Edge.
        setOriginCpu(prev => Math.max(2.1, Math.min(4.2, prev + (Math.random() - 0.5) * 0.5)));
        setEdgeCpu(prev => Math.max(86.5, Math.min(94.8, prev + (Math.random() - 0.5) * 1.5))); // Edge absorbs everything
        setRps(prev => Math.max(43200, Math.min(48900, prev + Math.floor((Math.random() - 0.5) * 800))));
      } else if (trafficMode === "waf") {
        setOriginCpu(prev => Math.max(1.8, Math.min(3.8, prev + (Math.random() - 0.5) * 0.4)));
        setEdgeCpu(prev => Math.max(9.5, Math.min(16.2, prev + (Math.random() - 0.5) * 1.2)));
        setRps(prev => Math.max(115, Math.min(140, prev + Math.floor((Math.random() - 0.5) * 10))));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [trafficMode]);

  // Initialize with some log messages
  useEffect(() => {
    addLog("EdgeWrap Global Protection initialized.", "success");
    addLog("Mitigation Engine: Active at global edge pops.", "info");
    addLog("Origin Server: Shielded behind Secure Edge perimeter.", "success");
  }, [addLog]);

  return (
    <section id="global-protection" className="border-t border-white/8 relative overflow-hidden" style={{ background: "oklch(0.09 0 0)" }}>
      {/* Visual background glows */}
      <div className="absolute pointer-events-none -left-48 top-12 rounded-full blur-[120px] opacity-10"
        style={{ width: 450, height: 450, background: "radial-gradient(circle, oklch(0.65 0.22 30) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none -right-48 bottom-12 rounded-full blur-[120px] opacity-10"
        style={{ width: 450, height: 450, background: "radial-gradient(circle, oklch(0.57 0.22 264) 0%, transparent 70%)" }} />

      <div className="mx-auto max-w-6xl px-6 py-24">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
            <Lock className="h-3.5 w-3.5 text-orange-400" />
            Zero-Trust Edge Perimeter
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Real-Time Origin Protection</h2>
          <p className="mt-3 text-neutral-400 max-w-2xl mx-auto text-sm leading-relaxed">
            See how EdgeWrap mitigates floods and exploits entirely at the edge, absorbing volumetric load on the edge nodes so that **your origin database and server stay 100% untouched and secure**.
          </p>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] items-stretch">

          {/* LEFT: SVG Map Panel */}
          <div className="relative rounded-2xl border border-white/8 overflow-hidden flex flex-col justify-between h-[400px] lg:h-[460px]" style={{ background: "oklch(0.06 0 0)" }}>
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

            {/* SVG Visual Canvas */}
            <svg viewBox="0 0 800 300" className="w-full h-full relative z-10 select-none" preserveAspectRatio="xMidYMid meet">

              {/* 1. Definitions for glows */}
              <defs>
                <radialGradient id="originShieldGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="originShieldDdosGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="originShieldWafGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 2. Continent matrix background */}
              {CONTINENT_DOTS.map(([x, y], i) => (
                <circle key={i} cx={x + 70} cy={y + 30} r="1.5" fill="rgba(255,255,255,0.04)" />
              ))}

              {/* 3. Safe Perimeter & Origin Shield Bubble */}
              <motion.circle
                cx={PROTECTION_MAP_NODES.origin.x}
                cy={PROTECTION_MAP_NODES.origin.y}
                r={44}
                fill={
                  trafficMode === "ddos" ? "url(#originShieldDdosGlow)" :
                    trafficMode === "waf" ? "url(#originShieldWafGlow)" : "url(#originShieldGlow)"
                }
                opacity={trafficMode === "ddos" ? 0.75 : 0.45}
                animate={{ r: trafficMode === "ddos" ? [42, 46, 42] : [44, 44] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.circle
                cx={PROTECTION_MAP_NODES.origin.x}
                cy={PROTECTION_MAP_NODES.origin.y}
                r={46}
                fill="none"
                stroke={
                  trafficMode === "ddos" ? "rgba(239,68,68,0.35)" :
                    trafficMode === "waf" ? "rgba(168,85,247,0.3)" : "rgba(34,197,94,0.25)"
                }
                strokeWidth="1.5"
                strokeDasharray="4 2"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
              />
              <text
                x={PROTECTION_MAP_NODES.origin.x}
                y={PROTECTION_MAP_NODES.origin.y + 32}
                textAnchor="middle"
                fontSize="6"
                fill="rgba(255,255,255,0.3)"
                fontFamily="monospace"
                letterSpacing="1"
              >
                SECURE PERIMETER
              </text>

              {/* 4. Infrastructure Connection Mesh */}
              {PROTECTION_MAP_NODES.pops.map(pop => (
                <line
                  key={`mesh-${pop.id}`}
                  x1={pop.x}
                  y1={pop.y}
                  x2={PROTECTION_MAP_NODES.origin.x}
                  y2={PROTECTION_MAP_NODES.origin.y}
                  stroke={flashingOrigin ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.035)"}
                  strokeWidth="1.2"
                  className="transition-colors duration-200"
                />
              ))}

              {/* 5. User & Attacker Connection Nodes to Nearest POP */}
              {PROTECTION_MAP_NODES.users.map(user => {
                const pop = PROTECTION_MAP_NODES.pops.find(p => p.id === user.popId)!;
                return (
                  <line
                    key={`user-line-${user.id}`}
                    x1={user.x}
                    y1={user.y}
                    x2={pop.x}
                    y2={pop.y}
                    stroke="rgba(255,255,255,0.02)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}
              {PROTECTION_MAP_NODES.attackers.map(atk => {
                const pop = PROTECTION_MAP_NODES.pops.find(p => p.id === atk.popId)!;
                return (
                  <line
                    key={`atk-line-${atk.id}`}
                    x1={atk.x}
                    y1={atk.y}
                    x2={pop.x}
                    y2={pop.y}
                    stroke="rgba(239,68,68,0.01)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* 6. Glowing Origin Database Core */}
              <g transform={`translate(${PROTECTION_MAP_NODES.origin.x - 15}, ${PROTECTION_MAP_NODES.origin.y - 15})`}>
                <rect width="30" height="30" rx="6" fill="oklch(0.12 0 0)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <rect x="5" y="6" width="20" height="4" rx="1" fill="rgba(255,255,255,0.06)" />
                <rect x="5" y="13" width="20" height="4" rx="1" fill="rgba(255,255,255,0.06)" />
                <rect x="5" y="20" width="20" height="4" rx="1" fill="rgba(255,255,255,0.06)" />
                <circle cx="21" cy="8" r="1.2" fill="#22c55e" />
                <circle cx="21" cy="15" r="1.2" fill="#22c55e" />
                <circle cx="21" cy="22" r="1.2" fill={flashingOrigin ? "#3b82f6" : "#22c55e"} className="transition-colors duration-200" />
              </g>

              {/* 7. Edge POP Node Rings & Anchors */}
              {PROTECTION_MAP_NODES.pops.map(pop => {
                const flashColor = flashingPops[pop.id];
                return (
                  <g key={pop.id}>
                    {/* PoP Flash pulse */}
                    {flashColor && (
                      <motion.circle
                        cx={pop.x}
                        cy={pop.y}
                        r={12}
                        fill="none"
                        stroke={
                          flashColor === "red" ? "#ef4444" :
                            flashColor === "purple" ? "#a855f7" :
                              flashColor === "blue" ? "#3b82f6" : "#22c55e"
                        }
                        strokeWidth="1.5"
                        initial={{ r: 4, opacity: 0.9 }}
                        animate={{ r: 24, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    )}

                    {/* Base POP indicator */}
                    <circle
                      cx={pop.x}
                      cy={pop.y}
                      r="4.5"
                      fill="oklch(0.06 0 0)"
                      stroke={flashColor ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}
                      strokeWidth="1"
                    />
                    <circle
                      cx={pop.x}
                      cy={pop.y}
                      r="2"
                      fill="#22c55e"
                    />
                  </g>
                );
              })}

              {/* 8. Legitimate Users Nodes */}
              {PROTECTION_MAP_NODES.users.map(user => (
                <g key={user.id}>
                  <circle cx={user.x} cy={user.y} r="3" fill="#22c55e" opacity="0.65" />
                  <circle cx={user.x} cy={user.y} r="7" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="0.5" />
                </g>
              ))}

              {/* 9. Attacker / Botnet Nodes */}
              {PROTECTION_MAP_NODES.attackers.map(atk => (
                <g key={atk.id}>
                  <motion.circle
                    cx={atk.x}
                    cy={atk.y}
                    r={3.5}
                    fill={trafficMode !== "normal" ? "#ef4444" : "rgba(239,68,68,0.25)"}
                    animate={trafficMode !== "normal" ? { opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <circle cx={atk.x} cy={atk.y} r="8" fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="0.5" />
                </g>
              ))}

              {/* 10. Flowing traffic particles */}
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.g
                    key={p.id}
                    initial={{ x: p.startX, y: p.startY }}
                    animate={
                      p.type === "legit"
                        ? p.isHit
                          ? {
                            x: [p.startX, p.popX, p.startX],
                            y: [p.startY, p.popY, p.startY],
                          }
                          : {
                            x: [p.startX, p.popX, p.originX, p.popX, p.startX],
                            y: [p.startY, p.popY, p.originY, p.popY, p.startY],
                          }
                        : {
                          x: [p.startX, p.popX],
                          y: [p.startY, p.popY],
                          opacity: [0.8, 1, 0],
                          scale: [1, 1.1, 2.2]
                        }
                    }
                    transition={{
                      duration: p.type === "legit" ? (p.isHit ? 1.6 : 3.0) : 1.1,
                      times: p.type === "legit" ? (p.isHit ? [0, 0.5, 1] : [0, 0.27, 0.5, 0.73, 1]) : [0, 0.85, 1],
                      ease: "easeInOut",
                    }}
                  >
                    {/* Core particle dot */}
                    <circle
                      r={p.type === "legit" ? 3 : p.type === "waf" ? 4.5 : 2.5}
                      fill={p.type === "legit" ? (p.isHit ? "#22c55e" : "#3b82f6") : p.type === "waf" ? "#a855f7" : "#ef4444"}
                      style={{
                        filter: p.type === "ddos" ? "drop-shadow(0 0 3px #ef4444)" : p.type === "waf" ? "drop-shadow(0 0 5px #a855f7)" : "none"
                      }}
                    />
                    {/* WAF attack label bubble */}
                    {p.type === "waf" && p.label && (
                      <g transform="translate(0, -9)">
                        <rect x="-12" y="-6" width="24" height="10" rx="2" fill="rgba(168,85,247,0.9)" />
                        <text
                          textAnchor="middle"
                          y="1.5"
                          fill="white"
                          fontSize="5.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {p.label}
                        </text>
                      </g>
                    )}
                  </motion.g>
                ))}
              </AnimatePresence>
            </svg>

            {/* Bottom geographical captions */}
            <div className="flex justify-between items-center px-4 py-2 border-t border-white/5 relative z-20 text-[9px] text-neutral-500 font-mono" style={{ background: "oklch(0.07 0 0)" }}>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Users</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> Edge POPs</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Attackers</span>
              </div>
              <div>Origin server protected zone: Atlantic Core</div>
            </div>
          </div>

          {/* RIGHT: Dash Controls, Statistics & Console Logs */}
          <div className="flex flex-col gap-4 lg:h-[460px]">

            {/* 1. Simulation controls */}
            <div className="rounded-xl border border-white/8 p-4 flex flex-col gap-2.5" style={{ background: "oklch(0.065 0 0)" }}>
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Select Protection Demo</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "normal", label: "Normal Traffic", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                  { id: "ddos", label: "DDoS Storm", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                  { id: "waf", label: "WAF Exploit", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                ].map(mode => {
                  const isActive = trafficMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setTrafficMode(mode.id as any)}
                      className={`rounded-lg border py-2 text-center text-xs font-semibold transition-all duration-200 ${isActive
                        ? `${mode.bg} ${mode.color}`
                        : "border-white/5 bg-white/[0.02] text-neutral-500 hover:text-neutral-300 hover:border-white/10"
                        }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Telemetry panel */}
            <div className="grid grid-cols-2 gap-3">

              {/* Box A: Edge Filters */}
              <div className="rounded-xl border border-white/8 p-3 flex flex-col justify-between" style={{ background: "oklch(0.065 0 0)" }}>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-neutral-500 uppercase font-mono">Edge Layer</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                  </div>
                  <p className="text-[9px] text-neutral-400 mb-2 truncate">Rate limiting & mitigation active</p>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-neutral-500 font-mono">RPS</span>
                    <span className="text-sm font-bold font-mono text-orange-400 tabular-nums">
                      {rps.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-neutral-500 font-mono">CPU Load</span>
                    <span className={`text-xs font-bold font-mono ${edgeCpu > 80 ? "text-red-400" : "text-neutral-300"}`}>
                      {edgeCpu.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden mt-1.5">
                    <div className="h-full rounded-full transition-all duration-700 bg-orange-400" style={{ width: `${edgeCpu}%` }} />
                  </div>
                </div>
              </div>

              {/* Box B: Safe Origin Server */}
              <div className="rounded-xl border border-white/8 p-3 flex flex-col justify-between" style={{ background: "oklch(0.065 0 0)" }}>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-neutral-500 uppercase font-mono">Origin Backend</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <span className="inline-flex rounded-full border border-green-500/25 bg-green-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-green-400 leading-none">
                    100% Secure
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-neutral-500 font-mono">CPU Load</span>
                    {/* CPU is extremely low and stable, showcasing protection */}
                    <span className="text-sm font-bold font-mono text-green-400 tabular-nums">
                      {originCpu.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-neutral-500 font-mono">Origin Temp</span>
                    <span className="text-xs font-semibold text-neutral-400 font-mono">Cool</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden mt-1.5">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${originCpu * 5}%` }} />
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Live Logs Firehose */}
            <div className="rounded-xl border border-white/8 flex flex-col flex-1 overflow-hidden" style={{ background: "oklch(0.065 0 0)" }}>
              <div className="flex justify-between items-center border-b border-white/5 px-3 py-1.5" style={{ background: "oklch(0.075 0 0)" }}>
                <span className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider">Edge Protection Logs</span>
                <span className="flex items-center gap-1 text-[8px] text-cyan-400 font-mono">
                  <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping" />
                  streaming
                </span>
              </div>

              {/* Scrolling Log Container */}
              <div ref={logContainerRef} className="p-3 font-mono text-[9px] leading-relaxed overflow-y-auto flex-1 space-y-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                <AnimatePresence>
                  {logs.map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2 items-start"
                    >
                      <span className="text-neutral-600 shrink-0">{log.time}</span>
                      <span className={`shrink-0 font-semibold ${log.type === "success" ? "text-green-500" :
                        log.type === "info" ? "text-blue-400" :
                          log.type === "warn" ? "text-purple-400" : "text-red-400"
                        }`}>
                        {log.type === "success" ? "[OK]" :
                          log.type === "info" ? "[MISS]" :
                            log.type === "warn" ? "[ATTACK]" : "[DENIED]"}
                      </span>
                      <span className="text-neutral-400">{log.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Bottom Accumulators */}
              <div className="border-t border-white/5 px-3 py-1.5 flex justify-between text-[9px] text-neutral-500 font-mono" style={{ background: "oklch(0.07 0 0)" }}>
                <span>Allowed: <strong className="text-green-400/90">{stats.allowed.toLocaleString()}</strong></span>
                <span>Mitigated Threats: <strong className="text-red-400/90">{stats.blocked.toLocaleString()}</strong></span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function RootPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeService, setActiveService] = useState("ddos");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState("waf");

  // Contact Sales state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    expectedRequestsPerMonth: "",
    useCase: "",
    currentProvider: ""
  });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState("");

  useEffect(() => { if (getToken()) setIsLoggedIn(true); }, []);

  // Auto-cycle services tab
  useEffect(() => {
    const ids = SERVICES.map((s) => s.id);
    const id = setInterval(() => {
      setActiveService((cur) => {
        const i = ids.indexOf(cur);
        return ids[(i + 1) % ids.length];
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const activeSvc = SERVICES.find((s) => s.id === activeService)!;

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "oklch(0.09 0 0)" }}>

      {/* Grid bg */}
      <div className="pointer-events-none fixed inset-0" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full blur-[120px] opacity-25 animate-pulse"
          style={{ width: 600, height: 600, top: -100, left: "50%", transform: "translateX(-50%)", background: "radial-gradient(circle, oklch(0.65 0.22 30) 0%, transparent 70%)", animationDuration: "5s" }} />
        <div className="absolute rounded-full blur-[100px] opacity-15"
          style={{ width: 400, height: 400, bottom: "30%", right: "8%", background: "radial-gradient(circle, oklch(0.57 0.22 264) 0%, transparent 70%)" }} />
        <div className="absolute rounded-full blur-[80px] opacity-10"
          style={{ width: 300, height: 300, top: "45%", left: "5%", background: "radial-gradient(circle, oklch(0.60 0.20 180) 0%, transparent 70%)" }} />
      </div>

      {/* ── Navbar ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/8 backdrop-blur-md" style={{ background: "oklch(0.09 0 0 / 80%)" }}>
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-7 w-7 transition-transform duration-300 group-hover:scale-110">
              <Image src="/logo.png" alt="EdgeWrap logo" fill className="object-contain invert" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">EdgeWrap</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-xs text-neutral-400">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#global-protection" className="hover:text-white transition-colors">Perimeter Shield</a>
            <a href="#live-demos" className="hover:text-white transition-colors">Demos</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <button onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95">
                Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button onClick={() => router.push("/login")}
                  className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:text-white">
                  Sign in
                </button>
                <button onClick={() => router.push("/signup")}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95">
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="relative pt-14">

        {/* ═══ HERO ═══ */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-20 text-center">
          <div className="mb-8 flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-medium text-orange-300">AI-Powered Edge API Platform</span>
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            Protect, cache &amp;{" "}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, oklch(0.75 0.22 50), oklch(0.65 0.22 30), oklch(0.60 0.22 10))" }}>
              accelerate
            </span>
            <br />your APIs at the edge.
          </h1>
          <p className="mb-10 max-w-2xl text-base leading-relaxed text-neutral-400 md:text-lg">
            EdgeWrap sits in front of your APIs and handles DDoS mitigation, bot filtering, WAF,
            intelligent caching, and AI-powered healing — all at the edge, in milliseconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => router.push(isLoggedIn ? "/dashboard" : "/signup")}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-400 hover:shadow-orange-400/40 hover:-translate-y-0.5 active:scale-95">
              {isLoggedIn ? "Go to Dashboard" : "Start for free"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#services"
              className="flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-neutral-300 backdrop-blur-sm transition-all hover:border-white/30 hover:text-white hover:-translate-y-0.5">
              Explore services <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-16 flex flex-wrap justify-center items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />SOC 2 compliant</span>
            <span className="text-neutral-700">·</span>
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Global edge network</span>
            <span className="text-neutral-700">·</span>
            <span className="flex items-center gap-1.5"><Server className="h-3.5 w-3.5" />99.9% SLA</span>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="border-y border-white/8" style={{ background: "oklch(0.11 0 0)" }}>
          <div className="mx-auto max-w-4xl px-6 py-10">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {STATS.map((s) => <AnimatedStat key={s.label} value={s.value} label={s.label} />)}
            </div>
          </div>
        </section>

        {/* ═══ INTERACTIVE SERVICES ═══ */}
        <section id="services" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
              <Zap className="h-3.5 w-3.5 text-orange-400" />
              Everything you need at the edge
            </div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Built-in edge services</h2>
            <p className="mt-3 text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
              Every service runs at the global edge — no cold starts, no servers to manage.
              Click any service to see it in action.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">

            {/* ── Tab list ── */}
            <div className="flex flex-col gap-1.5">
              {SERVICES.map((svc) => {
                const Icon = svc.icon;
                const isActive = activeService === svc.id;
                return (
                  <button
                    key={svc.id}
                    onClick={() => setActiveService(svc.id)}
                    className="group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300"
                    style={{
                      borderColor: isActive ? svc.accent + "60" : "rgba(255,255,255,0.06)",
                      background: isActive ? svc.accent + "12" : "rgba(255,255,255,0.02)",
                      transform: isActive ? "translateX(4px)" : "translateX(0)",
                    }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300"
                      style={{
                        borderColor: isActive ? svc.accent + "50" : "rgba(255,255,255,0.08)",
                        background: isActive ? svc.accent + "20" : "transparent",
                        color: isActive ? svc.accent : "rgba(255,255,255,0.3)",
                      }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">{svc.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{svc.tagline}</p>
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0" style={{ background: svc.accent }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Demo panel ── */}
            <div className="relative rounded-2xl border overflow-hidden transition-all duration-500"
              style={{ borderColor: activeSvc.accent + "30", boxShadow: `0 0 40px ${activeSvc.accent}18` }}>

              {/* Panel header */}
              <div className="flex items-center justify-between border-b px-5 py-4 backdrop-blur-sm"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "oklch(0.12 0 0)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{ borderColor: activeSvc.accent + "40", background: activeSvc.accent + "15", color: activeSvc.accent }}>
                    {(() => { const Icon = activeSvc.icon; return <Icon className="h-4 w-4" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{activeSvc.name}</p>
                    <p className="text-[10px] text-neutral-500">{activeSvc.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: activeSvc.accent }} />
                  <span className="text-[10px] font-medium" style={{ color: activeSvc.accent }}>Live</span>
                  <span className={`ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${activeSvc.badgeClass}`}>
                    {activeSvc.badgeText}
                  </span>
                </div>
              </div>

              {/* Demo content */}
              <div className="p-5 min-h-[340px]" style={{ background: "oklch(0.105 0 0)" }}>
                <div key={activeService} style={{ animation: "fadeSlideIn 0.35s ease" }}>
                  {SERVICE_DEMOS[activeService]}
                </div>
              </div>

              {/* Progress bar auto-cycle */}
              <div className="h-0.5 w-full bg-white/5">
                <div className="h-full transition-none animate-[progress_5s_linear_infinite]"
                  style={{ background: activeSvc.accent }} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="border-t border-white/8" style={{ background: "oklch(0.11 0 0)" }}>
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  Platform highlights
                </div>
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl leading-tight">
                  Enterprise-grade infrastructure,
                  <span className="text-orange-400"> zero ops.</span>
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-neutral-400">
                  EdgeWrap abstracts away the complexity of building a secure, performant API layer.
                  Connect your origins, configure your rules, and let the edge do the rest.
                </p>
                <ul className="space-y-3">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-neutral-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30">
                        <Check className="h-3 w-3 text-green-400" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
                  <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3" style={{ background: "oklch(0.14 0 0)" }}>
                    <span className="h-3 w-3 rounded-full bg-red-500/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <span className="h-3 w-3 rounded-full bg-green-500/80" />
                    <span className="ml-3 text-xs text-neutral-500 font-mono">EdgeWrap — Dashboard</span>
                  </div>
                  <div className="p-5 space-y-4" style={{ background: "oklch(0.11 0 0)" }}>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ l: "Total Attacks", v: "1,247", c: "text-orange-400" }, { l: "Blocked", v: "891", c: "text-red-400" }, { l: "Mitigated", v: "356", c: "text-green-400" }].map(s => (
                        <div key={s.l} className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
                          <p className="text-[10px] text-neutral-500 mb-1">{s.l}</p>
                          <p className={`text-lg font-bold tabular-nums ${s.c}`}>{s.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-white/8 p-3" style={{ background: "oklch(0.14 0 0)" }}>
                      <p className="text-[10px] text-neutral-500 mb-3">Attack trend · 14 days</p>
                      <div className="flex items-end gap-1 h-16">
                        {[2, 5, 3, 8, 4, 12, 7, 3, 9, 15, 6, 11, 4, 8].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm"
                            style={{ height: `${(h / 15) * 100}%`, background: "linear-gradient(to top, oklch(0.65 0.22 30), oklch(0.65 0.22 30 / 30%))" }} />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/8 overflow-hidden" style={{ background: "oklch(0.14 0 0)" }}>
                      <p className="text-[10px] text-neutral-500 px-3 py-2 border-b border-white/5">Recent events</p>
                      {[{ t: "13:04", a: "blocked", rps: "2,340" }, { t: "12:51", a: "mitigated", rps: "890" }, { t: "12:38", a: "challenged", rps: "450" }].map((ev, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0">
                          <span className="text-[10px] font-mono text-neutral-500 w-10">{ev.t}</span>
                          <span className={`text-[10px] rounded-full border px-1.5 py-0.5 font-medium ${ev.a === "blocked" ? "bg-red-500/15 text-red-400 border-red-500/30" : ev.a === "mitigated" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"}`}>{ev.a}</span>
                          <span className="text-[10px] font-mono text-orange-400 ml-auto">{ev.rps} rps</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -inset-6 -z-10 rounded-3xl blur-2xl opacity-20"
                  style={{ background: "radial-gradient(circle, oklch(0.65 0.22 30) 0%, transparent 70%)" }} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SEE IT IN ACTION ═══ */}
        <section id="live-demos" className="border-t border-white/8" style={{ background: "oklch(0.09 0 0)" }}>
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                Interactive demos
              </div>
              <h2 className="text-3xl font-bold text-white md:text-4xl">See it in action</h2>
              <p className="mt-3 text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
                Interact with live simulations of our edge services. Launch attacks, adjust parameters, and explore the global network.
              </p>
            </div>

            {/* Demo tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {DEMO_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDemo === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemo(tab.id)}
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-all duration-300"
                    style={{
                      borderColor: isActive ? tab.accent + "50" : "rgba(255,255,255,0.08)",
                      background: isActive ? tab.accent + "12" : "rgba(255,255,255,0.02)",
                      color: isActive ? tab.accent : "rgba(255,255,255,0.5)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {isActive && <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: tab.accent }} />}
                  </button>
                );
              })}
            </div>

            {/* Demo panel */}
            {(() => {
              const activeTab = DEMO_TABS.find((t) => t.id === activeDemo)!;
              return (
                <div
                  className="rounded-2xl border overflow-hidden transition-all duration-500"
                  style={{ borderColor: activeTab.accent + "25", boxShadow: `0 0 60px ${activeTab.accent}10` }}
                >
                  <div
                    className="flex items-center justify-between border-b px-5 py-3"
                    style={{ borderColor: "rgba(255,255,255,0.06)", background: "oklch(0.12 0 0)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: activeTab.accent }} />
                      <span className="text-xs font-medium" style={{ color: activeTab.accent }}>Live Simulation</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 hidden sm:inline">{activeTab.desc}</span>
                  </div>
                  <div className="p-5 sm:p-6" style={{ background: "oklch(0.10 0 0)" }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeDemo}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                      >
                        {activeDemo === "waf" && <WafAttackInteractive />}
                        {activeDemo === "ddos" && <DdosStormInteractive />}
                        {activeDemo === "cache" && <CacheFlowInteractive />}
                        {activeDemo === "geo" && <GeoRoutingInteractive />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ═══ GLOBAL THREAT PROTECTION MAP ═══ */}
        <GlobalThreatProtectionMap />

        {/* ═══ HOW IT WORKS — Global Pipeline ═══ */}
        <HowItWorksSection />

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="border-t border-white/8" style={{ background: "oklch(0.09 0 0)" }}>
          <div className="mx-auto max-w-6xl px-6 py-24">

            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                Simple, transparent pricing
              </div>
              <h2 className="text-3xl font-bold text-white md:text-4xl">Pick your plan</h2>
              <p className="mt-3 text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
                Start free, scale as you grow. Every plan includes the full edge network — no hidden infrastructure fees.
              </p>

              {/* Billing toggle */}
              <div className="mt-6 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setBilling("monthly")}
                  className="rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200"
                  style={{ background: billing === "monthly" ? "rgba(255,255,255,0.1)" : "transparent", color: billing === "monthly" ? "white" : "rgb(115,115,115)" }}>
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("yearly")}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200"
                  style={{ background: billing === "yearly" ? "rgba(255,255,255,0.1)" : "transparent", color: billing === "yearly" ? "white" : "rgb(115,115,115)" }}>
                  Yearly
                  <span className="rounded-full bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 text-[9px] font-semibold">-20%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 items-stretch">
              {PLANS.map((plan) => {
                const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                const isHighlighted = plan.highlight;
                const isHovered = hoveredPlan === plan.name;
                return (
                  <div
                    key={plan.name}
                    onMouseEnter={() => setHoveredPlan(plan.name)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    className="relative flex flex-col rounded-2xl border transition-all duration-300"
                    style={{
                      borderColor: isHighlighted ? "#f97316" + "60" : "rgba(255,255,255,0.08)",
                      background: isHighlighted ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.02)",
                      transform: isHighlighted ? "scale(1.02)" : isHovered ? "scale(1.01)" : "scale(1)",
                      boxShadow: isHighlighted ? "0 0 40px rgba(249,115,22,0.15)" : "none",
                    }}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                        <span className="rounded-full border border-orange-500/40 bg-orange-500/20 px-3 py-0.5 text-[10px] font-semibold text-orange-300">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      {/* Plan name + price */}
                      <div className="mb-5">
                        <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                        <p className="text-[10px] text-neutral-500 mb-4 h-8 overflow-hidden">{plan.desc}</p>
                        <div className="flex items-end gap-1">
                          {price === null ? (
                            <span className="text-3xl font-bold text-white">Custom</span>
                          ) : price === 0 ? (
                            <span className="text-3xl font-bold text-white">Free</span>
                          ) : (
                            <>
                              <span className="text-3xl font-bold text-white">${price}</span>
                              <span className="text-xs text-neutral-500 mb-1">/mo</span>
                            </>
                          )}
                        </div>
                        {billing === "yearly" && price !== null && price > 0 && (
                          <p className="text-[10px] text-green-400 mt-1">Billed ${price * 12}/year · saves ${(plan.monthlyPrice! - price) * 12}/yr</p>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px w-full mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />

                      {/* Features */}
                      <ul className="space-y-2.5 flex-1 mb-6">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-[11px] text-neutral-300 leading-tight">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full mt-0.5"
                              style={{ background: isHighlighted ? "rgba(249,115,22,0.2)" : "rgba(34,197,94,0.15)", border: isHighlighted ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(34,197,94,0.3)" }}>
                              <Check className="h-2.5 w-2.5" style={{ color: isHighlighted ? "#fb923c" : "#4ade80" }} />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <button
                        onClick={() => {
                          if (plan.name === "Enterprise") {
                            setIsContactModalOpen(true);
                          } else {
                            router.push(isLoggedIn ? "/dashboard" : `/signup?plan=${plan.name.toLowerCase()}`);
                          }
                        }}
                        className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 animate-hover"
                        style={plan.ctaVariant === "primary"
                          ? { background: "#f97316", color: "white", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }
                          : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }
                        }
                        onMouseEnter={(e) => {
                          if (plan.ctaVariant === "primary") (e.currentTarget as HTMLButtonElement).style.background = "#ea6d10";
                          else (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
                        }}
                        onMouseLeave={(e) => {
                          if (plan.ctaVariant === "primary") (e.currentTarget as HTMLButtonElement).style.background = "#f97316";
                          else (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                        }}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-neutral-600">
              All plans include the global edge network. No setup fees. Cancel anytime.
            </p>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="relative overflow-hidden border-t border-white/8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute rounded-full blur-[100px] opacity-25"
              style={{ width: 500, height: 300, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(ellipse, oklch(0.65 0.22 30) 0%, transparent 70%)" }} />
          </div>
          <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Ready to go to the edge?</h2>
            <p className="mb-8 text-neutral-400">Set up your first project in minutes. No credit card required.</p>
            <button
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/signup")}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-400 hover:shadow-orange-400/40 hover:-translate-y-0.5 active:scale-95 mx-auto">
              {isLoggedIn ? "Open Dashboard" : "Create free account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-white/8 px-6 py-8" style={{ background: "oklch(0.09 0 0)" }}>
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5">
                <Image src="/logo.png" alt="EdgeWrap" fill className="object-contain invert opacity-50" />
              </div>
              <span>EdgeWrap — Edge API Platform</span>
            </div>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Docs", "Status"].map(l => (
                <a key={l} href="#" className="hover:text-neutral-300 transition-colors">{l}</a>
              ))}
            </div>
            <span>© 2026 EdgeWrap. All rights reserved.</span>
          </div>
        </footer>

        {/* Contact Sales Modal */}
        <AnimatePresence>
          {isContactModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!leadSubmitting) setIsContactModalOpen(false);
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/95 p-6 shadow-2xl backdrop-blur-md"
              >
                {/* Top ambient glow */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

                {/* Close Button */}
                <button
                  disabled={leadSubmitting}
                  onClick={() => setIsContactModalOpen(false)}
                  className="absolute right-4 top-4 rounded-lg border border-white/5 bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 z-10"
                >
                  <XCircle className="h-5 w-5" />
                </button>

                {leadSubmitted ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Inquiry Received!</h3>
                    <p className="mt-2 text-sm text-neutral-400">
                      Thank you for reaching out. We have sent a confirmation email to <strong className="text-white">{leadForm.email}</strong> and our Enterprise team will contact you within 1 business day.
                    </p>
                    <button
                      onClick={() => {
                        setIsContactModalOpen(false);
                        setLeadSubmitted(false);
                        setLeadForm({
                          name: "",
                          email: "",
                          companyName: "",
                          phone: "",
                          expectedRequestsPerMonth: "",
                          useCase: "",
                          currentProvider: ""
                        });
                      }}
                      className="mt-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 text-sm font-semibold text-white transition-all"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setLeadSubmitting(true);
                      setLeadError("");
                      try {
                        const reqs = leadForm.expectedRequestsPerMonth
                          ? parseInt(leadForm.expectedRequestsPerMonth, 10)
                          : undefined;
                        
                        await apiFetch("/billing/contact-sales", {
                          method: "POST",
                          body: {
                            ...leadForm,
                            expectedRequestsPerMonth: reqs,
                          },
                        });
                        setLeadSubmitted(true);
                      } catch (err: any) {
                        setLeadError(err?.message ?? "An error occurred while submitting. Please try again.");
                      } finally {
                        setLeadSubmitting(false);
                      }
                    }}
                    className="space-y-4 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white">Contact Enterprise Sales</h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Our custom enterprise solutions offer high availability, custom SLAs, and tailored volume limits.
                      </p>
                    </div>

                    {leadError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{leadError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="lead-name" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Full Name *</label>
                        <input
                          id="lead-name"
                          type="text"
                          required
                          disabled={leadSubmitting}
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="John Doe"
                          className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="lead-email" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Work Email *</label>
                        <input
                          id="lead-email"
                          type="email"
                          required
                          disabled={leadSubmitting}
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          placeholder="john@company.com"
                          className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="lead-company" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Company Name</label>
                        <input
                          id="lead-company"
                          type="text"
                          disabled={leadSubmitting}
                          value={leadForm.companyName}
                          onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                          placeholder="Acme Corp"
                          className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="lead-phone" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Phone Number</label>
                        <input
                          id="lead-phone"
                          type="tel"
                          disabled={leadSubmitting}
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="lead-requests" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Est. Requests / Mo</label>
                        <select
                          id="lead-requests"
                          disabled={leadSubmitting}
                          value={leadForm.expectedRequestsPerMonth}
                          onChange={(e) => setLeadForm({ ...leadForm, expectedRequestsPerMonth: e.target.value })}
                          className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="" className="bg-[#0c0c0e] text-neutral-400">Select volume...</option>
                          <option value="5000000" className="bg-[#0c0c0e]">Under 10M / month</option>
                          <option value="25000000" className="bg-[#0c0c0e]">10M – 50M / month</option>
                          <option value="100000000" className="bg-[#0c0c0e]">50M – 200M / month</option>
                          <option value="500000000" className="bg-[#0c0c0e]">200M – 1B / month</option>
                          <option value="1500000000" className="bg-[#0c0c0e]">Over 1B / month</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="lead-provider" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Current Provider</label>
                        <input
                          id="lead-provider"
                          type="text"
                          disabled={leadSubmitting}
                          value={leadForm.currentProvider}
                          onChange={(e) => setLeadForm({ ...leadForm, currentProvider: e.target.value })}
                          placeholder="Cloudflare, AWS CloudFront, etc."
                          className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="lead-usecase" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Use Case & Requirements</label>
                      <textarea
                        id="lead-usecase"
                        rows={3}
                        disabled={leadSubmitting}
                        value={leadForm.useCase}
                        onChange={(e) => setLeadForm({ ...leadForm, useCase: e.target.value })}
                        placeholder="Please describe your security, caching, compliance, or support needs..."
                        className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={leadSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 hover:bg-orange-400 hover:shadow-orange-400/30 transition-all active:scale-98 disabled:opacity-50 font-bold"
                    >
                      {leadSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Submitting Inquiry...
                        </>
                      ) : (
                        "Submit Enterprise Request"
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
