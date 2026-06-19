# خدمة وايت الماء (Fontas Service)

## نظرة عامة

خدمة الفونطاس (وايت الماء) هي خدمة نقل المياه بالصهاريج. تتيح للعملاء طلب صهريج مياه (صالح أو غير صالح للشرب) بأحجام مختلفة.

- **المسار:** `/ar/services/fontas?subtype={unit_id}`
- **نوع الخدمة:** `fontas`
- **العرض العربي:** وايت ماء

### المزايا الرئيسية
- التسعير الديناميكي حسب حجم الوحدة
- التحديثات الجماعية (تطبيق على الكل، الصالح فقط، غير الصالح فقط)
- حماية السائقين النشطين (منع الحذف/التعطيل للوحدات المرتبطة بسائقين)
- التحقق من تكرار الوحدات
- دعم التسعير حسب المنطقة

---

## صفحة إعدادات الخدمة

**المسار:** `/ar/services/fontas?subtype={unit_id}&zone_id={zone_id}`

### الأقسام

1. **نسبة التطبيق** (مع اختيار وحدة الفونطاس)
2. **أسعار اليوم** (جميع حقول التسعير)
3. **أوقات الذروة**
4. **حالة الخدمة** (قريباً / مخفي)
5. **وسائل الدفع**

---

## إدارة وحدات الفونطاس

**المسار:** `/ar/vehicles/units`

### العمليات المتاحة
- **عرض القائمة**: جدول مع ترقيم الصفحات
- **إضافة وحدة**: `/ar/vehicles/units/add`
- **تعديل وحدة**: `/ar/vehicles/units/{id}/edit`
- **عرض التفاصيل**: `/ar/vehicles/units/{id}`
- **حذف وحدة**: محمي إذا كان هناك سائقين نشطين

### بيانات الوحدة
```typescript
interface UnitsRecord {
  id: number;
  type: string;                    // "صالح للشرب" | "غير صالح للشرب"
  unit: string;                    // "طن" | "جالون"
  value: number;                   // الحجم
  basic_price: number;             // السعر الأساسي (deprecated - دائماً 0)
  is_active: number;               // 0 أو 1
  active_drivers_count: number;    // عدد السائقين النشطين
  created_at: string;
}
```

### أنواع الوحدات
| النوع | الوصف |
|-------|-------|
| `valid` (صالح للشرب) | مياه صالحة للشرب |
| `invalid` (غير صالح للشرب) | مياه غير صالحة للشرب |

| الوحدة | القيمة |
|-------|-------|
| `ton` (طن) | طن |
| `gallon` (جالون) | جالون |

---

## API Endpoints

### إعدادات الخدمة

#### جلب إعدادات الفونطاس
```
GET /getServiceSettings?type=fontas&subtype={unit_id}&zone_id={zone_id}
```

#### تحديث إعدادات الفونطاس
```
POST /updateServiceSettings
Content-Type: multipart/form-data
```

**البيانات:**
```typescript
{
  type: "fontas"
  subtype?: number                 // معرّف الوحدة (يُحذف للتحديثات الجماعية)
  zone_id?: number
  app_percentage?: number          // 0-100
  base_price?: number
  price_per_km?: number
  price_per_minute?: number
  free_km?: number
  cancellation_cost?: number
  cancellation_time?: number       // بالدقائق
  is_coming_soon?: 0 | 1
  is_hidden?: 0 | 1

  // معاملات التحديث الجماعي
  apply_app_percentage_for?: "all" | "valid" | "invalid"
  apply_prices_for?: "all" | "valid" | "invalid"

  // وسائل الدفع
  cash?: 0 | 1
  wallet?: 0 | 1
  card?: 0 | 1
}
```

### إدارة الوحدات

#### جلب الوحدات
```
GET /fontasUnits?itemPerPage={limit}&page={page}
```

#### إضافة وحدة
```
POST /fontasUnits
```
**البيانات:**
```typescript
{
  type: "valid" | "invalid"
  unit: "ton" | "gallon"
  value: number
  basic_price: number              // (deprecated - يرسل 0 دائماً)
  is_active: "0" | "1"
}
```

#### تحديث وحدة
```
POST /fontasUnits/{id}
_method: "put"
```

