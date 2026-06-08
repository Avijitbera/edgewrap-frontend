import type { Metadata } from "next";
import IpReputationClient from "./ip-reputation-client";

export const metadata: Metadata = {
  title: "IP Reputation Ledger — EdgeWrap",
  description: "Track client threat scores and manage auto-block rules based on stateful threat scoring ledger.",
};

export default function IpReputationPage() {
  return <IpReputationClient />;
}
