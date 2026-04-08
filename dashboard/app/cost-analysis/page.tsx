"use client";

import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CostAnalysisPage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Cost Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Deep dive into your AI spending patterns
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed cost analysis features coming soon. This will include:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Cost breakdown by agent, workflow, and model</li>
                <li>• Time-series analysis with custom date ranges</li>
                <li>• Cost attribution and chargebacks</li>
                <li>• Anomaly detection and alerts</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
