# سائقي العطالات (Outages/Fast Support Drivers)

## نظرة عامة

سائقي العطالات (الدعم السريع) هم السائقين الذين يقدمون خدمات الطوارئ والمساعدة على الطريق. يشمل ذلك:
- **الوقود (Fuel):** تزويد الوقود
- **الإطارات (Tires):** تغيير وإصلاح الإطارات
- **السحب (Towing):** سحب المركبات المعطلة

- **المسار:** `/services/outages`
- **نوع المركبة:** `fast_support`
- **عدد الخطوات:** 3 خطوات
- **يتطلب WASL:** لا (يتم التسجيل مباشرة بدون تحقق)

---

## أنواع العطالات

| النوع | المسار | الوصف |
|-------|--------|-------|
| الوقود | `/services/outages/fuel` | خدمة تزويد الوقود |
| الإطارات | `/services/outages/tires` | خدمة الإطارات |
| السحب | `/services/outages/towing` | خدمة سحب المركبات |

كل نوع له:
- صفحة السائقين: `/drivers/outages/{type}`
- الطلبات: `/services/outages/{type}/orders`
- الإعدادات: `/services/outages/{type}/settings`
- الأدوات: `/services/outages/{type}/tools`

---

## نموذج إنشاء سائق عطالات

**المكون:** `components/outages/EditDriverOutages/index.tsx`

### الخطوة 1: بيانات الخدمة (Service Data)

**المكون:** `components/outages/EditDriverOutages/Step1.tsx`

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `vehicleType` (brand_id) | `select` | نعم | نوع المركبة (الماركة) |
| `vehicleModel` (car_model_id) | `select` | نعم | طراز المركبة |
| `vehicleColor` (color_id) | `select` | نعم | لون المركبة |
| `seatsNumber` | `select (1-6)` | نعم | عدد المقاعد |
| `rules[]` | `checkbox` | لا | القواعد الخاصة |
| `importantAppointments` | `switch (0/1)` | لا | متاح للمواعيد المهمة |

**API Call:**
```
POST /drivers/setService
Content-Type: multipart/form-data

user_id: number
vehicle_type: "fast_support"
brand_id: number
car_model_id: number
color_id: number
seats_number: number
rules[]: number[] (optional)
available_for_important_dates: 0 | 1
identity_number: string (optional)
date_of_birth: YYYY-MM-DD (optional)
plate_type: number (optional)
sequence_number: string (optional)
plate_number: string (optional)
plate_letter_right: string (optional)
plate_letter_middle: string (optional)
plate_letter_left: string (optional)
```

**قوائم منسدلة:**
```
GET /modelDDLList?model_name=Brand
GET /modelDDLList?model_name=CarModel
GET /modelDDLList?model_name=Color
```

---

### الخطوة 2: المستندات (Documents)

**المكون:** `components/shared/CompleteData/CompleteData1.tsx`

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `front_side_identity` | `File` | نعم | صورة الهوية |
| `identity_number_expiration_date` | `Date` | نعم | تاريخ انتهاء الهوية |
| `front_side_license` | `File` | نعم | صورة رخصة القيادة |
| `driving_license_expiration_date` | `Date` | نعم | تاريخ انتهاء الرخصة |
| `front_side_vehicle_form` | `File` | نعم | صورة استمارة المركبة |
| `vehicle_form_expiration_date` | `Date` | نعم | تاريخ انتهاء الاستمارة |

**API Call:**
```
POST /drivers/updateDocuments
Content-Type: multipart/form-data

user_id: number
front_side_identity: File
identity_number_expiration_date: YYYY-MM-DD
front_side_license: File
driving_license_expiration_date: YYYY-MM-DD
front_side_vehicle_form: File
vehicle_form_expiration_date: YYYY-MM-DD
identity_number: string (optional)
date_of_birth: YYYY-MM-DD (optional)
```

---

### الخطوة 3: تعبئة البيانات (Complete Data)

**المكون:** `components/shared/CompleteData/CompleteData2.tsx`

| الحقل | النوع | مطلوب | الوصف | التحقق |
|-------|-------|-------|-------|--------|
| `identity_number` | `string` | نعم | رقم الهوية | 10 أرقام، يبدأ بـ 1 أو 2 |
| `date_of_birth` | `Date` | نعم | تاريخ الميلاد | - |
| `plate_type` | `select` | نعم | نوع اللوحة | - |
| `sequence_number` | `string` | نعم | رقم التسلسل | 5-15 رقم |
| `plate_number` | `string` | نعم | رقم اللوحة | 1-4 أرقام |
| `plate_letter_right` | `string` | نعم | الحرف الأيمن | حرف واحد |
| `plate_letter_middle` | `string` | نعم | الحرف الأوسط | حرف واحد |
| `plate_letter_left` | `string` | نعم | الحرف الأيسر | حرف واحد |
| `mobile` | `phone` | نعم | رقم الجوال | - |
| `email` | `email` | لا | البريد الإلكتروني | - |

**قواعد التحقق:**
```typescript
identity_number: Yup.string()
  .required("رقم الهوية مطلوب")
  .matches(/^\d{10}$/, "رقم الهوية يجب أن يكون 10 أرقام")
  .matches(/^[12]/, "رقم الهوية يجب أن يبدأ بـ 1 أو 2")

sequence_number: Yup.string()
  .required("رقم التسلسل مطلوب")
  .matches(/^\d{5,}$/, "رقم التسلسل يجب أن يكون 5 أرقام على الأقل")
  .max(15, "رقم التسلسل لا يمكن أن يتجاوز 15 رقم")

plate_number: Yup.string()
  .required("رقم اللوحة مطلوب")
  .matches(/^\d{1,4}$/, "رقم اللوحة يجب أن يكون 1-4 أرقام")

plate_letter_*: Yup.string()
  .required("الحرف مطلوب")
  .matches(/^[\u0600-\u06FFa-zA-Z]$/, "يجب أن يكون حرف واحد عربي أو إنجليزي")
```

