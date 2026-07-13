"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { mastermindClient, type MastermindCompany } from "@/lib/services/mastermindClient";
import { Search, Plus, Building2, Pencil, Trash2 } from "lucide-react";

const plans = ["trial", "basic", "pro", "enterprise"];
const statuses = ["all", "active", "inactive", "trial"];

export default function MastermindCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<MastermindCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<MastermindCompany | null>(null);
  const [form, setForm] = useState<
    Partial<
      MastermindCompany & {
        admin_name: string;
        admin_email: string;
        admin_password: string;
        admin_role: string;
      }
    >
  >({
    name: "",
    email: "",
    phone: "",
    industry: "",
    address: "",
    plan: "trial",
    max_employees: 10,
    active: true,
    admin_name: "",
    admin_email: "",
    admin_password: "",
    admin_role: "manager",
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await mastermindClient.companies({ per_page: 500 });
      setCompanies(res.data);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
      const matchesPlan = planFilter === "all" || c.plan === planFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.active) ||
        (statusFilter === "inactive" && !c.active) ||
        (statusFilter === "trial" && c.plan === "trial");
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [companies, search, planFilter, statusFilter]);

  const openCreate = () => {
    setEditCompany(null);
    setCreatedAdmin(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      industry: "",
      address: "",
      plan: "trial",
      max_employees: 10,
      active: true,
      admin_name: "",
      admin_email: "",
      admin_password: "",
      admin_role: "manager",
    });
    setModalOpen(true);
  };

  const openEdit = (company: MastermindCompany) => {
    setEditCompany(company);
    setCreatedAdmin(null);
    setForm({
      ...company,
      admin_name: "",
      admin_email: "",
      admin_password: "",
      admin_role: "manager",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      toastError("Company email is required");
      return;
    }
    if (
      !editCompany &&
      (!form.admin_email || !form.admin_password || form.admin_password.length < 6)
    ) {
      toastError("Admin email and password are required (password must be at least 6 characters)");
      return;
    }
    setSaving(true);
    try {
      if (editCompany) {
        await mastermindClient.updateCompany(editCompany.id, form);
        toastSuccess("Company updated");
        setModalOpen(false);
        fetchData();
      } else {
        const res = await mastermindClient.createCompany(form);
        if (res.data?.admin) {
          setCreatedAdmin(res.data.admin);
        }
        toastSuccess("Company created");
        fetchData();
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await mastermindClient.deleteCompany(deleteId);
      toastSuccess("Company deleted");
      setDeleteId(null);
      fetchData();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Companies</h1>
          <p className="text-slate-500">Manage all Trax tenants.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Add Company
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-800">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-800">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 bg-slate-800" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50 text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Company</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium">Users</th>
                    <th className="text-left px-4 py-3 font-medium">Employees</th>
                    <th className="text-left px-4 py-3 font-medium">Geofences</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-slate-800/30 cursor-pointer"
                      onClick={() => router.push(`/ar/mastermind/companies/${company.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{company.name}</p>
                            <p className="text-xs text-slate-500">/{company.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className="capitalize bg-slate-800 text-slate-300"
                        >
                          {company.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{company.users_count ?? 0}</td>
                      <td className="px-4 py-3 text-slate-400">{company.employees_count ?? 0}</td>
                      <td className="px-4 py-3 text-slate-400">{company.geofences_count ?? 0}</td>
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
                      <td className="px-4 py-3 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openEdit(company)}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(company.id)}
                            className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        No companies found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editCompany ? "Edit Company" : createdAdmin ? "Company Ready" : "Add Company"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {editCompany
                ? "Update company details."
                : createdAdmin
                  ? "Share these credentials with the company admin."
                  : "Create a new Trax tenant."}
            </DialogDescription>
          </DialogHeader>

          {createdAdmin && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <p className="text-sm font-medium text-emerald-400">Admin account created</p>
              <div className="text-sm space-y-1 text-slate-200">
                <p>
                  <span className="text-slate-500">Name:</span> {createdAdmin.name}
                </p>
                <p>
                  <span className="text-slate-500">Email:</span> {createdAdmin.email}
                </p>
                <p>
                  <span className="text-slate-500">Role:</span>{" "}
                  <span className="capitalize">{createdAdmin.role}</span>
                </p>
                <p>
                  <span className="text-slate-500">Password:</span>{" "}
                  <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">
                    {createdAdmin.password}
                  </code>
                </p>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                They can log in at the main Trax login page with their email and this password.
              </p>
            </div>
          )}

          {!createdAdmin && (
            <form onSubmit={handleSave} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name ?? ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Optional"
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={form.industry ?? ""}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone ?? ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              {!editCompany && (
                <>
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-sm font-medium text-emerald-400 mb-2">
                      Initial Admin Account
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      The admin can log in and start adding staff right away.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Admin Name</Label>
                      <Input
                        value={form.admin_name ?? ""}
                        onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                        placeholder="Optional"
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Email</Label>
                      <Input
                        type="email"
                        value={form.admin_email ?? ""}
                        onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                        required={!editCompany}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Temporary Password</Label>
                      <Input
                        type="text"
                        value={form.admin_password ?? ""}
                        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                        required={!editCompany}
                        minLength={6}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Role</Label>
                      <Select
                        value={form.admin_role}
                        onValueChange={(v) => setForm({ ...form, admin_role: v })}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="boss">Boss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.address ?? ""}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Employees</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.max_employees ?? 10}
                    onChange={(e) => setForm({ ...form, max_employees: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={!!form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-600"
                />
                <Label htmlFor="active" className="text-sm text-slate-400">
                  Active
                </Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {createdAdmin && (
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setCreatedAdmin(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Done
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription className="text-slate-500">
              This will permanently delete the company and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting} variant="destructive">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
