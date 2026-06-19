# سائقي الونش (Wensh/Tow Truck Drivers)

## نظرة عامة

سائقي الونش هم السائقين الذين يقدمون خدمة السطحات والدينات (نقل المركبات). يتميز هذا النوع بأنواع الونش المختلفة وبساطة بيانات الخدمة.

- **المسار:** `/services/wensh`
- **نوع المركبة:** `wensh`
- **عدد الخطوات:** 3 خطوات
- **يتطلب WASL:** لا (الأخطاء يتم تجاهلها)

---

## نموذج إنشاء سائق ونش

**المكون:** `components/wensh/EditDriverWensh/index.tsx`

### الخطوة 1: بيانات الخدمة (Service Data)

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `wensh_type` | `select` | نعم | نوع الونش |

**أنواع الونش:**

| القيمة | العرض العربي | الوصف |
|--------|-------------|-------|
| `hydraulic` | هيدروليكي | ونش هيدروليكي |
| `basic` | أساسي | ونش أساسي |
| `fork` | رافعة | ونش رافعة |

**API Call:**
```
POST /drivers/setService
Content-Type: multipart/form-data

user_id: number
wensh_type: "hydraulic" | "basic" | "fork"
```

**ملاحظة مهمة:** هذا النوع لا يتطلب بيانات المركبة (ماركة، موديل، لون) على عكس الأنواع الأخرى.

---

### الخطوة 2: المستندات (Documents)

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `front_side_identity` | `File` | نعم | صورة الهوية |
| `front_side_identity_expiration_date` | `Date` | نعم | تاريخ انتهاء الهوية |
| `front_side_license` | `File` | نعم | صورة رخصة القيادة |
| `front_side_license_expiration_date` | `Date` | نعم | تاريخ انتهاء الرخصة |
| `front_side_vehicle_form` | `File` | نعم | صورة استمارة المركبة |
| `front_side_vehicle_form_expiration_date` | `Date` | نعم | تاريخ انتهاء الاستمارة |

**API Call:**
```
POST /drivers/updateDocuments
Content-Type: multipart/form-data

user_id: number
front_side_identity: File
front_side_identity_expiration_date: YYYY-MM-DD
front_side_license: File
front_side_license_expiration_date: YYYY-MM-DD
front_side_vehicle_form: File
front_side_vehicle_form_expiration_date: YYYY-MM-DD
```

---

### الخطوة 3: بيانات وصل (WASL Data)

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
```

---

## الملف الشخصي

**المسار:** `/drivers/wensh/{id}/profile`

### البيانات الخاصة بالونش

| القسم | الحقول |
|-------|--------|
| معلومات المركبة | نوع السطحة فقط |

### عرض نوع الونش

```typescript
{driver.vehicle_data.vehicle_type === EVehicleType.wensh && (
  <div>
    <span>نوع السطحة:</span>
    <span>
      {driver.vehicle_data.wensh_type_key === "hydraulic"
        ? "هيدروليكي"
        : driver.vehicle_data.wensh_type_key === "basic"
        ? "أساسي"
        : driver.vehicle_data.wensh_type_key === "fork"
        ? "رافعه"
        : "غير محدد"}
    </span>
  </div>
)}
```

---

## حالات خاصة

### 1. بساطة بيانات الخدمة
الونش هو أبسط نوع من حيث بيانات الخدمة:
- لا يتطلب ماركة
- لا يتطلب موديل
- لا يتطلب لون
- لا يتطلب عدد مقاعد
- فقط نوع الونش

### 2. عدم عرض قواعد المركبة
في صفحة الملف الشخصي، لا يتم عرض قسم قواعد المركبة لسائقي الونش.

### 3. عدم عرض معلومات المركبة التفصيلية
لا يتم عرض الماركة والموديل واللون وعدد المقاعد لسائقي الونش.

---

## Response Types

```typescript
type WenshType = "hydraulic" | "basic" | "fork";

interface WenshDriver extends Driver {
  vehicle_data: {
    vehicle_type: "wensh";
    wensh_type_key: WenshType;
  }
}
```

---

## هيكل الملفات

```
components/wensh/
├── EditDriverWensh/
│   └── index.tsx          # نموذج إنشاء/تعديل سائق ونش

app/[locale]/drivers/wensh/
└── [id]/
    └── profile/
        └── page.tsx       # صفحة الملف الشخصي
```

---