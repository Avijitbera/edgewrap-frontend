import { SignupForm } from "@/components/auth/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up — EdgeWrap",
  description: "Create your free EdgeWrap account. No credit card required.",
};

export default function SignupPage() {
  return <SignupForm />;
}
