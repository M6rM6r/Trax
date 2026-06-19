# السائقين (Drivers)

## نظرة عامة

قسم السائقين هو أحد أهم أقسام لوحة التحكم، يتيح إدارة جميع السائقين بمختلف أنواع الخدمات (تاكسي، فونطاس، نقل خفيف، ونش، سائق بدون سيارة، تواريخ مهمة).

---

## الصفحات

### 1. جميع السائقين

- **المسار:** `/drivers`
- **الملف:** `app/[locale]/drivers/page.tsx`
- **الوصف:** عرض قائمة بجميع السائقين المسجلين في النظام

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/drivers` |
| **Method** | `GET` |
| **Response Type** | `DriversResponse` |

**Query Parameters:**
```
?page=1
&itemPerPage=10
&services=taxi,fontas,wensh
&filters[is_active]=1
&filters[gender]=male
&filters[rating][min]=0
&filters[rating][max]=5
&filters[created_at_date][from]=YYYY-MM-DD
&filters[created_at_date][to]=YYYY-MM-DD
&filters[vehicels][vehicle_type]=taxi
&filters[licenseType]=private
&filters[wallet_balance][min]=0
&filters[wallet_balance][max]=2000
&filters[region_id]=1
&filters[step]=1
```

---

#### الأعمدة المعروضة

| العمود | الحقل | الوصف |
|--------|-------|-------|
| تحديد | `select` | Checkbox لتحديد الصفوف |
| الاسم | `name` | اسم السائق مع الصورة والجنس وحالة الاتصال |
| بريد إلكتروني | `email` | البريد الإلكتروني |
| الجوال | `mobile` | رقم الجوال |
| تاريخ الإنضمام | `created_at` | تاريخ التسجيل |
| الرقم القومى | `identity_number` | رقم الهوية |
| نوع الخدمة | `vehicle_type` | تاكسي/فونطاس/نقل خفيف/ونش |
| نوع المركبة | `brand` | ماركة السيارة |
| طراز المركبة | `car_model` | موديل السيارة |
| الحالة | `is_active` | نشط / غير نشط |
| عدد الرحلات | `rides_count` | عدد الرحلات المكتملة |
| إجمالى المحفظة | `wallet_balance` | رصيد المحفظة |
| المدينة | `city` | المدينة |
| المنطقة | `region` | المنطقة |
| حالة وصل | `status` | حالة التسجيل في وصل |
| الإجراء | `actions` | عرض الملف الشخصي |

---

#### الفلاتر المتاحة

| الفلتر | النوع | الوصف | Parameter |
|--------|-------|-------|-----------|
| النوع (الجنس) | `Checkbox` | ذكر / أنثى | `filters[gender]` |
| الحالة | `Checkbox` | نشط / غير نشط | `filters[is_active]` |
| التقييم | `Range (0-5)` | نطاق التقييم (بخطوات 0.5) | `filters[rating][min/max]` |
| رصيد المحفظة | `Range (0-2000)` | نطاق الرصيد (معطل حالياً) | `filters[wallet_balance][min/max]` |
| نوع الرخصة | `Select` | أنواع رخص القيادة | `filters[licenseType]` |
| المنطقة | `Select` | اختيار المنطقة | `filters[region_id]` |
| تاريخ الإنضمام | `Date Range` | من - إلى | `filters[created_at_date][from/to]` |
| الخطوة الحالية | `Checkbox (1-4)` | خطوة التسجيل | `filters[step]` |

**أنواع رخص القيادة:**

| النوع | القيمة | الوصف |
|-------|--------|-------|
| `private` | خاصة | رخصة خاصة |
| `professional_light` | مهنية درجة ثالثة | المركبات الخفيفة |
| `professional_medium` | مهنية درجة ثانية | المركبات المتوسطة |
| `professional_heavy` | مهنية درجة أولى | المركبات الثقيلة |
| `motorcycle` | دراجة نارية | الدراجات |
| `construction` | معدات / إنشائية | معدات البناء |
| `public` | عامة / نقل جماعي | النقل العام |

**API لجلب المناطق:**
```
GET /getRegions
```

---

### 2. قواعد السائقين

- **المسار:** `/drivers/rules`
- **الملف:** `app/[locale]/drivers/rules/page.tsx`
- **الوصف:** إدارة القواعد والشروط الخاصة بالسائقين

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/rules` |
| **Method** | `GET` |
| **Response Type** | `RulesResponse` |

#### الأعمدة المعروضة

| العمود | الحقل | الوصف |
|--------|-------|-------|
| الاسم بالعربية | `title_ar` | عنوان القاعدة بالعربي |
| الاسم بالإنجليزية | `title_en` | عنوان القاعدة بالإنجليزي |
| الحالة | `is_active` | مفعل / غير مفعل |
| الإجراء | `actions` | عرض / تعديل / حذف |

