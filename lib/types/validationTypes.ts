// import { useTranslations } from "next-intl";
import * as Yup from "yup";

// const t = useTranslations();

// export const loginSchema = Yup.object({
//   email: Yup.string()
//     .email("البريد الإلكتروني غير صحيح")
//     .required("البريد الإلكتروني مطلوب"),
//   password: Yup.string()
//     .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
//     .required("كلمة المرور مطلوبة"),
// });

// export const createSchema  = ()=>{
//     const t = useTranslations()
//     return
// }

export const validationSchemaBasic = Yup.object({
  image: Yup.mixed()
    .nullable()
    .test(
      "fileType",
      "يجب أن يكون الملف من نوع صورة (JPG, JPEG, PNG)",
      (value) => {
        if (!value) return true; // Handle case where no file is selected
        if (value instanceof File) {
          return ["image/jpeg", "image/png", "image/jpg"].includes(value.type);
        }
        return true; // If it's not a File object (might be from server)
      }
    )
    .test("fileSize", "حجم الصورة كبير جداً، الحد الأقصى 5MB", (value) => {
      if (!value) return true;
      if (value instanceof File) {
        return value.size <= 5 * 1024 * 1024; // 5MB
      }
      return true;
    }),
  name: Yup.string()
    .required("الاسم مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل"),
  gender: Yup.string().required("الجنس مطلوب"),
  mobile: Yup.string().required("رقم الجوال مطلوب"),
  country_code: Yup.string().required("رقم الجوال مطلوب"),
  phone: Yup.string().required("رقم الجوال مطلوب"),
});

export const validationForRoles = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل"),
  permissions: Yup.array().required("الصلاحيات مطلوبة"),
});

export const validationForUsers = Yup.object({
  name: Yup.string()
    .required("الاسم مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل"),
  email: Yup.string()
    .email("البريد الالكتروني غير صحيح")
    .required("البريد الالكتروني مطلوب"),
  password: Yup.string().required("كلمة المرور مطلوبة"),
  confirmPassword: Yup.string()
    .required("تاكيد كلمة المرور مطلوب")
    .oneOf([Yup.ref("password"), ""], "كلمة المرور غير متطابقة"),
  role: Yup.string().required("الدور مطلوب"),
});

export const validationForRules = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(30, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(30, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  description_ar: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(200, "الوصف يجب ان يكون مكون من 300 حروف على الاقل"),
  description_en: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(200, "الوصف يجب ان يكون مكون من 300 حروف على الاقل"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});

export const validationForBrands = Yup.object({
  name_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  name_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});

export const validationForModels = Yup.object({
  name_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  name_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  brand_id: Yup.number().positive("الماركة مطلوبة"),
  type: Yup.string().required("النوع مطلوب"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});
export const validationForColors = Yup.object({
  name_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  name_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  hex: Yup.string().required("اللون مطلوب"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});
export const validationForUnits = Yup.object({
  type: Yup.string().required("النوع مطلوب"),
  unit: Yup.string().required("الوحدة مطلوبة"),
  value: Yup.number().positive("القيمة مطلوبة"),
  is_active: Yup.string().required("الحالة مطلوبة"),
});

export const validationForPeakTimes = Yup.object({
  day: Yup.string().required("اليوم مطلوب"),
  startTime: Yup.string().required("وقت البدء مطلوب"),
  endTime: Yup.string().required("وقت النهاية مطلوب"),
  priceKilo: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(100, "السعر بالكيلو يجب ألا يتجاوز 100")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => !String(value).includes("-")
    )
    .required("السعر بالكيلو مطلوب"),

  minuteKilo: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(100, "السعر بالدقيقة يجب ألا يتجاوز 100")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => !String(value).includes("-")
    )
    .required("السعر بالدقيقة مطلوب"),

  fixedPrice: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(100, "السعر الثابت يجب ألا يتجاوز 100")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => !String(value).includes("-")
    )
    .required("السعر الثابت مطلوب"),

  minPrice: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(100, "السعر الأدنى يجب ألا يتجاوز 100")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => value === undefined || !String(value).includes("-")
    ),

  waitingTime: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(100, "وقت الانتظار يجب ألا يتجاوز 100")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => value === undefined || !String(value).includes("-")
    ),

  cancelTime: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(100, "وقت الإلغاء يجب ألا يتجاوز 100")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => value === undefined || !String(value).includes("-")
    )
    .required("وقت الإلغاء مطلوب"),

  // Fontas-specific fields (optional)
  freeKm: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(1000, "الكيلوات المجانية يجب ألا تتجاوز 1000")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => value === undefined || !String(value).includes("-")
    ),

  cancellationTime: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .max(1440, "وقت الإلغاء يجب ألا يتجاوز 1440 دقيقة")
    .test(
      "no-negative",
      "لا يمكن إدخال أرقام سالبة",
      (value) => value === undefined || !String(value).includes("-")
    ),
});

