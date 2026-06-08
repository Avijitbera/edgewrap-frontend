import type { Metadata } from "next";
import AlertsClient from "./alerts-client";

export const metadata: Metadata = {
  title: "Alerts & Incidents — EdgeWrap",
  description: "Stay notified in real-time about WAF breaches, DDoS attacks, backend latency spikes, and system outages.",
};

export default function AlertsPage() {
  return <AlertsClient />;
}
