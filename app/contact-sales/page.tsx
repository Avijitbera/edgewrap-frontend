"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getToken, apiFetch } from "@/lib/api";
import { useMe } from "@/lib/queries/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  XCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Shield,
  Zap,
  Bot,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicContactSalesPage() {
  const router = useRouter();
  const { data: user } = useMe();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    expectedRequestsPerMonth: "",
    useCase: "",
    currentProvider: "",
  });

  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    if (getToken()) {
      setIsLoggedIn(true);
    }
  }, []);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      setLeadForm((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email ?? prev.email,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col justify-between" style={{ background: "oklch(0.09 0 0)" }}>
      {/* Grid bg */}
      <div className="pointer-events-none fixed inset-0" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full blur-[120px] opacity-20"
          style={{ width: 500, height: 500, top: -100, left: "10%", background: "radial-gradient(circle, oklch(0.65 0.22 30) 0%, transparent 70%)" }} />
        <div className="absolute rounded-full blur-[100px] opacity-15"
          style={{ width: 500, height: 500, bottom: -100, right: "10%", background: "radial-gradient(circle, oklch(0.57 0.22 264) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/8 backdrop-blur-md" style={{ background: "oklch(0.09 0 0 / 80%)" }}>
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-7 w-7 transition-transform duration-300 group-hover:scale-110">
              <Image src="/logo.png" alt="EdgeWrap logo" fill className="object-contain invert" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">EdgeWrap</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-xs text-neutral-400 hover:text-white h-8">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to Home
              </Button>
            </Link>
            {!isLoggedIn ? (
              <Link href="/login">
                <Button className="text-xs h-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white">
                  Log In
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button className="text-xs h-8 bg-orange-500 hover:bg-orange-400 text-white font-bold">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Page Area */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-10 items-center w-full flex-1">
        {/* Info Column */}
        <div className="md:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-400">
            Enterprise Plan
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight md:text-4xl">
            Scale and secure your APIs globally
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            EdgeWrap Enterprise is built for fast-growing businesses needing ultra-reliable performance, high security compliance, and dedicated support.
          </p>

          <SeparatorAccent />

          {/* Core Perks */}
          <div className="space-y-4">
            {[
              { icon: Shield, title: "Custom WAF & Compliance", desc: "Enterprise-grade threat protection with mTLS client auth." },
              { icon: Zap, title: "Unlimited Scaling", desc: "No request limits or throttling. Custom bandwidth pools." },
              { icon: Bot, title: "Tailored AI Rules", desc: "Fine-tune bot heuristics and caching TTLs to your workload." },
              { icon: Activity, title: "Dedicated Support", desc: "Direct Slack communication channel and custom 99.99% SLAs." },
            ].map((perk) => (
              <div key={perk.title} className="flex gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-orange-400 mt-0.5">
                  <perk.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{perk.title}</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-7 flex justify-center w-full">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/80 p-6 md:p-8 shadow-2xl backdrop-blur-md relative">
            {/* Corner glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />

            {leadSubmitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Inquiry Received!</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Thank you for reaching out. We have sent a confirmation email to <strong className="text-white">{leadForm.email}</strong> and our Enterprise sales team will contact you within 1 business day.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link href="/">
                    <Button className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 h-10 text-xs font-semibold text-white">
                      Back to Home
                    </Button>
                  </Link>
                  {isLoggedIn && (
                    <Link href="/dashboard">
                      <Button className="rounded-xl bg-orange-500 hover:bg-orange-400 px-6 h-10 text-xs font-semibold text-white">
                        Go to Dashboard
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <h3 className="text-lg font-bold text-white">Contact Enterprise Sales</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Fill out the form below and we will get back to you shortly.
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
                      placeholder="Cloudflare, AWS, None, etc."
                      className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="lead-usecase" className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Use Case & Requirements</label>
                  <textarea
                    id="lead-usecase"
                    rows={4}
                    disabled={leadSubmitting}
                    value={leadForm.useCase}
                    onChange={(e) => setLeadForm({ ...leadForm, useCase: e.target.value })}
                    placeholder="Describe your security compliance, SLA expectations, caching needs, or expected data residency rules..."
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-orange-500 focus:bg-white/10 focus:outline-none transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={leadSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 hover:bg-orange-400 hover:shadow-orange-400/30 transition-all active:scale-98 disabled:opacity-50 font-bold"
                >
                  {leadSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    "Submit Enterprise Request"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-6 relative z-10" style={{ background: "oklch(0.09 0 0)" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-5">
              <Image src="/logo.png" alt="EdgeWrap" fill className="object-contain invert opacity-50" />
            </div>
            <span>EdgeWrap — Edge API Platform</span>
          </div>
          <span>© 2026 EdgeWrap. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function SeparatorAccent() {
  return (
    <div className="h-[2px] w-12 rounded bg-gradient-to-r from-orange-500 to-violet-500" />
  );
}