#### إضافة قاعدة جديدة

- **المسار:** `/drivers/rules/add`

**API Call:**
```
POST /rules
```

#### تعديل قاعدة

- **المسار:** `/drivers/rules/[id]/edit`

**API Call:**
```
PUT /rules/{id}
```

#### حذف قاعدة

**API Call:**
```
DELETE /rules/{id}
```

---

### 3. السائقون الموقفون

- **المسار:** `/drivers/blocked`
- **الملف:** `app/[locale]/drivers/(stopped)/blocked/page.tsx`
- **الوصف:** عرض السائقين غير النشطين

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/drivers?filters[is_active]=0` |
| **Method** | `GET` |

**التبويبات:**
- السائقون الموقفون (`/drivers/blocked`)
- السائقون المحذوفون (`/drivers/deleted`)

---

### 4. الإحصائيات

- **المسار:** `/drivers/analytics`
- **الملف:** `app/[locale]/drivers/analytics/page.tsx`
- **الوصف:** عرض إحصائيات وتحليلات السائقين

#### API Call

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
    total_active_taxi_drivers: number;
    total_active_fontas_drivers: number;
    total_active_light_transportation_drivers: number;
    total_active_wensh_drivers: number;
    total_with_out_cars_drivers: number;
    total_active_important_dates_drivers: number;
  }
}
```

**المكونات المعروضة:**

1. **كروت الإحصائيات (6 كروت):**

| الكارت | اللون | الأيقونة |
|--------|-------|----------|
| سائقين تاكسي | `#3B82F6` (أزرق) | Car |
| سائقين وايت ماء | `#10B981` (أخضر) | Droplet |
| سائقين النقل الخفيف | `#F59E0B` (برتقالي) | Truck |
| سائقين سطحات ودينات | `#EF4444` (أحمر) | Wrench |
| سائقين بدون سيارة | `#8B5CF6` (بنفسجي) | UserX |
| سائقين تواريخ مهمة | `#14B8A6` (تركواز) | Calendar |

2. **الرسوم البيانية:**
   - Bar Chart لمقارنة أعداد السائقين حسب نوع الخدمة
   - Pie Chart (Donut) لتوزيع النسب المئوية

---

### 5. صفحة تفاصيل السائق

#### أ. الملف الشخصي
- **المسار:** `/drivers/{serviceType}/{id}/profile`
- **الملف:** `app/[locale]/drivers/{serviceType}/[id]/profile/page.tsx`
- **الوصف:** عرض جميع بيانات السائق

**أنواع الخدمات (serviceType):**
- `taxi` - تاكسي
- `fontas` - فونطاس (وايت ماء)
- `lightTransportation` - النقل الخفيف
- `wensh` - سطحات ودينات
- `driversWithoutCar` - سائق بدون سيارة
- `outages` - العطالات

**API Call:**
```
GET /drivers/{id}
```

**Response Type:** `DriverResponse`

**الأقسام المعروضة:**

| القسم | البيانات |
|-------|----------|
| **معلومات الرأس** | الصورة، الاسم، التقييم، تاريخ التسجيل، المدينة، عدد الرحلات |
| **معلومات المستخدم** | الاسم، الجنس، الجوال، البريد، رقم الهوية، تاريخ الميلاد |
| **المستندات** | صورة الهوية، صورة الرخصة، استمارة المركبة |
| **معلومات اللوحة** | نوع اللوحة، رقم التسلسل، رقم اللوحة، الحروف |
| **ملخص المحفظة** | الرصيد الكلي، رصيد السحب، عدد المعاملات |
| **معلومات المركبة** | النوع، الطراز، اللون، عدد المقاعد، القواعد |
| **معلومات الصهريج** (فونطاس فقط) | صالح للشرب، حجم الصهريج، السعر الأساسي |

---

#### ب. التحقق من وصل (Taxi فقط)

