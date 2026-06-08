import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Insights — EdgeWrap" };

export default function AiInsightsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
    </div>
  );
}
