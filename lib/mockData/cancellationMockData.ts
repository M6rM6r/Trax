// Mock data for cancellation management
// This will be replaced with real API calls later

export interface CancellationReason {
  id: number;
  service_type: string | string[];
  reason_ar: string;
  reason_en: string;
  audience: "user" | "captain";
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CancellationStatistics {
  total_cancellations: number;
  user_cancellations: number;
  captain_cancellations: number;
  top_service: {
    name: string;
    count: number;
  };
  cancellations_by_service: Array<{
    service_type: string;
    count: number;
    percentage: number;
  }>;
  top_reasons: Array<{
    reason: string;
    count: number;
    audience: "user" | "captain";
  }>;
  high_frequency_users: Array<{
    id: number;
    name: string;
    total_cancellations: number;
    last_cancellation: string;
  }>;
  high_frequency_captains: Array<{
    id: number;
    name: string;
    total_cancellations: number;
    last_cancellation: string;
  }>;
}

// Mock cancellation reasons data
export const mockCancellationReasons: CancellationReason[] = [
  // User reasons - Taxi
  {
    id: 1,
    service_type: "taxi",
    reason_ar: "السائق تأخر كثيراً",
    reason_en: "Driver arrived late",
    audience: "user",
    is_active: true,
    sort_order: 1,
    created_at: "2024-01-15",
  },
  {
    id: 2,
    service_type: "taxi",
    reason_ar: "غيرت رأيي",
    reason_en: "Changed my mind",
    audience: "user",
    is_active: true,
    sort_order: 2,
    created_at: "2024-01-15",
  },
  {
    id: 3,
    service_type: "taxi",
    reason_ar: "وجدت وسيلة نقل أخرى",
    reason_en: "Found another transport",
    audience: "user",
    is_active: true,
    sort_order: 3,
    created_at: "2024-01-15",
  },
  {
    id: 4,
    service_type: "taxi",
    reason_ar: "السعر مرتفع جداً",
    reason_en: "Price too high",
    audience: "user",
    is_active: false,
    sort_order: 4,
    created_at: "2024-01-15",
  },

  // Captain reasons - Taxi
  {
    id: 5,
    service_type: "taxi",
    reason_ar: "العميل لا يرد على الهاتف",
    reason_en: "Customer not answering",
    audience: "captain",
    is_active: true,
    sort_order: 1,
    created_at: "2024-01-15",
  },
  {
    id: 6,
    service_type: "taxi",
    reason_ar: "الموقع بعيد جداً",
    reason_en: "Location too far",
    audience: "captain",
    is_active: true,
    sort_order: 2,
    created_at: "2024-01-15",
  },
  {
    id: 7,
    service_type: "taxi",
    reason_ar: "ظروف طارئة",
    reason_en: "Emergency situation",
    audience: "captain",
    is_active: true,
    sort_order: 3,
    created_at: "2024-01-15",
  },

  // User reasons - Fontas
  {
    id: 8,
    service_type: "fontas",
    reason_ar: "تأخر وصول السائق",
    reason_en: "Driver delayed",
    audience: "user",
    is_active: true,
    sort_order: 1,
    created_at: "2024-01-15",
  },
  {
    id: 9,
    service_type: "fontas",
    reason_ar: "لم أعد بحاجة للخدمة",
    reason_en: "No longer need service",
    audience: "user",
    is_active: true,
    sort_order: 2,
    created_at: "2024-01-15",
  },

  // Captain reasons - Fontas
  {
    id: 10,
    service_type: "fontas",
    reason_ar: "كمية الوقود المطلوبة غير متوفرة",
    reason_en: "Fuel quantity unavailable",
    audience: "captain",
    is_active: true,
    sort_order: 1,
    created_at: "2024-01-15",
  },
  {
    id: 11,
    service_type: "fontas",
    reason_ar: "العميل ألغى الطلب",
    reason_en: "Customer cancelled",
    audience: "captain",
    is_active: true,
    sort_order: 2,
    created_at: "2024-01-15",
  },

  // User reasons - Wensh
  {
    id: 12,
    service_type: "wensh",
    reason_ar: "وجدت خدمة ونش أخرى",
    reason_en: "Found another towing service",
    audience: "user",
    is_active: true,
    sort_order: 1,
    created_at: "2024-01-15",
  },
  {
    id: 13,
    service_type: "wensh",
    reason_ar: "تم حل المشكلة",
    reason_en: "Problem solved",
    audience: "user",
    is_active: true,
    sort_order: 2,
    created_at: "2024-01-15",
  },

  // Captain reasons - Wensh
  {
    id: 14,
    service_type: "wensh",
    reason_ar: "السيارة لا يمكن سحبها",
    reason_en: "Vehicle cannot be towed",
    audience: "captain",
    is_active: true,
    sort_order: 1,
    created_at: "2024-01-15",
  },
  {
    id: 15,
    service_type: "wensh",
    reason_ar: "الموقع غير آمن",
    reason_en: "Location unsafe",
    audience: "captain",
    is_active: true,
    sort_order: 2,
    created_at: "2024-01-15",
  },
];

// Mock statistics data
export const mockCancellationStatistics: CancellationStatistics = {
  total_cancellations: 1247,
  user_cancellations: 823,
  captain_cancellations: 424,
  top_service: {
    name: "تاكسي",
    count: 687,
  },
  cancellations_by_service: [
    { service_type: "taxi", count: 687, percentage: 55.1 },
    { service_type: "fontas", count: 312, percentage: 25.0 },
    { service_type: "wensh", count: 158, percentage: 12.7 },
    { service_type: "light_transportation", count: 90, percentage: 7.2 },
  ],
  top_reasons: [
    { reason: "السائق تأخر كثيراً", count: 245, audience: "user" },
    { reason: "غيرت رأيي", count: 198, audience: "user" },
    { reason: "العميل لا يرد على الهاتف", count: 167, audience: "captain" },
    { reason: "وجدت وسيلة نقل أخرى", count: 134, audience: "user" },
    { reason: "الموقع بعيد جداً", count: 112, audience: "captain" },
    { reason: "ظروف طارئة", count: 89, audience: "captain" },
    { reason: "السعر مرتفع جداً", count: 76, audience: "user" },
    { reason: "لم أعد بحاجة للخدمة", count: 54, audience: "user" },
  ],
  high_frequency_users: [
    { id: 101, name: "أحمد محمد", total_cancellations: 15, last_cancellation: "2024-12-08" },
    { id: 102, name: "فاطمة علي", total_cancellations: 12, last_cancellation: "2024-12-09" },
    { id: 103, name: "محمد سعيد", total_cancellations: 11, last_cancellation: "2024-12-07" },
    { id: 104, name: "سارة أحمد", total_cancellations: 10, last_cancellation: "2024-12-10" },
    { id: 105, name: "خالد عبدالله", total_cancellations: 9, last_cancellation: "2024-12-06" },
    { id: 106, name: "نورة محمد", total_cancellations: 8, last_cancellation: "2024-12-09" },
    { id: 107, name: "عبدالرحمن خالد", total_cancellations: 8, last_cancellation: "2024-12-05" },
    { id: 108, name: "ريم سعود", total_cancellations: 7, last_cancellation: "2024-12-08" },
  ],
  high_frequency_captains: [
    { id: 201, name: "عبدالله أحمد", total_cancellations: 23, last_cancellation: "2024-12-10" },
    { id: 202, name: "سعيد محمد", total_cancellations: 19, last_cancellation: "2024-12-09" },
    { id: 203, name: "علي حسن", total_cancellations: 17, last_cancellation: "2024-12-08" },
    { id: 204, name: "يوسف عبدالله", total_cancellations: 14, last_cancellation: "2024-12-10" },
    { id: 205, name: "ماجد سالم", total_cancellations: 12, last_cancellation: "2024-12-07" },
    { id: 206, name: "فهد عبدالعزيز", total_cancellations: 11, last_cancellation: "2024-12-09" },
    { id: 207, name: "طارق محمود", total_cancellations: 10, last_cancellation: "2024-12-06" },
    { id: 208, name: "وليد صالح", total_cancellations: 9, last_cancellation: "2024-12-08" },
  ],
};

// Service types for dropdowns
export const serviceTypes = [
  { id: "taxi", name_ar: "تاكسي", name_en: "Taxi" },
  { id: "fontas", name_ar: "فنطاس", name_en: "Fontas" },
  { id: "wensh", name_ar: "ونش", name_en: "Wensh" },
  { id: "light_transportation", name_ar: "نقل خفيف", name_en: "Light Transportation" },
];
