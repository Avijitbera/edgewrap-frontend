import type { Metadata } from "next";
import ShadowTrafficClient from "./shadow-traffic-client";

export const metadata: Metadata = {
  title: "Shadow Traffic Routing & Dark Launch Analyzer — EdgeWrap",
  description: "Safely test backend modifications with parallel shadow routing and request comparison at the edge.",
};

export default function ShadowTrafficPage() {
  return <ShadowTrafficClient />;
}
