"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { mastermindClient, type MastermindDashboard } from "@/lib/services/mastermindClient";
import {
  Building2,
  Users,
  MapPin,
  CalendarCheck,
  LogOut,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function MastermindDashboardPage() {
  const [data, setData] = useState<MastermindDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mastermindClient.dashboard();
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-card" />
          ))}
        </div>
        <Skeleton className="h-80 bg-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">{error ?? "No data"}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "Companies", value: data.stats.companies, icon: Building2, color: "text-primary" },
    {
      label: "Active Companies",
      value: data.stats.activeCompanies,
      icon: Activity,
      color: "text-primary",
    },
    {
      label: "Trial Companies",
      value: data.stats.trialCompanies,
      icon: TrendingUp,
      color: "text-[hsl(48_96%_53%)]",
    },
    { label: "Users", value: data.stats.users, icon: Users, color: "text-primary" },
    { label: "Employees", value: data.stats.employees, icon: Users, color: "text-primary" },
    { label: "Geofences", value: data.stats.geofences, icon: MapPin, color: "text-destructive" },
    {
      label: "Check-ins Today",
      value: data.stats.attendanceToday,
      icon: CalendarCheck,
      color: "text-primary",
    },
    {
      label: "Check-outs Today",
      value: data.stats.checkedOutToday,
      icon: LogOut,
      color: "text-[hsl(25_95%_53%)]",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground/70">Real-time SaaS metrics across all tenants.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-background border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground/70 text-xs uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Recently Added Companies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Users</th>
                  <th className="text-left px-4 py-3 font-medium">Employees</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.recentCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-card/30">
                    <td className="px-4 py-3 text-foreground font-medium">{company.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize bg-card text-muted-foreground">
                        {company.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{company.users_count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{company.employees_count ?? 0}</td>
                    <td className="px-4 py-3">
                      {company.active ? (
                        <span className="inline-flex items-center gap-1.5 text-primary text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground/70 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted0" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.recentCompanies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground/70">
                      No companies yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
