# سائقي النقل الخفيف (Light Transportation Drivers)

## نظرة عامة

سائقي النقل الخفيف هم السائقين الذين يقدمون خدمة النقل بالشاحنات الصغيرة (البكاسي). يتميز هذا النوع بوجود نوع الكابينة (مفردة/مزدوجة).

- **المسار:** `/services/light_transportation`
- **نوع المركبة:** `light_transportation`
- **عدد الخطوات:** 3 خطوات
- **يتطلب WASL:** لا (الأخطاء يتم تجاهلها)

---

## نموذج إنشاء سائق نقل خفيف

**المكون:** `components/lightTransportation/EditDriverLight/index.tsx`

### الخطوة 1: بيانات الخدمة (Service Data)

**المكون:** `components/lightTransportation/EditDriverLight/Step1.tsx`

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `vehicleType` (brand_id) | `select` | نعم | نوع المركبة (الماركة) |
| `vehicleModel` (car_model_id) | `select` | نعم | طراز المركبة |
| `numberOfCabins` (light_transportation_type) | `select` | لا | عدد الكبائن |

**أنواع الكابينة:**

| القيمة | العرض العربي | الوصف |
|--------|-------------|-------|
| `single_cabin` | كابينة مفردة | شاحنة بكابينة مفردة |
| `double_cabin` | كابينة مزدوجة | شاحنة بكابينة مزدوجة |

**API Call:**
```
POST /drivers/setService
Content-Type: multipart/form-data

user_id: number
vehicle_type: "light_transportation"
brand_id: number
car_model_id: number
light_transportation_type: "single_cabin" | "double_cabin" (optional)
step: "2"
```

**قوائم منسدلة:**
```
GET /modelDDLList?model_name=Brand
GET /modelDDLList?model_name=CarModel
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
step: "3"
```

---

### الخطوة 3: بيانات وصل (WASL Data)

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

**API Call:**
```
POST /drivers/checkWaslValidity
Content-Type: multipart/form-data

user_id: number
identity_number: string
date_of_birth: YYYY-MM-DD
sequence_number: string
plate_letter_right: string
plate_letter_middle: string
plate_letter_left: string
plate_number: string
plate_type: string
mobile: string
step: "4"
status: "active"
wasl_status: "1"
```

**ملاحظة مهمة:** أخطاء WASL يتم تجاهلها ويتم إكمال التسجيل بنجاح حتى لو فشل التحقق.

---

## الملف الشخصي

**المسار:** `/drivers/light_transportation/{id}/profile`

### البيانات المعروضة

| القسم | الحقول |
|-------|--------|
| معلومات المستخدم | الاسم، الجنس، الجوال، البريد، الهوية، تاريخ الميلاد |
| معلومات المركبة | الماركة، الموديل، نوع الكابينة |
| معلومات اللوحة | نوع اللوحة، رقم التسلسل، رقم اللوحة، الحروف |
| المستندات | صورة الهوية، الرخصة، الاستمارة |

### عرض نوع الكابينة

```typescript
{driver.vehicle_data.vehicle_type === EVehicleType.light_transportation && (
  <div>
    <span>نوع الكابينة:</span>
    <span>
      {driver.vehicle_data.light_transportation_type_key === "single_cabin"
        ? "كابينة مفردة"
        : driver.vehicle_data.light_transportation_type_key === "double_cabin"
        ? "كابينة مزدوجة"
        : "غير محدد"}
    </span>
  </div>
)}
```

---

## حالات خاصة

### 1. رقم الهوية مرن
يقبل النقل الخفيف:
- هوية سعودي (تبدأ بـ 1)
- هوية مقيم (تبدأ بـ 2)

### 2. نوع الكابينة اختياري
حقل `numberOfCabins` غير مطلوب في التحقق، لكن يُفضل تحديده.

### 3. تجاهل أخطاء WASL
```typescript
try {
  await fetcherClient("/drivers/checkWaslValidity", {
    method: "POST",
    body: waslFormData,
  });
} catch (waslError) {
  // Silently ignore WASL errors
  console.log("WASL validation called (errors ignored)");
}
```

### 4. لا يتطلب لون المركبة
على عكس سائقي التاكسي، النقل الخفيف لا يتطلب تحديد لون المركبة.

---

## Response Types

```typescript
type LightTransportationType = "single_cabin" | "double_cabin";

interface LightTransportationDriver extends Driver {
  vehicle_data: {
    vehicle_type: "light_transportation";
    brand_id: number;
    car_model_id: number;
    light_transportation_type_key: LightTransportationType;
  }
}
```

---

## هيكل الملفات

```
components/lightTransportation/
├── EditDriverLight/
│   ├── index.tsx          # نموذج إنشاء/تعديل سائق نقل خفيف
│   └── Step1.tsx          # خطوة بيانات الخدمة

components/shared/CompleteData/
├── CompleteData1.tsx      # خطوة المستندات (مشتركة)
└── CompleteData2.tsx      # خطوة بيانات وصل (مشتركة)

app/[locale]/drivers/light_transportation/
└── [id]/
    └── profile/
        └── page.tsx       # صفحة الملف الشخصي
```

---

## مقارنة مع أنواع السائقين الأخرى

| الميزة | النقل الخفيف | التاكسي | الفونطاس | الونش |
|--------|------------|---------|---------|-------|
| يتطلب ماركة | نعم | نعم | لا | لا |
| يتطلب موديل | نعم | نعم | لا | لا |
| يتطلب لون | لا | نعم | لا | لا |
| حقل خاص | نوع الكابينة | عدد المقاعد | حجم الصهريج | نوع الونش |
| WASL صارم | لا | نعم | لا | لا |
| يقبل مقيم | نعم | لا | نعم | نعم |

---
