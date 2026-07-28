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

interface CompanyResult {
  id: string;
  name: string;
  plan: string;
  industry: string;
}

export default function MastermindCompaniesPage() {
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
  });

  if (user?.role !== "mastermind") {
    return (
      <AccessDeniedCard
        icon={Shield}
        title="وصول محظور"
        message="هذه الصفحة مخصصة فقط للمسؤول العام (Mastermind)."
        ctaLabel="تسجيل الدخول"
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
        title: "بيانات ناقصة",
        description: "اسم الشركة والبريد الإلكتروني وكلمة المرور للمدير مطلوبة.",
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
        title: "تم إنشاء الشركة",
        description: `تم إنشاء ${form.name} ومديرها ${form.adminEmail}`,
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
      const message = err instanceof Error ? err.message : "فشل في إنشاء الشركة";
      toast({
        title: "خطأ",
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
        <h1 className="text-2xl font-bold text-foreground">لوحة MasterMind - الشركات</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إنشاء شركة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الشركة</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="مثال: Trax Demo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">القطاع</Label>
              <Input
                id="industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="مثال: Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">اسم المدير</Label>
              <Input
                id="adminName"
                name="adminName"
                value={form.adminName}
                onChange={handleChange}
                placeholder="مثال: Mohammed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">بريد المدير</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={handleChange}
                placeholder="admin@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">كلمة مرور المدير</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="text"
                value={form.adminPassword}
                onChange={handleChange}
                placeholder="كلمة مرور مؤقتة"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">الخطة</Label>
              <Input
                id="plan"
                name="plan"
                value={form.plan}
                onChange={handleChange}
                placeholder="trial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxEmployees">الحد الأقصى للموظفين</Label>
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
                إنشاء الشركة
              </Button>
            </div>
          </form>

          {created && (
            <div className="mt-6 p-4 rounded-lg bg-green-50 text-green-900 border border-green-200">
              <p className="font-semibold">تم إنشاء الشركة بنجاح</p>
              <p className="text-sm mt-1">اسم الشركة: {created.companyId}</p>
              <p className="text-sm">البريد: {created.email}</p>
              <p className="text-sm">كلمة المرور: {created.adminPassword}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            الشركات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">لا توجد شركات بعد.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>القطاع</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>المعرف</TableHead>
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
