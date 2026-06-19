# سائق بدون سيارة (Driver Without Car)

## نظرة عامة

سائق بدون سيارة هو نوع مبسط من السائقين الذين يسجلون بدون مركبة. يمكن استخدام هؤلاء السائقين لتشغيلهم على مركبات الشركة أو للتعيين لاحقاً.

- **المسار:** `/services/driver_without_car`
- **نوع المركبة:** `driver_without_car`
- **عدد الخطوات:** 2 خطوات فقط
- **يتطلب WASL:** لا (الأخطاء يتم تجاهلها)
- **يتطلب مركبة:** لا

---

## نموذج إنشاء سائق بدون سيارة

**المكون:** `components/driverWithoutCar/EditDriverWithoutCar/index.tsx`

### ملاحظة هامة

هذا هو النوع الوحيد الذي يتكون من **خطوتين فقط** بدلاً من 3 خطوات:
1. المستندات
2. تعبئة البيانات

**لا يوجد خطوة بيانات الخدمة/المركبة** لأن السائق لا يملك سيارة.

---

### الخطوة 1: المستندات (Documents)

**المكون:** `components/shared/CompleteData/CompleteData1.tsx`

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `front_side_identity` | `File` | نعم | صورة الهوية |
| `front_side_license` | `File` | نعم | صورة رخصة القيادة |

**ملاحظة:** لا يتطلب صورة استمارة المركبة لأنه لا يملك سيارة.

**API Call:**
```
POST /drivers/updateDocuments
Content-Type: multipart/form-data

user_id: number
front_side_identity: File
front_side_license: File
identity_number: string (optional)
date_of_birth: YYYY-MM-DD (optional)
step: "2"
```

---

### الخطوة 2: تعبئة البيانات (Complete Data)

**المكون:** `components/shared/CompleteData/CompleteData2.tsx`

| الحقل | النوع | مطلوب | الوصف | التحقق |
|-------|-------|-------|-------|--------|
| `identity_number` | `string` | نعم | رقم الهوية | 10 أرقام |
| `date_of_birth` | `Date` | نعم | تاريخ الميلاد | - |
| `mobile` | `phone` | نعم | رقم الجوال | - |

**ملاحظة:** لا يتطلب بيانات اللوحة لأنه لا يملك سيارة.

**قواعد التحقق:**
```typescript
identity_number: Yup.string()
  .required("رقم الهوية مطلوب")
  .matches(/^\d{10}$/, "رقم الهوية يجب أن يكون 10 أرقام")
// لا يتطلب بداية محددة (1 أو 2)

date_of_birth: Yup.string()
  .required("تاريخ الميلاد مطلوب")
```

**API Call:**
```
POST /drivers/checkWaslValidity
Content-Type: multipart/form-data

user_id: number
identity_number: string
date_of_birth: YYYY-MM-DD
mobile: string
step: "3"
status: "active"
wasl_status: "1"
```

**ملاحظة:** لا يتم إرسال بيانات اللوحة مع هذا النوع.

---

## الملف الشخصي

**المسار:** `/drivers/driver_without_car/{id}/profile`

### البيانات المعروضة

| القسم | الحقول |
|-------|--------|
| معلومات المستخدم | الاسم، الجنس، الجوال، البريد، الهوية، تاريخ الميلاد |
| المستندات | صورة الهوية، الرخصة |

### الأقسام المخفية

لا يتم عرض الأقسام التالية لسائق بدون سيارة:
- معلومات المركبة
- معلومات اللوحة
- قواعد المركبة
- استمارة المركبة

---

## حالات خاصة

### 1. لا يوجد خطوة بيانات الخدمة
```typescript
labels={["المستندات", "تعبئة البيانات!"]}  // خطوتين فقط
steps={[
  (props) => <CompleteData1 ... />,  // المستندات
  (props) => <CompleteData2 ... />,  // تعبئة البيانات
]}
```

### 2. تجاهل أخطاء WASL
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

### 3. بيانات WASL مبسطة
لا يتم إرسال بيانات اللوحة إلى API:
```typescript
waslFormData.append("identity_number", values.id);
waslFormData.append("date_of_birth", values.dop);
waslFormData.append("mobile", values.phone);
// لا يوجد: sequence_number, plate_number, plate_letter_*
```

### 4. تقدم الخطوات
```typescript
const getInitialStep = () => {
  if (dbStep >= 3) return 1; // مكتمل (3 بدلاً من 4)
  if (dbStep === 2) return 2;
  if (dbStep === 1) return 1;
  return 1;
};
```

---

## Response Types

```typescript
interface DriverWithoutCar extends Driver {
  vehicle_data: null; // لا يوجد بيانات مركبة
}
```

---

## هيكل الملفات

```
components/driverWithoutCar/
├── EditDriverWithoutCar/
│   └── index.tsx          # نموذج إنشاء/تعديل سائق بدون سيارة

components/shared/CompleteData/
├── CompleteData1.tsx      # خطوة المستندات (مشتركة)
└── CompleteData2.tsx      # خطوة تعبئة البيانات (مشتركة)

app/[locale]/drivers/driver_without_car/
└── [id]/
    └── profile/
        └── page.tsx       # صفحة الملف الشخصي
```

---

## مقارنة مع أنواع السائقين الأخرى

| الميزة | سائق بدون سيارة | الأنواع الأخرى |
|--------|----------------|---------------|
| عدد الخطوات | 2 | 3 |
| خطوة بيانات الخدمة | لا | نعم |
| استمارة المركبة | لا | نعم |
| بيانات اللوحة | لا | نعم |
| يتطلب مركبة | لا | نعم |
| WASL | مرن | مرن/صارم |

---

## حالات الاستخدام

1. **سائق للتعيين لاحقاً:** تسجيل سائق الآن وتعيينه على مركبة لاحقاً
2. **سائق شركة:** سائق يعمل على مركبات الشركة بدون امتلاك مركبة خاصة
3. **سائق احتياطي:** سائق يمكن استدعاؤه عند الحاجة
4. **سائق متعدد الخدمات:** سائق يمكنه العمل على أنواع مختلفة من المركبات

---