#### حذف وحدة
```
DELETE /fontasUnits/{id}
```
**ملاحظة:** محمي من الحذف إذا كان `active_drivers_count > 0`

### أوقات الذروة

#### إضافة وقت ذروة
```
POST /storePeakTime
```

**البيانات:**
```typescript
{
  type: "fontas"
  subtype?: number
  zone_id?: number
  day: string
  start_time: string               // HH:mm
  end_time: string                 // HH:mm
  price_per_km: number
  price_per_minute: number
  fixed_price: number
  minimum_charge: number
  waiting_cost: number
  cancellation_cost: number
  free_km?: number                 // خاص بالفونطاس
  cancellation_time?: number       // خاص بالفونطاس
}
```

---

## إعدادات التسعير

### الحقول المتاحة

| الحقل | المفتاح | الوصف |
|-------|---------|-------|
| نسبة التطبيق | `app_percentage` | نسبة التطبيق من كل رحلة (0-100%) |
| السعر الثابت | `base_price` | السعر الأساسي للرحلة |
| السعر بالكيلو | `price_per_km` | سعر الكيلومتر |
| السعر بالدقيقة | `price_per_minute` | سعر الدقيقة |
| الكيلوات المجانية | `free_km` | عدد الكيلومترات المجانية |
| تكلفة الإلغاء | `cancellation_cost` | تكلفة إلغاء الرحلة |
| وقت الإلغاء | `cancellation_time` | الوقت المسموح للإلغاء (بالدقائق) |

**ملاحظة:** جميع حقول التسعير متاحة للفونطاس، ولكن يمكن تخصيص الحقول المستخدمة حسب الوحدة.

---

## التحديثات الجماعية

### خيارات التطبيق

يمكن تطبيق التغييرات على:

1. **تطبيق على الكل** (`apply_*_for: "all"`): تحديث جميع الوحدات
2. **تطبيق على الصالح فقط** (`apply_*_for: "valid"`): تحديث وحدات المياه الصالحة فقط
3. **تطبيق على غير الصالح فقط** (`apply_*_for: "invalid"`): تحديث وحدات المياه غير الصالحة فقط

### آلية العمل

```typescript
// مثال: تحديث نسبة التطبيق لجميع الوحدات الصالحة
FormData {
  type: "fontas"
  app_percentage: 15
  apply_app_percentage_for: "valid"
  // لا يتم إرسال subtype - لتطبيق على جميع الوحدات الصالحة
}
```

### استعادة القيم

عند التحديث الجماعي، إذا كان نوع الوحدة المعروضة لا يطابق نوع التحديث:
- يتم حفظ القيم الأصلية قبل التحديث
- بعد التحديث، تُستعاد القيم الأصلية للوحدة المعروضة
- يمنع `enableReinitialize` من الكتابة فوق القيم المستعادة

**مثال:**
```
الوحدة المعروضة: "غير صالح" (invalid)
التحديث: تطبيق على "الصالح فقط" (valid)
النتيجة: بعد التحديث، تبقى قيم الوحدة "غير صالح" كما هي
```

---

## المكونات

### 1. FontasAppPercentage

**الموقع:** `components/Drivers/Pricing/AppPercentage/services/FontasAppPercentage`

**المزايا:**
- حقل إدخال نسبة التطبيق (0-100)
- قائمة اختيار الوحدة (مجمّعة حسب صالح/غير صالح)
- خانات اختيار التحديث الجماعي
- نافذة تأكيد قبل التطبيق
- استعادة القيم التلقائية
- الحفاظ على موضع التمرير

**Custom Hook:** `useFontasAppPercentage.ts`

### 2. FontasPricesDay

**الموقع:** `components/Drivers/Pricing/PricesDay/services/FontasPricesDay.tsx`

**الحقول:**
- جميع حقول التسعير
- حالة الخدمة (قريباً / مخفي)
- وسائل الدفع

**Custom Hook:** `useFontasPricesDay.ts`

### 3. PeakPrices

**الموقع:** `components/Drivers/Pricing/PeakPrices`

**العمليات:**
- إضافة وقت ذروة
- تعديل وقت ذروة
- حذف وقت ذروة واحد
- حذف جميع أوقات الذروة

