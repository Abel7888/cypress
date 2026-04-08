"use client";

import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";
import { CostChart } from "@/components/cost-chart";
import { ModelBreakdown } from "@/components/model-breakdown";
import { DollarSign, TrendingDown, Zap, Clock } from "lucide-react";

export default function OverviewPage() {
  const mockStats = {
    total_cost: 1247.32,
    total_savings: 892.45,
    total_requests: 45230,
    cache_hit_rate: 34.2,
    avg_latency: 1850,
  };

  const mockTrends = [
    { date: "Mar 10", cost: 42.5, savings: 28.3 },
    { date: "Mar 11", cost: 38.2, savings: 31.1 },
    { date: "Mar 12", cost: 45.8, savings: 29.4 },
    { date: "Mar 13", cost: 41.3, savings: 33.2 },
    { date: "Mar 14", cost: 39.7, savings: 35.8 },
    { date: "Mar 15", cost: 44.1, savings: 30.5 },
    { date: "Mar 16", cost: 40.9, savings: 32.7 },
  ];

  const mockModels = [
    { model: "gpt-4o-mini", cost: 342.5, requests: 28450, percentage: 27.5 },
    { model: "claude-3.5-haiku", cost: 289.3, requests: 12340, percentage: 23.2 },
    { model: "gpt-4o", cost: 415.8, requests: 3240, percentage: 33.3 },
    { model: "claude-3.5-sonnet", cost: 199.7, requests: 1200, percentage: 16.0 },
  ];

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground mt-1">
              Your AI cost control dashboard — last 30 days
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Spend"
              value={`$${mockStats.total_cost.toFixed(2)}`}
              subtitle="Last 30 days"
              icon={DollarSign}
              trend={{ value: -12.3, label: "vs previous period", positive: true }}
            />
            <StatCard
              title="Total Savings"
              value={`$${mockStats.total_savings.toFixed(2)}`}
              subtitle="From routing & caching"
              icon={TrendingDown}
              trend={{ value: 41.6, label: "savings rate", positive: true }}
            />
            <StatCard
              title="Cache Hit Rate"
              value={`${mockStats.cache_hit_rate.toFixed(1)}%`}
              subtitle={`${mockStats.total_requests.toLocaleString()} requests`}
              icon={Zap}
            />
            <StatCard
              title="Avg Latency"
              value={`${mockStats.avg_latency}ms`}
              subtitle="P50 response time"
              icon={Clock}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <CostChart data={mockTrends} />
            <ModelBreakdown data={mockModels} />
          </div>
        </div>
      </main>
    </>
  );
}