export const validationForPrices = Yup.object({
  price_per_km: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "السعر بالكيلو لا يمكن أن يكون رقما سالبا")
    .max(100, "السعر بالكيلو يجب ألا يتجاوز 100"),
  price_per_minute: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "السعر بالدقيقة لا يمكن أن يكون رقما سالبا")
    .max(100, "السعر بالدقيقة يجب ألا يتجاوز 100"),
  base_price: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "السعر الثابت لا يمكن أن يكون رقما سالبا"),
  minimum_charge: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "السعر الأدنى لا يمكن أن يكون رقما سالبا")
    .max(100, "السعر الأدنى يجب ألا يتجاوز 100"),
  waiting_cost: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "وقت الانتظار لا يمكن أن يكون رقما سالبا")
    .max(100, "وقت الانتظار يجب ألا يتجاوز 100"),
  cancellation_cost: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "وقت الإلغاء لا يمكن أن يكون رقما سالبا")
    .max(100, "وقت الإلغاء يجب ألا يتجاوز 100"),
  additional_time_price: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر الوقت الإضافي لا يمكن أن يكون رقما سالبا")
    .max(1000, "سعر الوقت الإضافي يجب ألا يتجاوز 1000"),
});
export const validationForPricesFuel = Yup.object({
  service_price: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر الخدمة لا يمكن أن يكون رقما سالبا")
    .max(100, "سعر الخدمة يجب ألا يتجاوز 100"),
  fuel_91_price: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر البنزين 91 لا يمكن أن يكون رقما سالبا")
    .max(100, "سعر البنزين يجب ألا يتجاوز 100"),
  fuel_95_price: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر البنزين 95 لا يمكن أن يكون رقما سالبا")
    .max(100, "سعر البنزين يجب ألا يتجاوز 100"),
  dezel_price: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر الديزل لا يمكن أن يكون رقما سالبا")
    .max(100, "سعر الديزيل يجب ألا يتجاوز 100"),
  price_per_km: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر الكيلو لا يمكن أن يكون رقما سالبا")
    .max(100, "السعر بالكيلو يجب ألا يتجاوز 100"),
  price_per_minute: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر الدقيقة لا يمكن أن يكون رقما سالبا")
    .max(100, "السعر بالدقيقة يجب ألا يتجاوز 100"),
  base_price: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .positive("سعر الثابت يجب أن يكون رقما موجبا")
    .max(100, "السعر الثابت يجب ألا يتجاوز 100"),
  minimum_charge: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "السعر الأدنى لا يمكن أن يكون رقما سالبا")
    .max(100, "السعر الأدنى يجب ألا يتجاوز 100"),
  waiting_cost: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "وقت الانتظار لا يمكن أن يكون رقما سالبا")
    .max(100, "وقت الانتظار يجب ألا يتجاوز 100"),
  cancellation_cost: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "سعر الخدمة لا يمكن أن يكون رقما سالبا")
    .max(100, "وقت الإلغاء يجب ألا يتجاوز 100"),
});
export const validationForAppPercentage = Yup.object({
  percentage: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "النسبة المئوية لا يمكن أن تكون رقمًا سالبًا")
    .max(100, "النسبة المئوية يجب ألا تتجاوز 100"),
});

export const validationForLabels = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاكثر"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاكثر"),
  description_ar: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(200, "الوصف يجب ان يكون مكون من 300 حروف على الاكثر"),
  description_en: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(200, "الوصف يجب ان يكون مكون من 300 حروف على الاكثر"),
  color: Yup.string().required("اللون مطلوب"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});

