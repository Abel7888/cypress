"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  TrendingDown,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Cost Analysis", href: "/cost-analysis", icon: BarChart3 },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "ROI Report", href: "/roi-report", icon: TrendingDown },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold tracking-tight">TokenGuard</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2">
          <Zap className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-xs font-medium">Proxy Active</p>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-green-500" />
        </div>
      </div>
    </aside>
  );
}