**API Call:**
```
POST /drivers/checkWaslValidity
Content-Type: multipart/form-data

identity_number: string
date_of_birth: string
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

---

#### ج. إحصائيات السائق الفردي
- **المسار:** `/drivers/{id}/analytics`

---

#### د. رحلات السائق
- **المسار:** `/drivers/outages/{id}`

---

#### هـ. محفظة السائق
- **المسار:** `/drivers/outages/{id}/wallet`

---

#### و. تعديل بيانات السائق

**API Call:**
```
PUT /drivers/{id}
```

---

#### ز. حظر/رفع الحظر عن السائق

**API Call:**
```
PUT /drivers/{id}/toggle-active
```

---

#### ح. حذف السائق

**API Call:**
```
DELETE /drivers/{id}
```

---

## أنواع الخدمات (Vehicle Types)

| النوع | القيمة | الوصف |
|-------|--------|-------|
| `taxi` | تاكسي | زيم ركاب |
| `fontas` | فونطاس | وايت ماء |
| `wensh` | ونش | سطحات ودينات |
| `light_transportation` | نقل خفيف | النقل الخفيف |
| `driver_without_car` | سائق بدون سيارة | سائق بدون مركبة |
| `important_dates` | تواريخ مهمة | اجتماعات ومواعيد |
| `fast_support` | دعم سريع | الدعم السريع |
| `fuel` | وقود | خدمة الوقود |
| `towing` | سحب | خدمة السحب |

---

## هيكل الملفات

```
app/[locale]/drivers/
├── page.tsx                    # جميع السائقين
├── layout.tsx                  # Layout مشترك
├── (stopped)/
│   ├── blocked/
│   │   └── page.tsx           # السائقون الموقفون
│   └── deleted/
│       └── page.tsx           # السائقون المحذوفون
├── analytics/
│   └── page.tsx               # الإحصائيات
├── rules/
│   ├── page.tsx               # قواعد السائقين
│   ├── columns.tsx            # أعمدة الجدول
│   ├── add/
│   │   └── page.tsx           # إضافة قاعدة
│   └── [id]/
│       ├── page.tsx           # عرض القاعدة
│       └── edit/
│           └── page.tsx       # تعديل القاعدة
├── [id]/
│   └── analytics/
│       └── page.tsx           # إحصائيات السائق
├── taxi/
│   └── [id]/
│       └── profile/
│           └── page.tsx       # ملف سائق تاكسي
├── fontas/
│   └── [id]/
│       └── profile/
│           └── page.tsx       # ملف سائق فونطاس
├── wensh/
│   └── [id]/
│       └── profile/
│           └── page.tsx       # ملف سائق ونش
├── lightTransportation/
│   └── [id]/
│       └── profile/
│           └── page.tsx       # ملف سائق نقل خفيف
├── driversWithoutCar/
│   └── [id]/
│       └── profile/
│           └── page.tsx       # ملف سائق بدون سيارة
└── outages/
    └── [id]/
        ├── page.tsx           # رحلات السائق
        └── wallet/
            └── page.tsx       # محفظة السائق

components/Drivers/
├── FilterDialog/
│   └── index.tsx              # Dialog الفلترة
├── DriversTableColumns/
│   ├── index.tsx              # أعمدة الجدول الرئيسية
│   └── SpecialColumns/        # أعمدة خاصة لكل نوع
├── DriverProfileComponent/
│   └── index.tsx              # مكون الملف الشخصي
├── DriverSortingComponent/
│   └── index.tsx              # مكون الترتيب
├── Analytics/
│   ├── AllDriversAnalytics.tsx    # إحصائيات جميع السائقين
│   └── IndividualDriverAnalytics.tsx  # إحصائيات سائق فردي
├── Pricing/
│   └── index.tsx              # إعدادات التسعير
└── StoppedDriversTabs/
    └── index.tsx              # تبويبات السائقين الموقفين
```

---

## ملخص API Calls

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/drivers` | `GET` | جلب قائمة السائقين |
| `/drivers/{id}` | `GET` | جلب بيانات سائق محدد |
| `/drivers/{id}` | `PUT` | تعديل بيانات سائق |
| `/drivers/{id}` | `DELETE` | حذف سائق |
| `/drivers/{id}/toggle-active` | `PUT` | حظر/رفع الحظر |
| `/drivers/checkWaslValidity` | `POST` | التحقق من وصل |
| `/drivers-statistics?type=main-services` | `GET` | إحصائيات السائقين |
| `/rules` | `GET` | جلب قواعد السائقين |
| `/rules` | `POST` | إضافة قاعدة |
| `/rules/{id}` | `PUT` | تعديل قاعدة |
| `/rules/{id}` | `DELETE` | حذف قاعدة |
| `/getRegions` | `GET` | جلب المناطق |

---

## الصلاحيات المطلوبة

| الإجراء | الصلاحية |
|--------|----------|
| عرض السائقين | `drivers.list` |
| تعديل سائق | `drivers.update` |
| حذف سائق | `drivers.delete` |
| حظر سائق | `drivers.block` |
| عرض الإحصائيات | `drivers.analytics` |
| إدارة القواعد | `drivers.rules` |

---

## ملاحظات تقنية

1. **Dynamic Routing:** يتم توجيه السائق لصفحة الملف الشخصي حسب نوع الخدمة
2. **WASL Integration:** التحقق من صحة بيانات السائق عبر نظام وصل (للتاكسي فقط)
3. **Conditional Rendering:** عرض معلومات مختلفة حسب نوع المركبة (ونش، فونطاس، نقل خفيف)
4. **Form Validation:** استخدام Yup للتحقق من صحة البيانات
5. **Recharts:** رسوم بيانية تفاعلية للإحصائيات مع تحميل ديناميكي

---