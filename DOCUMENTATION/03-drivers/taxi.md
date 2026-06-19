# سائقي التاكسي (Taxi Drivers)

## نظرة عامة

سائقي التاكسي (زيم ركاب) هم السائقين الذين يقدمون خدمة نقل الركاب. هذا النوع يتطلب التحقق من نظام وصل (WASL) بشكل صارم.

- **المسار:** `/services/taxi`
- **نوع المركبة:** `taxi`
- **عدد الخطوات:** 3 خطوات
- **يتطلب WASL:** نعم (صارم)

---

## نموذج إنشاء سائق تاكسي

**المكون:** `components/taxi/EditDriverTaxi/index.tsx`

### الخطوة 1: بيانات الخدمة (Service Data)

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `brand_id` | `select` | نعم | نوع المركبة (الماركة) |
| `car_model_id` | `select` | نعم | موديل المركبة |
| `color_id` | `select` | نعم | لون المركبة |
| `seats_number` | `select (1-6)` | نعم | عدد المقاعد |
| `rules[]` | `checkbox` | لا | القواعد الخاصة (WiFi، شاحن، إلخ) |
| `available_for_important_dates` | `switch (0/1)` | لا | متاح للمواعيد المهمة |

**API Call:**
```
POST /drivers/setService
Content-Type: multipart/form-data

user_id: number
brand_id: number
car_model_id: number
color_id: number
seats_number: number
rules[]: number[] (optional)
available_for_important_dates: 0 | 1
```

**قوائم منسدلة:**
```
GET /modelDDLList?model_name=Brand&cols[0]=name_ar&cols[1]=name_en
GET /modelDDLList?model_name=CarModel&filters[brand_id]={brand_id}&cols[0]=name_ar&cols[1]=name_en
GET /modelDDLList?model_name=Color&cols[0]=name_ar&cols[1]=hex
```

---

### الخطوة 2: المستندات (Documents)

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `front_side_identity` | `File` | نعم | صورة الهوية (الوجه الأمامي) |
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
```

---

### الخطوة 3: بيانات وصل (WASL Data)

| الحقل | النوع | مطلوب | الوصف | التحقق |
|-------|-------|-------|-------|--------|
| `identity_number` | `string` | نعم | رقم الهوية | 10 أرقام، يبدأ بـ 1 |
| `date_of_birth` | `Date` | نعم | تاريخ الميلاد | - |
| `plate_type` | `select` | نعم | نوع اللوحة | 1=خاص، 2=نقل عام، 6=أجرة |
| `sequence_number` | `string` | نعم | رقم التسلسل | 5-15 رقم |
| `plate_number` | `string` | نعم | رقم اللوحة | 1-4 أرقام |
| `plate_letter_right` | `string` | نعم | الحرف الأيمن | حرف عربي أو إنجليزي |
| `plate_letter_middle` | `string` | نعم | الحرف الأوسط | حرف عربي أو إنجليزي |
| `plate_letter_left` | `string` | نعم | الحرف الأيسر | حرف عربي أو إنجليزي |
| `mobile` | `phone` | نعم | رقم الجوال | - |
| `country_code` | `string` | نعم | كود الدولة | 966 |

**قواعد التحقق:**
```typescript
identity_number: Yup.string()
  .required("رقم الهوية مطلوب")
  .matches(/^\d{10}$/, "رقم الهوية يجب أن يكون 10 أرقام")
  .matches(/^[1]/, "رقم الهوية يجب أن يبدأ بـ 1")

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

identity_number: string
date_of_birth: YYYY-MM-DD
sequence_number: string
plate_letter_right: string
plate_letter_middle: string
plate_letter_left: string
plate_number: string
plate_type: string
mobile: string
user_id: number
country_code: "966"
```

**Response Handling:**
- **نجاح:** يتم تحديث `status` إلى `active` و `step` إلى `4`
- **فشل:** يتم تحديث `status` إلى `wasl_rejected`

---

## أنواع اللوحات

| القيمة | النوع | الوصف |
|--------|-------|-------|
| 1 | خاص | لوحة خاصة |
| 2 | نقل عام | لوحة نقل عام |
| 6 | أجرة | لوحة أجرة (تاكسي) |

---

## الملف الشخصي

**المسار:** `/drivers/taxi/{id}/profile`

### البيانات المعروضة

| القسم | الحقول |
|-------|--------|
| معلومات المستخدم | الاسم، الجنس، الجوال، البريد، الهوية، تاريخ الميلاد |
| معلومات المركبة | الماركة، الموديل، اللون، عدد المقاعد |
| معلومات اللوحة | نوع اللوحة، رقم التسلسل، رقم اللوحة، الحروف |
| المستندات | صورة الهوية، الرخصة، الاستمارة |
| قواعد المركبة | القواعد المحددة (WiFi، شاحن، إلخ) |
| المحفظة | الرصيد، المعاملات |

### الإجراءات المتاحة

| الإجراء | API | الوصف |
|--------|-----|-------|
| التحقق من وصل | `POST /drivers/checkWaslValidity` | إعادة التحقق من بيانات وصل |
| تعديل البيانات | `PUT /drivers/{id}` | تعديل بيانات السائق |
| حظر/رفع الحظر | `PUT /drivers/{id}/toggle-active` | تغيير حالة النشاط |
| حذف | `DELETE /drivers/{id}` | حذف السائق |
| عرض الرحلات | `/drivers/outages/{id}` | الانتقال لصفحة الرحلات |
| عرض المحفظة | `/drivers/outages/{id}/wallet` | الانتقال لصفحة المحفظة |
| عرض الإحصائيات | `/drivers/{id}/analytics` | الانتقال لصفحة الإحصائيات |

---

## حالات خاصة

### 1. متاح للمواعيد المهمة
إذا تم تفعيل `available_for_important_dates`، يظهر السائق في قائمة سائقي المواعيد المهمة أيضاً.

### 2. التحقق من وصل
- **صارم:** إذا فشل التحقق من وصل، لا يمكن إكمال التسجيل
- يتم حفظ حالة `wasl_rejected` لمتابعة المشاكل

### 3. رقم الهوية
- يجب أن يكون سعودي (يبدأ بـ 1)
- لا يقبل هوية مقيم (تبدأ بـ 2)

---

## هيكل الملفات

```
components/taxi/
├── EditDriverTaxi/
│   └── index.tsx          # نموذج إنشاء/تعديل سائق تاكسي
└── ...

app/[locale]/drivers/taxi/
└── [id]/
    └── profile/
        └── page.tsx       # صفحة الملف الشخصي
```

---

