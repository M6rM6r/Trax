"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mastermindClient,
  type CompanyDetail,
  type CompanyDetailEmployee,
  type CompanyDetailUser,
} from "@/lib/services/mastermindClient";
import { ArrowLeft, Building2, Users, MapPin } from "lucide-react";

export default function MastermindCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [data, setData] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mastermindClient.company(id);
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load company");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchCompany();
  }, [id, fetchCompany]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-card" />
        <Skeleton className="h-40 bg-card" />
        <Skeleton className="h-60 bg-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">{error ?? "Company not found"}</p>
        <Button
          onClick={() => router.push("/ar/mastermind/companies")}
          variant="outline"
          className="border-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
        </Button>
      </div>
    );
  }

  const { company, recentEmployees, users } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/ar/mastermind/companies")}
          className="border-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
          <p className="text-muted-foreground/70">/{company.slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-muted-foreground/70 text-xs uppercase">Users</p>
              <p className="text-2xl font-bold text-foreground">{company.users_count}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-muted-foreground/70 text-xs uppercase">Employees</p>
              <p className="text-2xl font-bold text-foreground">{company.employees_count}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <MapPin className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-muted-foreground/70 text-xs uppercase">Geofences</p>
              <p className="text-2xl font-bold text-foreground">{company.geofences_count}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground/70">Plan</p>
            <Badge className="mt-1 capitalize bg-card text-muted-foreground">{company.plan}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground/70">Status</p>
            <p className={`mt-1 ${company.active ? "text-primary" : "text-muted-foreground/70"}`}>
              {company.active ? "Active" : "Inactive"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground/70">Email</p>
            <p className="mt-1 text-muted-foreground">{company.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground/70">Phone</p>
            <p className="mt-1 text-muted-foreground">{company.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground/70">Industry</p>
            <p className="mt-1 text-muted-foreground">{company.industry ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground/70">Max Employees</p>
            <p className="mt-1 text-muted-foreground">{company.max_employees}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground/70">Address</p>
            <p className="mt-1 text-muted-foreground">{company.address ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Recent Employees</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-card/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentEmployees.map((emp: CompanyDetailEmployee) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-3 text-foreground">{emp.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.email}</td>
                  </tr>
                ))}
                {recentEmployees.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground/70">
                      No employees yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-background border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Company Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-card/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((user: CompanyDetailUser) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-foreground">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className="capitalize bg-card text-muted-foreground"
                      >
                        {user.role}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground/70">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