---

## حالة الخدمة

### قريباً (Coming Soon)
```typescript
is_coming_soon: 1
```
- الخدمة مرئية في التطبيق
- لا يمكن حجزها
- **الاستخدام:** الإعلان عن خدمة جديدة قبل الإطلاق

### مخفي (Hidden)
```typescript
is_hidden: 1
```
- الخدمة مخفية تماماً من التطبيق
- غير مرئية للمستخدمين
- **الاستخدام:** تعطيل الخدمة مؤقتاً

---

## حماية السائقين النشطين

### قواعد الحماية

1. **منع الحذف:**
   ```typescript
   if (unit.active_drivers_count > 0) {
     // زر الحذف معطّل
     toast.error("لا يمكن حذف وحدة الفونتاس لأن هناك سائقين نشطين مرتبطين بها");
   }
   ```

2. **منع التعطيل:**
   ```typescript
   if (unit.is_active === 1 && newStatus === "0" && unit.active_drivers_count > 0) {
     throw Error("Cannot deactivate unit with active drivers");
   }
   ```

3. **عرض التنبيهات:**
   - يظهر badge بعدد السائقين النشطين
   - يظهر تحذير في صفحة التعديل

---

## التحقق من التكرار

عند إضافة وحدة جديدة، يتم التحقق من:
- النوع (type)
- الوحدة (unit)
- القيمة (value)

**آلية التحقق:**
```typescript
const mapArabicToEnglish = (arabicValue: string, type: 'type' | 'unit') => {
  if (type === 'type') {
    if (arabicValue === 'صالح للشرب' || arabicValue === 'صالح') return 'valid';
    if (arabicValue === 'غير صالح للشرب' || arabicValue === 'غير صالح') return 'invalid';
  }
  if (type === 'unit') {
    if (arabicValue === 'طن') return 'ton';
    if (arabicValue === 'جالون') return 'gallon';
  }
  return arabicValue;
};

// التحقق من التكرار
const duplicateUnit = existingUnits.find(unit =>
  mapArabicToEnglish(unit.type, 'type') === values.type &&
  mapArabicToEnglish(unit.unit, 'unit') === values.unit &&
  parseFloat(unit.value) === parseFloat(values.value)
);

if (duplicateUnit) {
  if (duplicateUnit.is_active) {
    // خطأ: الوحدة موجودة ونشطة
  } else {
    // اقتراح: تفعيل الوحدة من صفحة التعديل
  }
}
```

---

## إدارة المناطق

### المناطق غير المتأثرة بالتعديل

عند تحديث الأسعار **بدون** تحديد `zone_id`:
- يتم تطبيق التحديث على الإعدادات العامة فقط
- المناطق التي لها إعدادات مخصصة **لن تتأثر**

### المناطق المتأثرة بالتعديل

عند تحديث الأسعار **مع** تحديد `zone_id`:
- يتم تطبيق التحديث على المنطقة المحددة فقط
- يتم إنشاء أو تحديث إعدادات مخصصة للمنطقة

**مثال:**
```typescript
// تحديث الإعدادات العامة
POST /updateServiceSettings
{
  type: "fontas",
  subtype: 22,
  base_price: 100
  // zone_id غير محدد - فقط الإعدادات العامة تتأثر
}

// تحديث منطقة محددة
POST /updateServiceSettings
{
  type: "fontas",
  subtype: 22,
  zone_id: 5,
  base_price: 120
  // منطقة 5 فقط تتأثر
}
```

---

## هيكل الملفات

