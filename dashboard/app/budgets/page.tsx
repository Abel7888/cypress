"use client";

import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function BudgetsPage() {
  const mockBudgets = [
    {
      id: "1",
      name: "Monthly Production Budget",
      scope: "tenant",
      period: "monthly",
      limit_usd: 5000,
      spent_usd: 3247.32,
      pct_used: 64.9,
      action_on_limit: "alert",
    },
    {
      id: "2",
      name: "Agent-123 Daily Cap",
      scope: "agent",
      period: "daily",
      limit_usd: 100,
      spent_usd: 87.45,
      pct_used: 87.5,
      action_on_limit: "block",
    },
    {
      id: "3",
      name: "GPT-4o Weekly Limit",
      scope: "model",
      period: "weekly",
      limit_usd: 1000,
      spent_usd: 423.18,
      pct_used: 42.3,
      action_on_limit: "throttle",
    },
  ];

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and control your AI spending limits
            </p>
          </div>

          <div className="grid gap-6">
            {mockBudgets.map((budget) => (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {budget.scope} • {budget.period} • {budget.action_on_limit} on limit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${budget.spent_usd.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        of ${budget.limit_usd.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress
                    value={budget.pct_used}
                    indicatorClassName={
                      budget.pct_used >= 90
                        ? "bg-red-500"
                        : budget.pct_used >= 80
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {budget.pct_used.toFixed(1)}% used
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
