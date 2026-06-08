import type { Metadata } from "next";
import ThreatFeedsClient from "./threat-feeds-client";

export const metadata: Metadata = {
  title: "Threat Feeds — EdgeWrap",
  description: "Protect your network with real-time updates from Tor, proxy, VPN, and custom botnet IP lists.",
};

export default function ThreatFeedsPage() {
  return <ThreatFeedsClient />;
}
