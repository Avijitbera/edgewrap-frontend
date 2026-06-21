"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLogin } from "@/lib/queries/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Zap,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Shield, text: "WAF & DDoS protection at the edge" },
  { icon: Zap, text: "Smart caching & circuit breaker" },
  { icon: Lock, text: "Secret Shield & Bot Detection" },
];

export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      const projects = await qc
        .fetchQuery({
          queryKey: ["projects"],
          queryFn: async () => {
            const { apiFetch } = await import("@/lib/api");
            const res = await apiFetch<any>("/projects");
            return Array.isArray(res) ? res : res?.data ?? [];
          },
        })
        .catch(() => []);
      router.push((projects as unknown[]).length === 0 ? "/onboarding" : "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left panel — branding ─────────────── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-card border-r border-border p-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="EdgeWrap" width={36} height={36} className="rounded-lg" priority />
          <span className="text-base font-semibold tracking-tight">EdgeWrap</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight leading-tight">
              Protect & accelerate<br />your APIs at the edge
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enterprise-grade edge infrastructure for modern APIs.
              Deploy in seconds, scale to millions.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} EdgeWrap. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ─────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <Image src="/logo.png" alt="EdgeWrap" width={40} height={40} className="rounded-lg" priority />
          <span className="text-sm font-semibold">EdgeWrap</span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              id="login-submit"
              type="submit"
              className="w-full h-10 gap-2 font-medium"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground underline-offset-4 hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
