# سائقي الفونطاس (Fontas/Water Tanker Drivers)

## نظرة عامة

سائقي الفونطاس هم السائقين الذين يقدمون خدمة نقل المياه بالصهاريج (وايت ماء). يتميز هذا النوع بنوع المياه (صالح/غير صالح للشرب) وحجم الصهريج.

- **المسار:** `/services/fontas`
- **نوع المركبة:** `fontas`
- **عدد الخطوات:** 3 خطوات
- **يتطلب WASL:** لا (يتم التسجيل مباشرة بدون تحقق)

---

## نموذج إنشاء سائق فونطاس

**المكون:** `components/fontas/EditDriverFontas/index.tsx`

### الخطوة 1: بيانات الخدمة (Service Data)

**المكون:** `components/fontas/EditDriverFontas/Step1.tsx`

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `fontas_type` | `select` | نعم | نوع المياه |
| `fontas_unit_id` | `select` | نعم | حجم الصهريج |

**أنواع المياه:**

| القيمة في الواجهة | القيمة في API | الوصف |
|------------------|--------------|-------|
| صالح للشرب | `valid` | مياه صالحة للشرب |
| غير صالح للشرب | `invalid` | مياه غير صالحة للشرب |

**API Call:**
```
POST /drivers/setService
Content-Type: multipart/form-data

user_id: number
vehicle_type: "fontas"
fontas_unit_id: number
fontas_type: "valid" | "invalid"
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
GET /modelDDLList?model_name=FontasUnit&is_active=1&filters[type]=valid
GET /modelDDLList?model_name=FontasUnit&is_active=1&filters[type]=invalid
```

**ملاحظة:** أحجام الصهاريج تتغير بناءً على نوع المياه المحدد.

---

### الخطوة 2: المستندات (Documents)

**المكون:** `components/shared/CompleteData/CompleteData1.tsx`

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `front_side_identity` | `File` | نعم | صورة الهوية |
| `front_side_license` | `File` | نعم | صورة رخصة القيادة |
| `front_side_vehicle_form` | `File` | نعم | صورة استمارة المركبة |

**API Call:**
```
POST /drivers/updateDocuments
Content-Type: multipart/form-data

user_id: number
front_side_identity: File
front_side_license: File
front_side_vehicle_form: File
identity_number: string (optional)
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

**المسار:** `/drivers/fontas/{id}/profile`

### البيانات المعروضة

| القسم | الحقول |
|-------|--------|
| معلومات المستخدم | الاسم، الجنس، الجوال، البريد، الهوية، تاريخ الميلاد |
| معلومات الصهريج | نوع المياه، حجم الصهريج |
| معلومات اللوحة | نوع اللوحة، رقم التسلسل، رقم اللوحة، الحروف |
| المستندات | صورة الهوية، الرخصة، الاستمارة |

### عرض بيانات الصهريج

```typescript
{driver.vehicle_data.vehicle_type === EVehicleType.fontas && (
  <div>
    <span>نوع المياه:</span>
    <span>
      {driver.vehicle_data.fontas_unit.type === "valid"
        ? "صالح للشرب"
        : "غير صالح للشرب"}
    </span>
    <span>حجم الصهريج:</span>
    <span>
      {driver.vehicle_data.fontas_unit.unit}-{driver.vehicle_data.fontas_unit.value}
    </span>
  </div>
)}
```

---

## حالات خاصة

### 1. أحجام الصهاريج الديناميكية
تتغير قائمة أحجام الصهاريج بناءً على نوع المياه:
```typescript
useEffect(() => {
  const fetchData = async () => {
    const allvolums = await fetcherClient(
      `/modelDDLList?model_name=FontasUnit&is_active=1&filters[type]=${
        formikProps.values.fontas_type == "صالح للشرب" ? "valid" : "invalid"
      }`
    );
    setvolums(allvolums);
  };
  fetchData();
}, [formikProps.values.fontas_type]);
```

### 2. لا يوجد تحقق WASL
مثل العطالات، لا يتطلب الفونطاس تحقق WASL. يتم التسجيل مباشرة:
```typescript
// تحديث بيانات السائق مباشرة
await fetcherClient(`/drivers/${profileData.id}`, {
  method: "PUT",
  body: updateFormData,
});

// تحديث الخطوة والحالة مباشرة
updateStepFormData.append("step", "4");
updateStepFormData.append("status", "active");
```

### 3. رقم الهوية مرن
يقبل الفونطاس:
- هوية سعودي (تبدأ بـ 1)
- هوية مقيم (تبدأ بـ 2)

### 4. لا يتطلب بيانات المركبة التقليدية
الفونطاس لا يتطلب:
- ماركة المركبة
- موديل المركبة
- لون المركبة
- عدد المقاعد
- القواعد الخاصة

بدلاً من ذلك يتطلب:
- نوع المياه
- حجم الصهريج

---

## Response Types

```typescript
type FontasType = "valid" | "invalid";

interface FontasUnit {
  id: number;
  type: FontasType;
  unit: string;
  value: string;
}

interface FontasDriver extends Driver {
  vehicle_data: {
    vehicle_type: "fontas";
    fontas_unit: FontasUnit;
  }
}
```

---

## هيكل الملفات

```
components/fontas/
├── EditDriverFontas/
│   ├── index.tsx          # نموذج إنشاء/تعديل سائق فونطاس
│   └── Step1.tsx          # خطوة بيانات الخدمة

components/shared/CompleteData/
├── CompleteData1.tsx      # خطوة المستندات (مشتركة)
└── CompleteData2.tsx      # خطوة تعبئة البيانات (مشتركة)

app/[locale]/drivers/fontas/
├── page.tsx               # قائمة السائقين
└── [id]/
    ├── page.tsx           # صفحة السائق
    ├── data.tsx           # بيانات الجدول
    ├── columns.tsx        # أعمدة الجدول
    ├── profile/
    │   └── page.tsx       # الملف الشخصي
    └── wallet/
        └── page.tsx       # المحفظة
```

---

## مقارنة مع أنواع السائقين الأخرى

| الميزة | الفونطاس | التاكسي | الونش | النقل الخفيف |
|--------|---------|---------|-------|-------------|
| يتطلب ماركة | لا | نعم | لا | نعم |
| يتطلب موديل | لا | نعم | لا | نعم |
| يتطلب لون | لا | نعم | لا | لا |
| حقل خاص | نوع المياه + حجم الصهريج | عدد المقاعد | نوع الونش | نوع الكابينة |
| WASL صارم | لا | نعم | لا | لا |
| يقبل مقيم | نعم | لا | نعم | نعم |

---
