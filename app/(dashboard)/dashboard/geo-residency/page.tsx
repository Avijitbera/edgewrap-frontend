import type { Metadata } from "next";
import GeoResidencyClient from "./geo-residency-client";

export const metadata: Metadata = {
  title: "Geo-Fenced Data Residency & GDPR Masking — EdgeWrap",
  description: "Configure geographic routing policies and GDPR-compliant field masking at the edge.",
};

export default function GeoResidencyPage() {
  return <GeoResidencyClient />;
}
