"use client";

import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Zap, DollarSign } from "lucide-react";

export default function ROIReportPage() {
  const roiData = {
    total_savings: 892.45,
    routing_savings: 534.28,
    cache_savings: 358.17,
    original_cost: 2139.77,
    actual_cost: 1247.32,
    savings_rate: 41.7,
  };

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">ROI Report</h1>
            <p className="text-muted-foreground mt-1">
              Measure the value TokenGuard delivers
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  ${roiData.total_savings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {roiData.savings_rate.toFixed(1)}% reduction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Routing Savings</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${roiData.routing_savings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Smart model selection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cache Savings</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${roiData.cache_savings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Semantic prompt cache
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Without TokenGuard</span>
                  <span className="text-lg font-bold text-muted-foreground">
                    ${roiData.original_cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">With TokenGuard</span>
                  <span className="text-lg font-bold text-primary">
                    ${roiData.actual_cost.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">You Saved</span>
                    <span className="text-2xl font-bold text-green-500">
                      ${roiData.total_savings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
