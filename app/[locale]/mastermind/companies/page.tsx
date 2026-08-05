"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { firebaseData } from "@/lib/services/firebaseData";
import type { CompanyListItem } from "@/lib/services/firebase/companies";
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
import { Shield, Building2, Plus, Loader2, Users, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

function formatCreatedAt(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(d);
}

function sourceLabel(
  source: CompanyListItem["signupSource"],
  t: ReturnType<typeof useTranslations>
): string {
  if (source === "self") return t("sourceSelf");
  if (source === "mastermind") return t("sourceMastermind");
  return t("sourceUnknown");
}

export default function MastermindCompaniesPage() {
  const params = useParams<{ locale: string }>();
  const intlLocale = useLocale();
  const locale = params?.locale ?? intlLocale;
  const t = useTranslations("MasterMind");
  const user = useAuthStore((s) => s.user);
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
    contactPhone: "",
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
  } = useQuery<CompanyListItem[]>({
    queryKey: ["mastermind", "companies"],
    queryFn: () => firebaseData.companies.list(),
    enabled: user?.role === "mastermind",
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const stats = useMemo(() => {
    const totalEmployees = companies.reduce((n, c) => n + (c.employeeCount || 0), 0);
    const totalGeofences = companies.reduce((n, c) => n + (c.geofenceCount || 0), 0);
    const selfSignups = companies.filter((c) => c.signupSource === "self").length;
    return {
      companies: companies.length,
      totalEmployees,
      totalGeofences,
      selfSignups,
    };
  }, [companies]);

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
        contact_phone: form.contactPhone.trim(),
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
        contactPhone: "",
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
    <div
      className="mx-auto max-w-6xl space-y-6 p-3 sm:space-y-8 sm:p-6 md:p-10"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="space-y-1">
        <div className="flex min-w-0 items-center gap-3">
          <Building2 className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
          <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
            {t("pageTitle")}
          </h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">{t("overviewHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t("totalCompanies"), value: stats.companies, icon: Building2 },
          { label: t("totalEmployees"), value: stats.totalEmployees, icon: Users },
          { label: t("totalGeofences"), value: stats.totalGeofences, icon: MapPin },
          { label: t("selfSignups"), value: stats.selfSignups, icon: Clock },
        ].map((item) => (
          <Card key={item.label} className="border-border/80">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
                <p className="truncate text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            {t("createCompanyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder={t("contactPhonePlaceholder")}
                dir="ltr"
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
                dir="ltr"
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
            <div className="flex items-end md:col-span-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full md:h-10 md:w-auto"
              >
                {isSubmitting && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t("creating") : t("createCompany")}
              </Button>
            </div>
          </form>

          {created && (
            <div className="mt-6 space-y-1 break-words rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 sm:p-4">
              <p>{t("companyCreatedSuccess")}</p>
              <p>{t("companyIdLabel", { id: created.companyId })}</p>
              <p dir="ltr">{t("companyEmailLabel", { email: created.email })}</p>
              <p dir="ltr">{t("companyPasswordLabel", { password: created.adminPassword })}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            {t("companiesList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : companies.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">{t("noCompanies")}</p>
          ) : (
            <>
              <ul className="divide-y divide-border md:hidden">
                {companies.map((company) => (
                  <li key={company.id} className="space-y-2 py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-foreground">{company.name}</p>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {sourceLabel(company.signupSource, t)}
                      </span>
                    </div>
                    <dl className="grid gap-1.5 text-sm">
                      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                        <dt className="text-xs text-muted-foreground">{t("tablePhone")}</dt>
                        <dd className="flex min-w-0 items-center gap-1 break-all" dir="ltr">
                          <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {company.contactPhone || "—"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                        <dt className="text-xs text-muted-foreground">{t("tableEmail")}</dt>
                        <dd className="flex min-w-0 items-center gap-1 break-all" dir="ltr">
                          <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {company.adminEmail || "—"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                        <dt className="text-xs text-muted-foreground">{t("tableCreated")}</dt>
                        <dd>{formatCreatedAt(company.createdAt, locale)}</dd>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <p className="text-lg font-bold tabular-nums">{company.employeeCount}</p>
                          <p className="text-[11px] text-muted-foreground">{t("tableEmployees")}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                          <p className="text-lg font-bold tabular-nums">{company.geofenceCount}</p>
                          <p className="text-[11px] text-muted-foreground">{t("tableGeofences")}</p>
                        </div>
                      </div>
                      <div className="pt-0.5 font-mono text-[11px] text-muted-foreground break-all">
                        {company.id}
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("tableName")}</TableHead>
                      <TableHead>{t("tablePhone")}</TableHead>
                      <TableHead>{t("tableEmail")}</TableHead>
                      <TableHead>{t("tableCreated")}</TableHead>
                      <TableHead className="text-center">{t("tableEmployees")}</TableHead>
                      <TableHead className="text-center">{t("tableGeofences")}</TableHead>
                      <TableHead>{t("tableSource")}</TableHead>
                      <TableHead>{t("tablePlan")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          <div className="min-w-0">
                            <p className="truncate">{company.name}</p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {company.id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell dir="ltr" className="whitespace-nowrap text-sm">
                          {company.contactPhone || "—"}
                        </TableCell>
                        <TableCell dir="ltr" className="max-w-[12rem] truncate text-sm">
                          {company.adminEmail || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatCreatedAt(company.createdAt, locale)}
                        </TableCell>
                        <TableCell className="text-center font-semibold tabular-nums">
                          {company.employeeCount}
                        </TableCell>
                        <TableCell className="text-center font-semibold tabular-nums">
                          {company.geofenceCount}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sourceLabel(company.signupSource, t)}
                        </TableCell>
                        <TableCell className="text-sm">{company.plan}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
