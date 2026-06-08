import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics — EdgeWrap" };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
    </div>
  );
}