export const validationForNotifications = Yup.object({
  user_type: Yup.string().required("نوع المستخدم مطلوب"),
  title: Yup.string()
    .required("العنوان مطلوب")
    .min(3, "العنوان يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "العنوان يجب ان لا يزيد عن 50 حرفًا"), // Fixed message to reflect max limit
  body: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(200, "الوصف يجب ان لا يزيد عن 200 حرفًا"), // Fixed message to reflect max limit
});

export const validationForPages = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  description_ar: Yup.string()
    .required("الوصف مطلوب")
    .test(
      "min-text-length",
      "الوصف يجب ان يكون مكون من 3 حروف على الاقل",
      (value) => {
        if (!value) return false;
        // Strip HTML tags and check plain text length
        const plainText = value.replace(/<[^>]*>/g, "").trim();
        return plainText.length >= 3;
      }
    )
    .test(
      "max-text-length",
      "الوصف يجب ان لا يزيد عن 5000 حرف",
      (value) => {
        if (!value) return true;
        // Strip HTML tags and check plain text length
        const plainText = value.replace(/<[^>]*>/g, "").trim();
        return plainText.length <= 5000;
      }
    ),
  description_en: Yup.string()
    .required("الوصف مطلوب")
    .test(
      "min-text-length",
      "الوصف يجب ان يكون مكون من 3 حروف على الاقل",
      (value) => {
        if (!value) return false;
        // Strip HTML tags and check plain text length
        const plainText = value.replace(/<[^>]*>/g, "").trim();
        return plainText.length >= 3;
      }
    )
    .test(
      "max-text-length",
      "الوصف يجب ان لا يزيد عن 5000 حرف",
      (value) => {
        if (!value) return true;
        // Strip HTML tags and check plain text length
        const plainText = value.replace(/<[^>]*>/g, "").trim();
        return plainText.length <= 5000;
      }
    ),
  app: Yup.string().required("نوع التطبيق"),
  type: Yup.string().required("نوع الصفحة"),
  is_active: Yup.string().required("الحالة مطلوبة"),
});
export const validationForBanners = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  target_url: Yup.string().optional(),
  order: Yup.number().required("الترتيب مطلوب"),
  app: Yup.string().required("نوع التطبيق"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});

export const validationForChangingComplaintPriority = Yup.object({
  priority: Yup.string().required("الأولوية مطلوب"),
});

export const validationForTeams = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  is_active: Yup.number().required("الحالة مطلوبة"),
  categories: Yup.array()
    .of(Yup.string().required("يجب أن يحتوي كل تصنيف على قيمة")) // Ensures each item in the array is a non-empty string
    .min(1, "يجب اختيار تصنيف واحد على الأقل") // Ensures the array has at least one item
    .required("التصنيفات مطلوبة"), // Ensures the field itself is required
  manager: Yup.string().required("المدير مطلوب"),
  members: Yup.array()
    .of(Yup.string().required("يجب أن يحتوي كل عضو على قيمة"))
    .min(1, "يجب اختيار عضو واحد على الأقل")
    .required("الأعضاء مطلوبة"),
});
export const validationForAction = Yup.object({
  name_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  name_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});
export const validationForCategory = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});
export const validationForType = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاقل"),
  description_ar: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الوصف يجب ان يكون مكون من 50 حروف على الاقل"),
  description_en: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الوصف يجب ان يكون مكون من 50 حروف على الاقل"),
  attachments_types: Yup.array()
    .of(Yup.string().required("يجب ان يحتوي علي قيمه"))
    .min(1, "يجب اختيار مرفق واحد علي الاقل")
    .required("نوع المرفقات مطلوب"),
  services: Yup.array()
    .of(Yup.string().required("يجب أن يحتوي كل خدمة على قيمة"))
    .min(1, "يجب اختيار خدمة واحدة على الأقل")
    .required("الخدمات مطلوبة"),
  app: Yup.array()
    .of(Yup.string().required("يجب أن يحتوي نوع التطبيق على قيمة"))
    .min(1, "يجب اختيار نوع واحد على الأقل")
    .required("نوع التطبيق مطلوب"),
  team_id: Yup.string().required("الفريق مطلوب"),
  disciplinary_actions: Yup.array()
    .of(Yup.string().required("يجب أن يحتوي كل اجراء على قيمة"))
    .min(1, "يجب اختيار اجراء واحد على الأقل")
    .required("الاجراءات مطلوبة"),
  ride_related: Yup.boolean().required("ربط الرحلة مطلوب"),
  is_active: Yup.number().required("الحالة مطلوبة"),
});
export const validationForComplaint = Yup.object({
  complaintable_type: Yup.string().required(" مطلوب مقدم الشكوى"),
  complaintable_id: Yup.string().required(" اختر راكب"),
  priority: Yup.string().required("  الاولوية مطلوبة"),
  ride_id: Yup.string().required("ربط الرحلة مطلوب"),
  discription: Yup.string().required("الوصف مطلوب"),
  compliant_source: Yup.string().required("تفصيل الشكوى مطلوب"),
  notes: Yup.string().required("الملاحظات مطلوبة"),
  category_id: Yup.string().required("التصنيف مطلوب"),
  files: Yup.array().required("الملفات مطلوبة"),
});

export const validationForFuelTool = Yup.object({
  title_ar: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاكثر"),
  title_en: Yup.string()
    .required("الاسم مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل")
    .max(50, "الاسم يجب ان يكون مكون من 50 حروف على الاكثر"),
  description_ar: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(200, "الوصف يجب ان يكون مكون من 300 حروف على الاكثر"),
  description_en: Yup.string()
    .required("الوصف مطلوب")
    .min(3, "الوصف يجب ان يكون مكون من 3 حروف على الاقل")
    .max(200, "الوصف يجب ان يكون مكون من 300 حروف على الاكثر"),
});