**API Calls:**
```
PUT /drivers/{id}
Content-Type: multipart/form-data

identity_number: string
date_of_birth: YYYY-MM-DD
mobile: string (if changed)
country_code: string (if changed)
email: string (if changed)
plate_type: string
sequence_number: string
plate_number: string
plate_letter_right: string
plate_letter_middle: string
plate_letter_left: string
_method: "put"
```

```
POST /drivers
Content-Type: multipart/form-data

user_id: number
step: "4"
status: "active"
```

---

## الملف الشخصي

**المسار:** `/drivers/outages/{id}/profile`

### البيانات المعروضة

| القسم | الحقول |
|-------|--------|
| معلومات المستخدم | الاسم، الجنس، الجوال، البريد، الهوية، تاريخ الميلاد |
| معلومات المركبة | الماركة، الموديل، اللون، عدد المقاعد |
| معلومات اللوحة | نوع اللوحة، رقم التسلسل، رقم اللوحة، الحروف |
| المستندات | صورة الهوية، الرخصة، الاستمارة |
| قواعد المركبة | القواعد المحددة |

---

## حالات خاصة

### 1. لا يوجد تحقق WASL
على عكس سائقي التاكسي، العطالات لا تتطلب تحقق WASL. بدلاً من ذلك:
```typescript
// تحديث بيانات السائق مباشرة
await fetcherClient(`/drivers/${profileData.id}`, {
  method: "PUT",
  body: updateFormData,
});

// تحديث الخطوة والحالة مباشرة
const updateStepFormData = new FormData();
updateStepFormData.append("step", "4");
updateStepFormData.append("status", "active");
await fetcherClient("/drivers", {
  method: "POST",
  body: updateStepFormData,
});
```

### 2. رقم الهوية مرن
يقبل العطالات:
- هوية سعودي (تبدأ بـ 1)
- هوية مقيم (تبدأ بـ 2)

### 3. مشابه للتاكسي في بيانات الخدمة
يشترك مع التاكسي في:
- نوع المركبة والماركة والموديل
- لون المركبة
- عدد المقاعد
- القواعد الخاصة
- خدمة المواعيد المهمة

---

## صفحات العطالات

### صفحة السائقين الرئيسية
**المسار:** `/drivers/outages`

### صفحات حسب النوع
| النوع | سائقين | طلبات | إعدادات | أدوات |
|-------|--------|-------|---------|-------|
| الوقود | `/drivers/outages/fuel` | `/services/outages/fuel/orders` | `/services/outages/fuel/settings` | `/services/outages/fuel/tools` |
| الإطارات | `/drivers/outages/tires` | `/services/outages/tires/orders` | `/services/outages/tires/settings` | `/services/outages/tires/tools` |
| السحب | `/drivers/outages/towing` | `/services/outages/towing/orders` | `/services/outages/towing/settings` | `/services/outages/towing/tools` |

### صفحة الإحصائيات
**المسار:** `/services/outages/analytics`

---

## Response Types

```typescript
type OutageType = "fuel" | "tires" | "towing";

interface OutageDriver extends Driver {
  vehicle_data: {
    vehicle_type: "fast_support";
    brand_id: number;
    car_model_id: number;
    color_id: number;
    seats_number: number;
    rules: Rule[];
    available_for_important_dates: 0 | 1;
  }
}
```

---

## هيكل الملفات

```
components/outages/
├── EditDriverOutages/
│   ├── index.tsx          # نموذج إنشاء/تعديل سائق عطالات
│   └── Step1.tsx          # خطوة بيانات الخدمة
└── Analytics/
    └── index.tsx          # مكون الإحصائيات

app/[locale]/drivers/outages/
├── page.tsx               # قائمة جميع سائقي العطالات
├── fuel/
│   └── page.tsx           # سائقي الوقود
├── tires/
│   └── page.tsx           # سائقي الإطارات
├── towing/
│   └── page.tsx           # سائقي السحب
└── [id]/
    ├── page.tsx           # صفحة السائق
    ├── profile/
    │   └── page.tsx       # الملف الشخصي
    ├── wallet/
    │   └── page.tsx       # المحفظة
    └── columns.tsx        # أعمدة الجدول

app/[locale]/services/outages/
├── page.tsx               # صفحة العطالات الرئيسية
├── analytics/
│   └── page.tsx           # الإحصائيات
├── fuel/
│   ├── page.tsx           # سائقي الوقود
│   ├── orders/
│   │   ├── page.tsx       # طلبات الوقود
│   │   └── [id]/
│   │       └── page.tsx   # تفاصيل الطلب
│   ├── settings/
│   │   └── page.tsx       # إعدادات الوقود
│   └── tools/
│       └── page.tsx       # أدوات الوقود
├── tires/
│   └── ...                # نفس هيكل الوقود
└── towing/
    └── ...                # نفس هيكل الوقود
```

---

## مقارنة مع سائقي التاكسي

| الميزة | العطالات | التاكسي |
|--------|---------|---------|
| نوع المركبة API | `fast_support` | `taxi` |
| يتطلب لون | نعم | نعم |
| يتطلب مقاعد | نعم | نعم |
| قواعد المركبة | نعم | نعم |
| مواعيد مهمة | نعم | نعم |
| تحقق WASL | لا | نعم (صارم) |
| يقبل مقيم | نعم | لا |
| أنواع فرعية | 3 (وقود/إطارات/سحب) | لا |

---
