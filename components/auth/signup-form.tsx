"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useRegister } from "@/lib/queries/auth";
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
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PERKS = [
  "10,000 requests / month — free forever",
  "WAF, DDoS & cache on every project",
  "Up to 3 projects on the free tier",
  "No credit card required",
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number or symbol", ok: /[0-9!@#$%^&*]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors",
              c.ok
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            {c.ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
          </span>
          <span className={cn(c.ok ? "text-foreground" : "text-muted-foreground")}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const register = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({ name, email, password });
      const projects = await qc
        .fetchQuery({
          queryKey: ["projects"],
          queryFn: async () => {
            const { apiFetch } = await import("@/lib/api");
            const res = await apiFetch<unknown[]>("/projects");
            return Array.isArray(res) ? res : [];
          },
        })
        .catch(() => []);
      router.push((projects as unknown[]).length === 0 ? "/onboarding" : "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
              Start protecting<br />your APIs today
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Everything you need to secure, cache, and observe your API
              traffic — deployed at the edge, globally.
            </p>
          </div>

          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                  <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                </div>
                <span className="text-sm text-muted-foreground">{perk}</span>
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Free forever. No credit card required.
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
              <Label htmlFor="signup-name" className="text-sm font-medium">
                Full name
              </Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-sm font-medium">
                Work email
              </Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
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
              <PasswordStrength password={password} />
            </div>

            <Button
              id="signup-submit"
              type="submit"
              className="w-full h-10 gap-2 font-medium mt-2"
              disabled={register.isPending || !name || !email || password.length < 8}
            >
              {register.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>.
          </p>

          <Separator className="my-6" />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
