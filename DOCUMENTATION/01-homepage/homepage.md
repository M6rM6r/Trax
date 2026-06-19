# الصفحة الرئيسية (Homepage)

## نظرة عامة

الصفحة الرئيسية هي لوحة التحكم الشاملة التي تعرض ملخص الأداء العام للتطبيق. تحتوي على إحصائيات رئيسية ورسوم بيانية تفاعلية لمتابعة حالة النظام.

- **المسار:** `/`
- **الملف:** `app/[locale]/page.tsx`
- **المكون الرئيسي:** `components/Home/Analytics/OverviewAnalytics.tsx`

---

## API Calls

تستخدم الصفحة الرئيسية 4 API Calls يتم تحميلها بشكل متوازي (Parallel) لتحسين الأداء:

### 1. إجمالي السائقين النشطين

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/drivers-statistics?type=active-drivers` |
| **Method** | `GET` |
| **Response Type** | `TotalActiveDriversResponse` |

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  data: {
    total_active_drivers: number;  // إجمالي السائقين النشطين
  }
}
```

---

### 2. توزيع الخدمات الرئيسية

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/drivers-statistics?type=main-services` |
| **Method** | `GET` |
| **Response Type** | `TotalMainServicesResponse` |

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  data: {
    total_active_taxi_drivers: number;                    // سائقين التاكسي
    total_active_fontas_drivers: number;                  // سائقين الفونطاس
    total_active_light_transportation_drivers: number;    // سائقين النقل الخفيف
    total_active_wensh_drivers: number;                   // سائقين الونش
    total_with_out_cars_drivers: number;                  // السائقين بدون سيارات
    total_active_important_dates_drivers: number;         // سائقين المناسبات الخاصة
  }
}
```

---

### 3. إحصائيات العملاء والخدمات

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/drivers-statistics?type=customers-services` |
| **Method** | `GET` |
| **Response Type** | `TotalActiveCustomersResponse` |

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  data: {
    total_active_customers: number;  // إجمالي العملاء النشطين
    total_services: number;          // إجمالي الخدمات
  }
}
```

---

### 4. سائقين العطالات

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/drivers-statistics?type=faults` |
| **Method** | `GET` |
| **Response Type** | `TotalFaultsDrivers` |

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  data: {
    fuel_active_drivers: number;    // سائقين الوقود
    tires_active_drivers: number;   // سائقين الإطارات
    towing_active_drivers: number;  // سائقين السحب
  }
}
```

---

## المكونات المعروضة

### 1. كروت الإحصائيات الرئيسية (Dashboard Cards)

تعرض 3 كروت رئيسية في أعلى الصفحة:

| الكارت | الوصف | رابط التفاصيل |
|--------|-------|---------------|
| **جميع الخدمات** | إجمالي عدد الخدمات في النظام | `/services/analytics` |
| **مقدمو الخدمات** | إجمالي عدد السائقين النشطين | `/drivers/analytics` |
| **جميع العملاء** | إجمالي عدد العملاء | `/customers/analytics` |

**خصائص كل كارت:**
- أيقونة مميزة
- تدرج لوني (Gradient)
- زر "عرض الإحصائيات" للانتقال لصفحة التفاصيل
- مؤشر الاتجاه (Trend) - نسبة مئوية

---

### 2. نظرة عامة - الرسوم البيانية

#### أ. التوزيع النسبي (Pie Chart)

يعرض توزيع نسبي لـ 4 فئات:

| الفئة | اللون | الوصف |
|-------|-------|-------|
| سائقين العطالات | `#DC2626` (أحمر) | مجموع سائقين الوقود + الإطارات + السحب |
| السائقين النشطين | `#2563EB` (أزرق) | إجمالي السائقين النشطين |
| الخدمات | `#16A34A` (أخضر) | إجمالي الخدمات |
| العملاء النشطين | `#F59E0B` (برتقالي) | إجمالي العملاء النشطين |

**المعلومات المعروضة:**
- الإجمالي في منتصف الدائرة
- نسبة كل فئة من الإجمالي

---

#### ب. مقارنة الأداء (Bar Chart)

يعرض نفس البيانات السابقة في شكل أعمدة أفقية للمقارنة البصرية السريعة.

---

### 3. توزيع الخدمات (Service Distribution)

يعرض تفاصيل الخدمات الرئيسية الأربعة:

| الخدمة | اللون | المتغير |
|--------|-------|---------|
| سائقين التاكسي | `#8B5CF6` (بنفسجي) | `total_active_taxi_drivers` |
| سائقين الفونطاس | `#14B8A6` (تركواز) | `total_active_fontas_drivers` |
| سائقين النقل الخفيف | `#F97316` (برتقالي) | `total_active_light_transportation_drivers` |
| سائقين الونش | `#EC4899` (وردي) | `total_active_wensh_drivers` |

**المعلومات الإضافية:**
- **الخدمة الأكثر نشاطاً:** تُظهر الخدمة ذات أعلى عدد سائقين
- **إحصائيات التوزيع:**
  - عدد الخدمات المختلفة
  - متوسط الخدمات
  - أقل خدمة

---

## هيكل الملفات

```
app/[locale]/page.tsx                              # الصفحة الرئيسية
components/Home/Analytics/OverviewAnalytics.tsx    # مكون العرض الرئيسي
lib/types/responseTypes.ts                         # تعريفات الأنواع
```

---

## ملاحظات تقنية

1. **Server-Side Rendering:** الصفحة تستخدم SSR حيث يتم جلب البيانات على الـ Server قبل الإرسال للمستخدم.

2. **Parallel Fetching:** يتم جلب جميع الـ API Calls بشكل متوازي باستخدام `Promise.all` لتحسين الأداء.

3. **Dynamic Import:** مكون `OverviewAnalytics` يتم تحميله بشكل ديناميكي مع عرض Skeleton أثناء التحميل.

4. **Recharts:** تستخدم الصفحة مكتبة Recharts للرسوم البيانية مع تحميل ديناميكي (Client-side only).

5. **Memoization:** جميع المكونات الفرعية تستخدم `memo` و `useMemo` لتحسين الأداء.

---

## الصلاحيات المطلوبة

لا توجد صلاحيات محددة - الصفحة متاحة لجميع المستخدمين المسجلين.

