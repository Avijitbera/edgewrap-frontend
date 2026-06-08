import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — EdgeWrap",
  description: "Sign in to your EdgeWrap account to manage your API edge platform.",
};

export default function LoginPage() {
  return <LoginForm />;
}
