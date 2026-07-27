"use client";

import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { firebaseData } from "@/lib/services/firebase";
import { queryKeys } from "@/hooks/api/queryKeys";
import { generateStaffUsername } from "@/lib/utils/staffOnboarding";
import type { Employee } from "@/lib/types/trackingTypes";
import { Upload } from "lucide-react";

interface BulkImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEmployees: Employee[];
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        current.push(value.trim());
        value = "";
      } else if (char === "\n") {
        if (value.length || current.length) {
          current.push(value.trim());
          rows.push(current);
          current = [];
          value = "";
        }
      } else if (char === "\r") {
        continue;
      } else {
        value += char;
      }
    }
  }

  if (value.length || current.length) {
    current.push(value.trim());
    rows.push(current);
  }

  return rows;
}

function generatePassword(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function BulkImportDrawer({ open, onOpenChange, existingEmployees }: BulkImportDrawerProps) {
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const existingEmails = useMemo(
    () => new Set(existingEmployees.map((e) => e.email.toLowerCase())),
    [existingEmployees]
  );

  const rows = useMemo(() => {
    if (!raw.trim()) return [];
    const all = parseCsv(raw);
    const header = all[0] ?? [];
    const lowerHeader = header.map((h) => h.toLowerCase().trim());

    const nameIdx = lowerHeader.findIndex((h) =>
      ["name", "الاسم", "full name", "الاسم الكامل"].includes(h)
    );
    const emailIdx = lowerHeader.findIndex((h) =>
      ["email", "البريد", "email address", "البريد الإلكتروني"].includes(h)
    );
    const phoneIdx = lowerHeader.findIndex((h) =>
      ["phone", "الهاتف", "mobile", "الجوال"].includes(h)
    );
    const deptIdx = lowerHeader.findIndex((h) => ["department", "القسم", "dept"].includes(h));

    const data = all.slice(1).filter((r) => r.some((c) => c.trim()));
    return data.map((cells, idx) => {
      const name = cells[nameIdx >= 0 ? nameIdx : 0]?.trim() ?? "";
      const email = cells[emailIdx >= 0 ? emailIdx : 1]?.trim().toLowerCase() ?? "";
      const phone = cells[phoneIdx >= 0 ? phoneIdx : 2]?.trim() ?? "";
      const department = cells[deptIdx >= 0 ? deptIdx : 3]?.trim() ?? "";
      const duplicate = email ? existingEmails.has(email) : false;
      const invalid = !email || !email.includes("@");
      return { id: idx, name, email, phone, department, duplicate, invalid };
    });
  }, [raw, existingEmails]);

  const validRows = rows.filter((r) => !r.duplicate && !r.invalid);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRaw(String(ev.target?.result ?? ""));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      toastError("لا يوجد صفوف صالحة للاستيراد");
      return;
    }

    setImporting(true);
    const failed: string[] = [];

    for (const row of validRows) {
      try {
        const password = generatePassword();
        const employeeNumber = generateStaffUsername({ name: row.name, email: row.email });
        await firebaseData.employees.create({
          name: row.name || row.email.split("@")[0],
          email: row.email,
          employeeNumber,
          phone: row.phone,
          department: row.department,
          role: "employee",
          geofenceId: "",
          attendanceMode: null,
          status: "active",
          password,
        });
      } catch {
        failed.push(row.email);
      }
    }

    setImporting(false);
    qc.invalidateQueries({ queryKey: queryKeys.employees });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });

    if (failed.length > 0) {
      toastError(`فشل استيراد ${failed.length} موظف`);
    } else {
      toastSuccess(`تم استيراد ${validRows.length} موظف`);
    }

    onOpenChange(false);
    setRaw("");
    setFileName("");
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="استيراد موظفين من CSV"
      description="ارفع ملف CSV يحتوي على الأعمدة: الاسم، البريد الإلكتروني، الهاتف، القسم"
    >
      <div className="space-y-4">
        <Input
          type="file"
          accept=".csv,.txt"
          ref={fileRef}
          onChange={handleFile}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="w-full"
        >
          <Upload className="w-4 h-4 me-2" /> اختيار ملف CSV
        </Button>
        {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}

        {rows.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-card text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-right">الاسم</th>
                    <th className="px-3 py-2 text-right">البريد</th>
                    <th className="px-3 py-2 text-right">القسم</th>
                    <th className="px-3 py-2 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={row.duplicate || row.invalid ? "bg-destructive/5" : ""}
                    >
                      <td className="px-3 py-2 text-foreground">{row.name || "—"}</td>
                      <td className="px-3 py-2 text-foreground" dir="ltr">
                        {row.email || "—"}
                      </td>
                      <td className="px-3 py-2 text-foreground">{row.department || "—"}</td>
                      <td className="px-3 py-2">
                        {row.duplicate ? (
                          <span className="text-destructive text-xs">مكرر</span>
                        ) : row.invalid ? (
                          <span className="text-destructive text-xs">بريد غير صالح</span>
                        ) : (
                          <span className="text-primary text-xs">جاهز</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={importing || validRows.length === 0}
            className="flex-1"
          >
            {importing ? "جاري الاستيراد..." : `استيراد ${validRows.length} موظف`}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            إلغاء
          </Button>
        </div>
      </div>
    </FormDrawer>
  );
}
