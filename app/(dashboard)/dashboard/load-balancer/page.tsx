import type { Metadata } from "next";
import LoadBalancerClient from "./load-balancer-client";

export const metadata: Metadata = {
  title: "Advanced Load Balancing — EdgeWrap",
  description: "Distribute user traffic across multiple backend origins with smart algorithms and sticky session affinity.",
};

export default function LoadBalancerPage() {
  return <LoadBalancerClient />;
}
