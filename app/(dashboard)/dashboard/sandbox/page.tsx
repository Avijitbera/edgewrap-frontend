import type { Metadata } from "next";
import SandboxClient from "./sandbox-client";

export const metadata: Metadata = {
  title: "Sandbox Recorder & API Virtualization — EdgeWrap",
  description: "Record live API traffic sessions and design mock templates to virtualize server responses at the edge.",
};

export default function SandboxPage() {
  return <SandboxClient />;
}
