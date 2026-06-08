import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthlyUsd: number;
  priceYearlyUsd: number | null;
  requestsPerMonth: number | null;
  bandwidthGbPerMonth: number | null;
  aiCallsPerMonth: number | null;
  maxProjects: number | null;
  features: string | null; // JSON array
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  projectId: string;
  periodStart: string;
  totalRequests: number;
  paygRequests: number;
  totalBandwidthBytes: number;
  aiTotalCalls: number;
  paygCostUsd: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface UsageResponse {
  periodStart: string;
  periodEnd: string;
  freeRequestsUsed: number;
  freeRequestsLimit: number;
  projects: UsageRecord[];
  totals: {
    totalRequests: number;
    paygRequests: number;
    totalBandwidthBytes: number;
    aiTotalCalls: number;
    paygCostUsd: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string | null;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  periodStart: string | null;
  periodEnd: string | null;
  invoiceUrl: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["billing-plans"],
    queryFn: async () => {
      const res = await apiFetch<Plan[] | { data: Plan[] }>("/billing/plans");
      return Array.isArray(res) ? res : (res as { data: Plan[] }).data ?? [];
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}

export function useSubscription() {
  return useQuery<{ subscription: Subscription | null; plan: Plan | null }>({
    queryKey: ["billing-subscription"],
    queryFn: () =>
      apiFetch<{ subscription: Subscription | null; plan: Plan | null }>(
        "/billing/subscription"
      ),
  });
}

export function useUsage() {
  return useQuery<UsageResponse>({
    queryKey: ["billing-usage"],
    queryFn: () => apiFetch<UsageResponse>("/billing/usage"),
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["billing-invoices"],
    queryFn: async () => {
      const res = await apiFetch<Invoice[] | { data: Invoice[] }>(
        "/billing/invoices"
      );
      return Array.isArray(res) ? res : (res as { data: Invoice[] }).data ?? [];
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (body: {
      planId: string;
      billingCycle: "monthly" | "yearly";
      successUrl: string;
      cancelUrl: string;
    }) =>
      apiFetch<{ checkoutUrl: string; sessionId: string }>("/billing/checkout", {
        method: "POST",
        body,
      }),
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: (returnUrl: string) =>
      apiFetch<{ portalUrl: string }>("/billing/portal", {
        method: "POST",
        body: { returnUrl },
      }),
  });
}
