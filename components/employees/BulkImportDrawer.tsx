"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslations } from "next-intl";

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

export function BulkImportDrawer({ open, onOpenChange, existingEmployees }: BulkImportDrawerProps) {
  const t = useTranslations("Employees");
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!open) {
      setRaw("");
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

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
      ["name", t("nameHeader").toLowerCase(), "full name"].includes(h)
    );
    const emailIdx = lowerHeader.findIndex((h) =>
      ["email", t("emailHeader").toLowerCase(), "email address"].includes(h)
    );
    const phoneIdx = lowerHeader.findIndex((h) =>
      ["phone", t("phoneHeader").toLowerCase(), "mobile"].includes(h)
    );
    const deptIdx = lowerHeader.findIndex((h) =>
      ["department", t("departmentHeader").toLowerCase(), "dept"].includes(h)
    );

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
  }, [raw, existingEmails, t]);

  const validRows = rows.filter((r) => !r.duplicate && !r.invalid);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRaw(String(ev.target?.result ?? "").replace(/^\uFEFF/, ""));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      toastError(t("noValidRows"));
      return;
    }

    setImporting(true);

    try {
      const employees = validRows.map((row) => ({
        name: row.name || row.email.split("@")[0],
        email: row.email,
        employeeNumber: generateStaffUsername({ name: row.name, email: row.email }),
        phone: row.phone,
        department: row.department,
        geofenceId: "",
      }));

      await firebaseData.cloudFunctions.bulkCreateEmployees(employees);
      toastSuccess(t("importSuccess", { count: validRows.length }));
    } catch {
      toastError(t("importFailed"));
    }

    setImporting(false);
    qc.invalidateQueries({ queryKey: queryKeys.employees });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });

    onOpenChange(false);
    setRaw("");
    setFileName("");
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t("bulkImportTitle")}
      description={t("bulkImportDescription")}
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
          <Upload className="w-4 h-4 me-2" /> {t("chooseCsv")}
        </Button>
        {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}

        {rows.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-card text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-right">{t("nameHeader")}</th>
                    <th className="px-3 py-2 text-right">{t("emailHeader")}</th>
                    <th className="px-3 py-2 text-right">{t("departmentHeader")}</th>
                    <th className="px-3 py-2 text-right">{t("statusHeader")}</th>
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
                          <span className="text-destructive text-xs">{t("duplicate")}</span>
                        ) : row.invalid ? (
                          <span className="text-destructive text-xs">{t("invalidEmail")}</span>
                        ) : (
                          <span className="text-primary text-xs">{t("ready")}</span>
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
            {importing ? t("importing") : t("importEmployees", { count: validRows.length })}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    </FormDrawer>
  );
}
