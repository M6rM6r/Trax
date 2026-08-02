"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import AccessDeniedCard from "@/components/shared/AccessDeniedCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Building2, Plus, Loader2, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompanyResult {
  id: string;
  name: string;
  plan: string;
  industry: string;
}

export default function MastermindCompaniesPage() {
  const t = useTranslations("MasterMind");
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    companyId: string;
    adminUid: string;
    email: string;
    adminPassword: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    adminEmail: "",
    adminName: "",
    adminPassword: "",
    plan: "trial",
    maxEmployees: "10",
  });

  const {
    data: companies = [],
    isLoading,
    refetch,
  } = useQuery<CompanyResult[]>({
    queryKey: ["mastermind", "companies"],
    queryFn: () => firebaseData.companies.list(),
    enabled: user?.role === "mastermind",
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });

  if (user?.role !== "mastermind") {
    return (
      <AccessDeniedCard
        icon={Shield}
        title={t("accessDeniedTitle")}
        message={t("accessDeniedMessage")}
        ctaLabel={t("accessDeniedCTA")}
        ctaHref="/ar/login"
      />
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.adminEmail.trim() || !form.adminPassword.trim()) {
      toast({
        title: t("missingData"),
        description: t("missingDataDescription"),
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await firebaseData.cloudFunctions.createCompany({
        name: form.name.trim(),
        industry: form.industry.trim(),
        admin_email: form.adminEmail.trim(),
        admin_name: form.adminName.trim(),
        admin_password: form.adminPassword.trim(),
        plan: form.plan.trim() || "trial",
        maxEmployees: Number(form.maxEmployees) || 10,
      });
      setCreated(result);
      toast({
        title: t("companyCreated"),
        description: t("companyCreatedDescription", { name: form.name, email: form.adminEmail }),
      });
      setForm({
        name: "",
        industry: "",
        adminEmail: "",
        adminName: "",
        adminPassword: "",
        plan: "trial",
        maxEmployees: "10",
      });
      await refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("createCompanyError");
      toast({
        title: t("errorTitle"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div className="flex items-center gap-3">
        <Building2 className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t("pageTitle")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t("createCompanyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("companyName")}</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("companyNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">{t("industry")}</Label>
              <Input
                id="industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder={t("industryPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">{t("adminName")}</Label>
              <Input
                id="adminName"
                name="adminName"
                value={form.adminName}
                onChange={handleChange}
                placeholder={t("adminNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">{t("adminEmail")}</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={handleChange}
                placeholder={t("adminEmailPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">{t("adminPassword")}</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="text"
                value={form.adminPassword}
                onChange={handleChange}
                placeholder={t("adminPasswordPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">{t("plan")}</Label>
              <Input
                id="plan"
                name="plan"
                value={form.plan}
                onChange={handleChange}
                placeholder={t("planPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxEmployees">{t("maxEmployees")}</Label>
              <Input
                id="maxEmployees"
                name="maxEmployees"
                type="number"
                value={form.maxEmployees}
                onChange={handleChange}
                placeholder="10"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                {isSubmitting ? t("creating") : t("createCompany")}
              </Button>
            </div>
          </form>

          {created && (
            <div className="mt-6 p-4 rounded-lg bg-green-50 text-green-900 border border-green-200">
              <p className="font-semibold">{t("companyCreatedSuccess")}</p>
              <p className="text-sm mt-1">{t("companyIdLabel", { id: created.companyId })}</p>
              <p className="text-sm">{t("companyEmailLabel", { email: created.email })}</p>
              <p className="text-sm">
                {t("companyPasswordLabel", { password: created.adminPassword })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("companiesList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">{t("noCompanies")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableName")}</TableHead>
                  <TableHead>{t("tableIndustry")}</TableHead>
                  <TableHead>{t("tablePlan")}</TableHead>
                  <TableHead>{t("tableId")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry || "—"}</TableCell>
                    <TableCell>{company.plan}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{company.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
