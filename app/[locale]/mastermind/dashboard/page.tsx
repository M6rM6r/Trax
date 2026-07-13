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
            <Skeleton key={i} className="h-28 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-80 bg-slate-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-rose-400 mb-4">{error ?? "No data"}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "Companies", value: data.stats.companies, icon: Building2, color: "text-blue-400" },
    {
      label: "Active Companies",
      value: data.stats.activeCompanies,
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: "Trial Companies",
      value: data.stats.trialCompanies,
      icon: TrendingUp,
      color: "text-amber-400",
    },
    { label: "Users", value: data.stats.users, icon: Users, color: "text-indigo-400" },
    { label: "Employees", value: data.stats.employees, icon: Users, color: "text-cyan-400" },
    { label: "Geofences", value: data.stats.geofences, icon: MapPin, color: "text-rose-400" },
    {
      label: "Check-ins Today",
      value: data.stats.attendanceToday,
      icon: CalendarCheck,
      color: "text-emerald-400",
    },
    {
      label: "Check-outs Today",
      value: data.stats.checkedOutToday,
      icon: LogOut,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Platform Overview</h1>
        <p className="text-slate-500">Real-time SaaS metrics across all tenants.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Recently Added Companies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400">
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
                  <tr key={company.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-200 font-medium">{company.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize bg-slate-800 text-slate-300">
                        {company.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{company.users_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-400">{company.employees_count ?? 0}</td>
                    <td className="px-4 py-3">
                      {company.active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.recentCompanies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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
