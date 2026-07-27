"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mastermindClient, type ReportsData } from "@/lib/services/mastermindClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-1))", "hsl(var(--chart-3))", "hsl(var(--chart-5))", "hsl(var(--chart-2))"];

export default function MastermindReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mastermindClient.reports();
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-card" />
        <Skeleton className="h-80 bg-card" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 bg-card" />
          <Skeleton className="h-80 bg-card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">{error ?? "No data"}</p>
        <button
          onClick={fetchReports}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const attendanceChartData = data.dailyAttendance.map((d) => ({
    date: d.date.slice(5),
    Total: d.total,
    Present: d.present,
    Late: d.late,
    "Checked Out": d.checked_out,
  }));

  const planChartData = Object.entries(data.plans).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground/70">Platform-wide data and trends.</p>
      </div>

      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Daily Attendance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "#1e293b",
                    color: "#f1f5f9",
                  }}
                />
                <Bar dataKey="Total" fill="#10b981" />
                <Bar dataKey="Present" fill="#10b981" />
                <Bar dataKey="Late" fill="#f59e0b" />
                <Bar dataKey="Checked Out" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Plans Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "#1e293b",
                      color: "#f1f5f9",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {planChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="capitalize">{entry.name}</span>
                  <span className="text-muted-foreground/70">({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Top Companies by Employees</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-card/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Company</th>
                    <th className="text-right px-4 py-3 font-medium">Employees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.topCompanies.map((company) => (
                    <tr key={company.id}>
                      <td className="px-4 py-3 text-foreground font-medium">{company.name}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {company.employees_count ?? 0}
                      </td>
                    </tr>
                  ))}
                  {data.topCompanies.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground/70">
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
    </div>
  );
}
