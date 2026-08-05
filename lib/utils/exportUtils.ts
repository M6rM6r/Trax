import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const AMIRI_FONT_URL = "https://cdn.jsdelivr.net/gh/alef-type/amiri/Amiri-Regular.ttf";

let cachedFontBase64: string | null = null;

async function loadArabicFont(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;

  const response = await fetch(AMIRI_FONT_URL);
  const buffer = await response.arrayBuffer();
  const binary = Array.from(new Uint8Array(buffer))
    .map((b) => String.fromCharCode(b))
    .join("");
  cachedFontBase64 = btoa(binary);
  return cachedFontBase64;
}

function applyArabicFont(doc: jsPDF, fontBase64: string): void {
  doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.setFont("Amiri");
}

function formatWorkedHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return "";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatLateMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  if (!data.length) return;

  const keys = headers ? headers.map((h) => h.key) : (Object.keys(data[0]) as (keyof T)[]);
  const labels = headers ? headers.map((h) => h.label) : keys.map(String);

  const csvRows: string[] = [];
  csvRows.push(labels.join(","));

  for (const row of data) {
    const values = keys.map((key) => {
      const val = row[key];
      if (val === null || val === undefined) return "";
      let str: string;
      if (key === "workedHours") {
        str = formatWorkedHours(val as number);
      } else if (key === "lateMinutes") {
        str = formatLateMinutes(val as number);
      } else {
        str = String(val);
      }
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  title: string,
  headers?: { key: keyof T; label: string }[]
): Promise<void> {
  if (!data.length) return;

  const fontBase64 = await loadArabicFont();
  const doc = new jsPDF({ orientation: "landscape" });
  applyArabicFont(doc, fontBase64);

  doc.setFontSize(18);
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 20, { align: "right" });
  doc.setFontSize(10);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-US")}`,
    doc.internal.pageSize.getWidth() - 14,
    28,
    { align: "right" }
  );

  const keys = headers ? headers.map((h) => h.key) : (Object.keys(data[0]) as (keyof T)[]);
  const labels = headers ? headers.map((h) => h.label) : keys.map(String);

  const rows = data.map((row) =>
    keys.map((key) => {
      const val = row[key];
      if (val === null || val === undefined) return "-";
      return String(val);
    })
  );

  autoTable(doc, {
    head: [labels],
    body: rows,
    startY: 35,
    styles: { fontSize: 9, cellPadding: 3, font: "Amiri", halign: "right" },
    headStyles: { fillColor: [60, 126, 231], textColor: 255, halign: "right" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportAttendanceToCSV(
  records: Array<{
    employeeName: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: string;
    lateMinutes: number;
    workedHours: number | null;
    geofenceName?: string | null;
  }>
): void {
  exportToCSV(records, "attendance_report", [
    { key: "employeeName", label: "Employee" },
    { key: "date", label: "Date" },
    { key: "checkInTime", label: "Check In" },
    { key: "checkOutTime", label: "Check Out" },
    { key: "status", label: "Status" },
    { key: "lateMinutes", label: "Late (min)" },
    { key: "workedHours", label: "Worked (h)" },
    { key: "geofenceName", label: "Geofence" },
  ]);
}

export async function exportAttendanceToPDF(
  records: Array<{
    employeeName: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: string;
    lateMinutes: number;
    workedHours: number | null;
    geofenceName?: string | null;
  }>
): Promise<void> {
  await exportToPDF(records, "attendance_report", "Attendance Report", [
    { key: "employeeName", label: "Employee" },
    { key: "date", label: "Date" },
    { key: "checkInTime", label: "Check In" },
    { key: "checkOutTime", label: "Check Out" },
    { key: "status", label: "Status" },
    { key: "lateMinutes", label: "Late (min)" },
    { key: "workedHours", label: "Worked (h)" },
    { key: "geofenceName", label: "Geofence" },
  ]);
}

export function exportEmployeesToCSV(
  records: Array<{
    name: string;
    email: string;
    phone: string;
    department: string;
    status: string;
  }>
): void {
  exportToCSV(records, "employees_list", [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "status", label: "Status" },
  ]);
}

export async function exportEmployeesToPDF(
  records: Array<{
    name: string;
    email: string;
    phone: string;
    department: string;
    status: string;
  }>
): Promise<void> {
  await exportToPDF(records, "employees_list", "Employees List", [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "status", label: "Status" },
  ]);
}
