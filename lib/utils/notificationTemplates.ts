import type { NotificationType } from "@/lib/services/firebase/notifications";

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  variables: string[];
  priority: "low" | "normal" | "high";
  category: "attendance" | "leave" | "payroll" | "system" | "social" | "security" | "schedule";
  defaultEnabled: boolean;
  channels: ("push" | "in_app" | "email")[];
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // Attendance
  attendance: {
    type: "attendance",
    title: "Attendance Recorded",
    message: "{employeeName} checked in at {time}",
    variables: ["employeeName", "time", "location"],
    priority: "normal",
    category: "attendance",
    defaultEnabled: true,
    channels: ["in_app"],
  },
  check_in: {
    type: "check_in",
    title: "Check-in Confirmed",
    message: "You checked in at {time} at {location}",
    variables: ["time", "location"],
    priority: "normal",
    category: "attendance",
    defaultEnabled: true,
    channels: ["push", "in_app"],
  },
  late_arrival: {
    type: "late_arrival",
    title: "Late Arrival Alert",
    message: "{employeeName} arrived {minutes} minutes late at {time}",
    variables: ["employeeName", "minutes", "time", "expectedTime"],
    priority: "high",
    category: "attendance",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  check_out: {
    type: "check_out",
    title: "Check-out Recorded",
    message: "{employeeName} checked out at {time}",
    variables: ["employeeName", "time", "workedHours"],
    priority: "normal",
    category: "attendance",
    defaultEnabled: true,
    channels: ["in_app"],
  },
  check_out_early: {
    type: "check_out_early",
    title: "Early Check-out Alert",
    message: "{employeeName} checked out {minutes} minutes early at {time}",
    variables: ["employeeName", "minutes", "time", "expectedTime"],
    priority: "high",
    category: "attendance",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  overtime: {
    type: "overtime",
    title: "Overtime Alert",
    message: "{employeeName} worked {hours} hours of overtime this week",
    variables: ["employeeName", "hours", "period"],
    priority: "high",
    category: "attendance",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  absence: {
    type: "absence",
    title: "Absence Detected",
    message: "{employeeName} was absent on {date}",
    variables: ["employeeName", "date", "reason"],
    priority: "high",
    category: "attendance",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },

  // Geofence & Security
  geofence_breach: {
    type: "geofence_breach",
    title: "Geofence Breach",
    message: "{employeeName} checked in outside allowed area at {location}",
    variables: ["employeeName", "location", "distance"],
    priority: "high",
    category: "security",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  device_change: {
    type: "device_change",
    title: "New Device Login",
    message: "New device detected for {employeeName}: {device}",
    variables: ["employeeName", "device", "location"],
    priority: "high",
    category: "security",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  location_change: {
    type: "location_change",
    title: "Location Changed",
    message: "{employeeName} checked in from new location: {location}",
    variables: ["employeeName", "location", "previousLocation"],
    priority: "normal",
    category: "security",
    defaultEnabled: true,
    channels: ["in_app"],
  },

  // Schedule & Shifts
  shift_change: {
    type: "shift_change",
    title: "Shift Schedule Changed",
    message: "Your shift on {date} changed from {oldShift} to {newShift}",
    variables: ["date", "oldShift", "newShift", "reason"],
    priority: "high",
    category: "schedule",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  schedule_change: {
    type: "schedule_change",
    title: "Schedule Updated",
    message: "Your schedule for {period} has been updated",
    variables: ["period", "changes"],
    priority: "normal",
    category: "schedule",
    defaultEnabled: true,
    channels: ["push", "in_app"],
  },

  // Leave Management
  leave_request: {
    type: "leave_request",
    title: "Leave Request Submitted",
    message: "{employeeName} requested leave from {startDate} to {endDate}",
    variables: ["employeeName", "startDate", "endDate", "leaveType", "reason"],
    priority: "normal",
    category: "leave",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  leave_approved: {
    type: "leave_approved",
    title: "Leave Approved",
    message: "Your leave from {startDate} to {endDate} has been approved",
    variables: ["startDate", "endDate", "approverName"],
    priority: "normal",
    category: "leave",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  leave_rejected: {
    type: "leave_rejected",
    title: "Leave Rejected",
    message: "Your leave request from {startDate} to {endDate} was rejected",
    variables: ["startDate", "endDate", "rejectorName", "reason"],
    priority: "high",
    category: "leave",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },

  // Payroll & Documents
  payroll: {
    type: "payroll",
    title: "Payroll Notification",
    message: "Your payslip for {period} is ready",
    variables: ["period", "amount", "currency"],
    priority: "normal",
    category: "payroll",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  document: {
    type: "document",
    title: "Document Available",
    message: "New document '{documentName}' is available for you",
    variables: ["documentName", "category", "dueDate"],
    priority: "normal",
    category: "system",
    defaultEnabled: true,
    channels: ["push", "in_app"],
  },

  // Meetings & Training
  meeting: {
    type: "meeting",
    title: "Meeting Scheduled",
    message: "Meeting '{title}' scheduled for {date} at {time}",
    variables: ["title", "date", "time", "location", "organizer"],
    priority: "normal",
    category: "schedule",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  training: {
    type: "training",
    title: "Training Assigned",
    message: "You have been assigned training: {trainingName}",
    variables: ["trainingName", "dueDate", "duration"],
    priority: "normal",
    category: "schedule",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },

  // System & Policy
  system: {
    type: "system",
    title: "System Notification",
    message: "{message}",
    variables: ["message"],
    priority: "normal",
    category: "system",
    defaultEnabled: true,
    channels: ["in_app"],
  },
  announcement: {
    type: "announcement",
    title: "Company Announcement",
    message: "{title}: {message}",
    variables: ["title", "message"],
    priority: "high",
    category: "system",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  policy_update: {
    type: "policy_update",
    title: "Policy Updated",
    message: "Company policy '{policyName}' has been updated",
    variables: ["policyName", "effectiveDate", "summary"],
    priority: "normal",
    category: "system",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  maintenance: {
    type: "maintenance",
    title: "Scheduled Maintenance",
    message: "System maintenance scheduled for {date} from {startTime} to {endTime}",
    variables: ["date", "startTime", "endTime", "impact"],
    priority: "high",
    category: "system",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
  emergency: {
    type: "emergency",
    title: "EMERGENCY ALERT",
    message: "{message}",
    variables: ["message", "actionRequired", "contact"],
    priority: "high",
    category: "system",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },

  // Social & Recognition
  birthday: {
    type: "birthday",
    title: "Happy Birthday!",
    message: "Today is {employeeName}'s birthday! 🎉",
    variables: ["employeeName", "age"],
    priority: "low",
    category: "social",
    defaultEnabled: true,
    channels: ["push", "in_app"],
  },
  work_anniversary: {
    type: "work_anniversary",
    title: "Work Anniversary",
    message: "Congratulations {employeeName} on {years} years with us! 🎊",
    variables: ["employeeName", "years", "hireDate"],
    priority: "low",
    category: "social",
    defaultEnabled: true,
    channels: ["push", "in_app"],
  },
  performance_review: {
    type: "performance_review",
    title: "Performance Review Due",
    message: "Performance review for {employeeName} is due on {dueDate}",
    variables: ["employeeName", "dueDate", "reviewPeriod"],
    priority: "normal",
    category: "schedule",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },

  // Reminders
  reminder: {
    type: "reminder",
    title: "Reminder",
    message: "{message}",
    variables: ["message", "dueTime"],
    priority: "normal",
    category: "system",
    defaultEnabled: true,
    channels: ["push", "in_app"],
  },

  // Anomaly
  anomaly_detected: {
    type: "anomaly_detected",
    title: "Anomaly Detected",
    message: "Unusual pattern detected for {employeeName}: {details}",
    variables: ["employeeName", "details", "metric", "threshold"],
    priority: "high",
    category: "security",
    defaultEnabled: true,
    channels: ["push", "in_app", "email"],
  },
};

export function renderTemplate(
  type: NotificationType,
  variables: Record<string, string>
): { title: string; message: string } {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) {
    return { title: type, message: JSON.stringify(variables) };
  }

  let title = template.title;
  let message = template.message;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    title = title.replace(new RegExp(placeholder, "g"), value);
    message = message.replace(new RegExp(placeholder, "g"), value);
  }

  return { title, message };
}

export function getTemplatesByCategory(
  category: NotificationTemplate["category"]
): NotificationTemplate[] {
  return Object.values(NOTIFICATION_TEMPLATES).filter((t) => t.category === category);
}

export function getAllTemplates(): NotificationTemplate[] {
  return Object.values(NOTIFICATION_TEMPLATES);
}
