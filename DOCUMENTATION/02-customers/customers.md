# العملاء (Customers)

## نظرة عامة

قسم العملاء يتيح إدارة جميع عملاء التطبيق، بما في ذلك عرض البيانات، الفلترة، الإضافة، التعديل، وعرض الإحصائيات.

---

## الصفحات

### 1. جميع العملاء

- **المسار:** `/customers`
- **الملف:** `app/[locale]/customers/page.tsx`
- **الوصف:** عرض قائمة بجميع العملاء المسجلين في النظام مع إمكانية الفلترة والبحث

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/customers` |
| **Method** | `GET` |
| **Response Type** | `CustomersResponse` |
| **Cache** | `revalidate: 30` (كل 30 ثانية) |

**Query Parameters:**
```
?page=1
&itemPerPage=10
&filters[ride_date][min]=YYYY-MM-DD
&filters[ride_date][max]=YYYY-MM-DD
&filters[rides_count][min]=0
&filters[rides_count][max]=1000
&filters[rides_amount][min]=0
&filters[rides_amount][max]=50000
&filters[is_active][]=1
&filters[region_id][]=1
```

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    records: CustomerRecord[];
    pagination_data: {
      previous: null | string;
      next: string;
      current_page: number;
      per_page: number;
      total_pages: number;
      count: number;
      total_records: number;
    }
  }
}
```

---

#### الأعمدة المعروضة

| العمود | الحقل | الوصف |
|--------|-------|-------|
| تحديد | `select` | Checkbox لتحديد الصفوف |
| الاسم | `name` | اسم العميل مع الصورة والجنس |
| الجوال | `mobile` | رقم الجوال مع كود الدولة |
| بريد إلكتروني | `email` | البريد الإلكتروني |
| تاريخ الإنضمام | `created_at` | تاريخ التسجيل |
| إجمالى عدد الرحلات | `rides_count` | عدد الرحلات المكتملة |
| إجمالى المدفوعات | `rides_amount` | إجمالي المبالغ المدفوعة (ر.س) |
| الحالة | `is_active` | نشط / غير نشط |
| الإجراء | `actions` | عرض الملف الشخصي |

---

#### الفلاتر المتاحة

| الفلتر | النوع | الوصف | Parameter |
|--------|-------|-------|-----------|
| التواريخ (من) | `Date` | تاريخ بداية الرحلات | `filters[ride_date][min]` |
| التواريخ (إلى) | `Date` | تاريخ نهاية الرحلات | `filters[ride_date][max]` |
| عدد الرحلات | `Range (0-1000)` | نطاق عدد الرحلات | `filters[rides_count][min/max]` |
| حدود المدفوعات | `Range (0-50000)` | نطاق المبالغ المدفوعة | `filters[rides_amount][min/max]` |
| الحالة | `Checkbox` | نشط (1) / غير نشط (0) | `filters[is_active][]` |
| المدينة | `Checkbox` | اختيار مدينة أو أكثر | `filters[region_id][]` |

**API لجلب المدن:**
```
GET /modelDDLList?model_name=Zone&filters[type]=region&cols[0]=name_en&cols[1]=name_ar
```

---

#### إضافة عميل جديد

**الحقول المطلوبة:**

| الحقل | النوع | الوصف | مطلوب |
|-------|-------|-------|-------|
| `profile_image` | `File` | صورة العميل | لا (صورة افتراضية) |
| `name` | `string` | الاسم الكامل (3 حروف على الأقل، بدون أرقام) | نعم |
| `gender` | `string` | الجنس (male/female) | نعم |
| `mobile` | `string` | رقم الجوال | نعم |
| `country_code` | `string` | كود الدولة | نعم |
| `email` | `string` | البريد الإلكتروني | لا |

**API Call:**
```
POST /customers
Content-Type: multipart/form-data
```

---

### 2. العملاء الموقوفون

