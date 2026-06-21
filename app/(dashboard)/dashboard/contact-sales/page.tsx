"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useMe } from "@/lib/queries/auth";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Shield,
  Zap,
  Bot,
  Activity,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DashboardContactSalesPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMe();

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

  // Pre-fill user details when loaded
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
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Contact Sales</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit an Enterprise inquiry to request custom volumes, support contracts, and SLAs.
            </p>
          </div>
        </div>
        <Link href="/dashboard/billing">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Billing
          </Button>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-6 md:grid-cols-12 max-w-5xl items-start">
        {/* Form Container */}
        <div className="md:col-span-7">
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Inquiry Form</CardTitle>
              <CardDescription className="text-xs">
                Fill in details for our enterprise team to evaluate your volume requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadSubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Lead Received!</h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Thank you for contacting sales. We have logged your request under ID and emailed a confirmation to <strong className="text-foreground">{leadForm.email}</strong>.
                    </p>
                  </div>
                  <Link href="/dashboard/billing">
                    <Button className="mt-4 rounded-xl bg-orange-500 hover:bg-orange-400 px-6 text-xs font-semibold text-white">
                      Return to Billing
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {leadError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{leadError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="dash-lead-name" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</label>
                      <input
                        id="dash-lead-name"
                        type="text"
                        required
                        disabled={leadSubmitting || userLoading}
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-orange-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="dash-lead-email" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Work Email *</label>
                      <input
                        id="dash-lead-email"
                        type="email"
                        required
                        disabled={leadSubmitting || userLoading}
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="john@company.com"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-orange-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="dash-lead-company" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Company Name</label>
                      <input
                        id="dash-lead-company"
                        type="text"
                        disabled={leadSubmitting}
                        value={leadForm.companyName}
                        onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                        placeholder="Acme Corp"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-orange-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="dash-lead-phone" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                      <input
                        id="dash-lead-phone"
                        type="tel"
                        disabled={leadSubmitting}
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-orange-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="dash-lead-requests" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Est. Requests / Mo</label>
                      <select
                        id="dash-lead-requests"
                        disabled={leadSubmitting}
                        value={leadForm.expectedRequestsPerMonth}
                        onChange={(e) => setLeadForm({ ...leadForm, expectedRequestsPerMonth: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-orange-500 focus:outline-none transition-all"
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="" className="text-muted-foreground">Select volume...</option>
                        <option value="5000000">Under 10M / month</option>
                        <option value="25000000">10M – 50M / month</option>
                        <option value="100000000">50M – 200M / month</option>
                        <option value="500000000">200M – 1B / month</option>
                        <option value="1500000000">Over 1B / month</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="dash-lead-provider" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Provider</label>
                      <input
                        id="dash-lead-provider"
                        type="text"
                        disabled={leadSubmitting}
                        value={leadForm.currentProvider}
                        onChange={(e) => setLeadForm({ ...leadForm, currentProvider: e.target.value })}
                        placeholder="Cloudflare, Kong, AWS, etc."
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[11px] text-foreground placeholder-muted-foreground focus:border-orange-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="dash-lead-usecase" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Use Case & Requirements</label>
                    <textarea
                      id="dash-lead-usecase"
                      rows={4}
                      disabled={leadSubmitting}
                      value={leadForm.useCase}
                      onChange={(e) => setLeadForm({ ...leadForm, useCase: e.target.value })}
                      placeholder="Please details your SLA, proxy, failover caching, custom WAF or bot rules..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-orange-500 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={leadSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-semibold text-white shadow-xl shadow-orange-500/20 hover:bg-orange-400 hover:shadow-orange-400/30 transition-all active:scale-98 disabled:opacity-50 font-bold"
                  >
                    {leadSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Submitting Lead Request...
                      </>
                    ) : (
                      "Submit Enterprise Request"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights Panel */}
        <div className="md:col-span-5 space-y-4">
          <Card className="border-border/60 bg-card/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Enterprise Benefits</CardTitle>
              <CardDescription className="text-[10px]">What is included in custom plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Shield, title: "SLA Guarantees", desc: "Enterprise support agreements with response SLAs under 4 hours." },
                { icon: Zap, title: "Scale Capacity", desc: "Unlimited RPS limits and tailored caching parameters." },
                { icon: Bot, title: "Custom Routing Policies", desc: "Advanced load balancing, geo-AI failovers, and priority queues." },
                { icon: Activity, title: "Account CSM", desc: "Dedicated Customer Success Manager assigned to guide deployment." },
              ].map((perk) => (
                <div key={perk.title} className="flex gap-3 items-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-orange-400 mt-0.5">
                    <perk.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{perk.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  );
}