```
app/[locale]/
├── services/[serviceType]/page.tsx    # صفحة الخدمة الرئيسية
└── vehicles/units/
    ├── page.tsx                       # قائمة الوحدات
    ├── columns.tsx                    # أعمدة الجدول
    ├── add/page.tsx                   # إضافة وحدة
    └── [id]/
        ├── page.tsx                   # عرض الوحدة
        └── edit/page.tsx              # تعديل الوحدة

components/Drivers/Pricing/
├── AppPercentage/
│   └── services/FontasAppPercentage/
│       ├── index.tsx                  # المكون الرئيسي
│       ├── FontasDropdown.tsx         # قائمة اختيار الوحدات
│       ├── FontasCheckboxes.tsx       # خانات التحديث الجماعي
│       └── useFontasAppPercentage.ts  # Custom hook
│
├── PricesDay/
│   ├── services/FontasPricesDay.tsx   # تسعير الفونطاس
│   └── hooks/useFontasPricesDay.ts    # Custom hook
│
└── PeakPrices/
    ├── index.tsx                      # جدول أوقات الذروة
    ├── AddPeakPrice.tsx               # إضافة
    ├── EditPeakPrice.tsx              # تعديل
    └── DeletePeakTime.tsx             # حذف

lib/types/
├── validationTypes.ts                 # Yup schemas
├── responseTypes.ts                   # TypeScript interfaces
└── enums.ts                           # FontasTypes, FontasUnits
```

---

## Validation Schemas

### validationForUnits
```typescript
Yup.object({
  type: Yup.string().required("النوع مطلوب"),
  unit: Yup.string().required("الوحدة مطلوبة"),
  value: Yup.number().positive("القيمة مطلوبة"),
  is_active: Yup.string().required("الحالة مطلوبة"),
  // basic_price تم إزالته
});
```

### validationForAppPercentage
```typescript
Yup.object({
  percentage: Yup.number()
    .min(0, "النسبة المئوية لا يمكن أن تكون رقمًا سالبًا")
    .max(100, "النسبة المئوية يجب ألا تتجاوز 100"),
});
```

### validationForPeakTimes
```typescript
Yup.object({
  day: Yup.string().required("اليوم مطلوب"),
  startTime: Yup.string().required("وقت البدء مطلوب"),
  endTime: Yup.string().required("وقت النهاية مطلوب"),
  // ... حقول التسعير
  freeKm: Yup.number().max(1000),               // خاص بالفونطاس
  cancellationTime: Yup.number().max(1440),     // خاص بالفونطاس
});
```

---

## المشاكل الشائعة والحلول

### 1. القيم لا تتحدث بعد التحديث الجماعي

**المشكلة:** عند تطبيق التسعير على "الصالح فقط" والوحدة المعروضة "غير صالح"، النموذج لا يظهر القيم الأصلية.

**الحل:** تم تطبيق منطق استعادة القيم:
```typescript
if (checkboxType !== currentUnitType) {
  setForcedValues(originalValuesRef.current);
  pendingSetFieldValue.current("field", originalValue);
}
```

### 2. التخزين المؤقت لا ينتعش

**الحل:**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// وبعد التحديث:
await revalidateServiceCache(`service-${serviceType}`);
```

### 3. إنشاء وحدة مكررة

**الحل:** التحقق المسبق قبل الإرسال باستخدام `mapArabicToEnglish()`

### 4. عدم القدرة على حذف وحدة بها سائقين

**السلوك المتوقع:** هذه حماية مقصودة.

### 5. عدم تطابق القيم العربية/الإنجليزية

**الحل:** استخدام `mapArabicToEnglish()` قبل:
- إرسال النموذج
- التحقق من التكرار
- المقارنة

### 6. فقدان موضع التمرير عند تغيير الوحدة

**الحل:** حفظ واستعادة موضع التمرير:
```typescript
scrollPositionRef.current = window.scrollY;
router.replace(url, { scroll: false });

requestAnimationFrame(() => {
  window.scrollTo({ top: scrollPositionRef.current, behavior: "instant" });
});
```

### 7. النموذج يعيد التهيئة بعد التحديث

**الحل:** استخدام القيم القسرية:
```typescript
<Formik
  initialValues={{ field: forcedValues?.field ?? propValue }}
  enableReinitialize={forcedValues === null}
/>
```

---

## التحسينات

### 1. Server-Side Rendering
- الصفحات الرئيسية تستخدم Server Components
- جلب البيانات من السيرفر يقلل طلبات API

### 2. جلب البيانات الشرطي
```typescript
if (params.serviceType === "fontas") {
  fontasUnits = await fetcher("/fontasUnits?itemPerPage=50");
}
```

### 3. Pagination
- قائمة الوحدات مقسمة لصفحات
- افتراضي 50 عنصر للقائمة المنسدلة

### 4. Loading States
- شاشة تحميل عامة
- حالات تحميل على مستوى المكون

---