- **المسار:** `/customers/blocked`
- **الملف:** `app/[locale]/customers/blocked/page.tsx`
- **الوصف:** عرض العملاء غير النشطين

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/customers?filters[is_active]=0` |
| **Method** | `GET` |
| **Response Type** | `CustomersResponse` |

**التبويبات:**
- الغير نشطون (`/customers/blocked`)
- المحذوفون (`/customers/deleted`)

---

### 3. الإحصائيات

- **المسار:** `/customers/analytics`
- **الملف:** `app/[locale]/customers/analytics/page.tsx`
- **الوصف:** عرض إحصائيات وتحليلات العملاء

#### API Calls

| Endpoint | الوصف |
|----------|-------|
| `/drivers-statistics?type=active-drivers` | إجمالي السائقين النشطين |
| `/drivers-statistics?type=customers-services` | إحصائيات العملاء والخدمات |

**البيانات المعروضة:**

| الإحصائية | الوصف |
|-----------|-------|
| العملاء النشطين | `total_active_customers` |
| السائقين النشطين | `total_active_drivers` |
| إجمالي المستخدمين | مجموع العملاء + السائقين |
| نسبة العملاء | نسبة العملاء من إجمالي المستخدمين |

**المكونات المعروضة:**
1. **كروت الإحصائيات (4 كروت):**
   - العملاء النشطين
   - السائقين النشطين
   - إجمالي المستخدمين
   - نسبة العملاء

2. **الرسوم البيانية:**
   - Pie Chart لتوزيع المستخدمين (عملاء vs سائقين)
   - متوسط العملاء لكل خدمة
   - شريط التقدم لنسبة العملاء

---

### 4. صفحة تفاصيل العميل

#### أ. رحلات العميل
- **المسار:** `/customers/[id]`
- **الملف:** `app/[locale]/customers/[id]/page.tsx`
- **الوصف:** عرض جميع رحلات العميل

**API Call:**
```
GET /customers/{id}
```

**Response Type:** `CustomerProfileResponse`

---

#### ب. الملف الشخصي
- **المسار:** `/customers/[id]/profile`
- **الملف:** `app/[locale]/customers/[id]/profile/page.tsx`
- **الوصف:** عرض وتعديل بيانات العميل

**API Call:**
```
GET /customers/{id}
```

**البيانات المعروضة:**

| القسم | البيانات |
|-------|----------|
| **معلومات الملف الشخصي** | الصورة، الاسم، الجنس، تاريخ الإنضمام |
| **معلومات الاتصال** | البريد الإلكتروني، الجوال |
| **إحصائيات الرحلات** | عدد الرحلات، إجمالي المبالغ المدفوعة |
| **المحفظة** | جدول العمليات المالية |

---

#### تعديل بيانات العميل

**API Call:**
```
POST /customers/{id}
Content-Type: multipart/form-data

_method: put
profile_image: File (optional)
name: string
email: string
gender: string
country_code: string
mobile: string
```

**حقول التعديل:**

| الحقل | النوع | الوصف |
|-------|-------|-------|
| صورة الملف الشخصي | `File` | صورة العميل |
| الاسم الكامل | `string` | الاسم (3 حروف على الأقل) |
| الجنس | `select` | ذكر / انثى |
| الجوال | `phone` | رقم الجوال مع كود الدولة |
| البريد الإلكتروني | `email` | اختياري |

---

## هيكل الملفات

```
app/[locale]/customers/
├── page.tsx                    # جميع العملاء
├── columns.tsx                 # تعريف أعمدة الجدول
├── blocked/
│   ├── page.tsx               # العملاء الموقوفون
│   └── columns.tsx
├── deleted/
│   └── page.tsx               # العملاء المحذوفون
├── analytics/
│   └── page.tsx               # الإحصائيات
└── [id]/
    ├── page.tsx               # رحلات العميل
    ├── columns.tsx
    └── profile/
        └── page.tsx           # الملف الشخصي

components/Customers/
├── FilterComponent/
│   └── index.tsx              # مكون الفلترة
├── AddCustomer/
│   └── index.tsx              # نموذج إضافة عميل
├── AddCustomerDialog/
│   └── index.tsx              # Dialog إضافة عميل
├── EditCustomer/
│   └── index.tsx              # نموذج تعديل عميل
└── Analytics/
    └── CustomerAnalytics.tsx  # مكون الإحصائيات
```

---

## ملخص API Calls

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/customers` | `GET` | جلب قائمة العملاء |
| `/customers` | `POST` | إضافة عميل جديد |
| `/customers/{id}` | `GET` | جلب بيانات عميل محدد |
| `/customers/{id}` | `POST` (PUT) | تعديل بيانات عميل |
| `/customers?filters[is_active]=0` | `GET` | العملاء الموقوفون |
| `/drivers-statistics?type=active-drivers` | `GET` | إحصائيات السائقين |
| `/drivers-statistics?type=customers-services` | `GET` | إحصائيات العملاء |
| `/modelDDLList?model_name=Zone&filters[type]=region` | `GET` | قائمة المدن |

---

## الصلاحيات المطلوبة

| الإجراء | الصلاحية |
|--------|----------|
| عرض العملاء | `customers.list` |
| إضافة عميل | `customers.create` |
| تعديل عميل | `customers.update` |
| حذف عميل | `customers.delete` |
| عرض الإحصائيات | `customers.analytics` |

---

## ملاحظات تقنية

1. **Lazy Loading:** مكونات الفلترة وإضافة العميل يتم تحميلها بشكل ديناميكي
2. **Form Validation:** يستخدم Yup للتحقق من صحة البيانات
3. **Formik:** لإدارة النماذج
4. **Scroll Preservation:** الحفاظ على موضع التمرير عند تطبيق الفلاتر
5. **Export:** إمكانية تصدير البيانات عبر `exportLink="customers"`
6. **Bulk Delete:** إمكانية الحذف الجماعي عبر `linkToDeleteAll="customers"`

---

