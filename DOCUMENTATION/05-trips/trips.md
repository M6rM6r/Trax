# الرحلات (Trips)

## نظرة عامة

قسم الرحلات يتيح عرض ومتابعة جميع الرحلات في النظام، بما في ذلك تفاصيل كل رحلة، حالة الدفع، بيانات العميل والسائق، والإحصائيات العامة.

---

## الصفحات

### 1. جميع الرحلات

- **المسار:** `/trips`
- **الملف:** `app/[locale]/trips/page.tsx`
- **الوصف:** عرض قائمة بجميع الرحلات المسجلة في النظام مع إمكانية الفلترة والترتيب

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/rides` |
| **Method** | `GET` |
| **Response Type** | `CustomersResponse` |
| **Cache** | `revalidate: 30` (كل 30 ثانية) |

**Query Parameters:**
```
?page=1
&itemPerPage=10
&filters[requested_at][min]=YYYY-MM-DD HH:MM:SS
&filters[requested_at][max]=YYYY-MM-DD HH:MM:SS
&filters[price][min]=0
&filters[price][max]=1000
&filters[ride_distance][min]=0
&filters[ride_distance][max]=5000
&filters[ride_duration][min]=0
&filters[ride_duration][max]=500
&filters[payment_method]=cash,creditcard
&filters[payment_status]=paid,pending
&filters[status]=done,pending
&filters[service_type]=taxi,fontas
&sortBy=price=desc,ride_distance=asc
```

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    records: Ride[];
    pagination_data: {
      current_page: number;
      total_pages: number;
      per_page: number;
      total_records: number;
      count: number;
    }
  }
}
```

---

#### الأعمدة المعروضة

| العمود | الحقل | الوصف |
|--------|-------|-------|
| تحديد | `select` | Checkbox لتحديد الصفوف |
| اسم العميل | `customerName` | اسم العميل مع الصورة والجنس |
| جوال العميل | `customer_phone` | رقم جوال العميل (يعرض "لا يوجد رقم" في حالة عدم وجوده) |
| اسم السائق | `driverName` | اسم السائق أو "غير موجود - تم إلغاء الرحلة" في حالة الإلغاء |
| جوال السائق | `driver_phone` | رقم جوال السائق مع كود الدولة |
| نوع الخدمة | `service_type` | نوع الخدمة (تاكسي، فونتاس، ونش، إلخ) |
| تاريخ الطلب | `requested_at` | تاريخ ووقت طلب الرحلة |
| التكلفة الأولية | `price` | السعر بالريال السعودي (ر.س) |
| المسافة المقطوعة | `ride_distance` | المسافة بالكيلومتر (ك.م) أو "غير محددة" |
| مدة الرحلة | `ride_duration` | المدة بالدقائق (محددة بخانتين عشريتين) |
| طريقة الدفع | `payment_method` | طريقة الدفع أو "غير محددة" |
| حالة الدفع | `paymentStatus` | حالة الدفع مع تلوين (أخضر: تمت، أصفر: قيد الانتظار) |
| حالة الرحلة | `tripStatus` | حالة الرحلة مع تلوين (أخضر: مكتملة/مقبولة) |
| الإجراء | `actions` | أيقونة عرض تفاصيل الرحلة |

---

#### الفلاتر المتاحة

| الفلتر | النوع | الوصف | Parameter |
|--------|-------|-------|-----------|
| تاريخ الطلب (من) | `Date` | تاريخ بداية البحث (لا يمكن اختيار تاريخ مستقبلي) | `filters[requested_at][min]` |
| تاريخ الطلب (إلى) | `Date` | تاريخ نهاية البحث (لا يمكن أن يسبق تاريخ البداية) | `filters[requested_at][max]` |
| نطاق السعر | `Range (0-1000)` | نطاق السعر بالريال (معطل حالياً) | `filters[price][min/max]` |
| نطاق المسافة | `Range (0-5000)` | نطاق المسافة بالكيلومتر (معطل حالياً) | `filters[ride_distance][min/max]` |
| نطاق المدة | `Range (0-500)` | نطاق المدة بالدقائق (معطل حالياً) | `filters[ride_duration][min/max]` |
| طريقة الدفع | `Multi-Select` | كاش، كارت بنكي، STC Pay، Apple Pay | `filters[payment_method]` |
| حالة الدفع | `Multi-Select` | تمت بنجاح، لم يتم الدفع، قيد الانتظار | `filters[payment_status]` |
| حالة الرحلة | `Multi-Select` | مكتملة، قيد الانتظار، مقبولة، السائق وصل، ملغاة من العميل، ملغاة من السائق، في الطريق، قيد المعالجة، مجدولة | `filters[status]` |
| نوع الخدمة | `Multi-Select` | تاكسي، وقود، إطارات، سحب، نقل خفيف، سائق بدون سيارة، مناسبات، ونش | `filters[service_type]` |

**ملاحظة:** فلاتر النطاق (السعر، المسافة، المدة) معطلة حالياً في الواجهة لكن البنية التحتية موجودة.

---

#### الترتيب (Sorting)

> **ملاحظة:** ميزة الترتيب معطلة حالياً في الواجهة (`disabled={true}`)

| حقل الترتيب | الخيارات |
|-------------|----------|
| السعر (`price`) | من الأدنى إلى الأعلى / من الأعلى إلى الأدنى |
| المسافة (`ride_distance`) | من الأدنى إلى الأعلى / من الأعلى إلى الأدنى |
| المدة (`ride_duration`) | من الأدنى إلى الأعلى / من الأعلى إلى الأدنى |

**صيغة الترتيب في الـ Query:** `sortBy=price=desc,ride_distance=asc`

---

### 2. تفاصيل الرحلة

- **المسار:** `/trips/[id]`
- **الملف:** `app/[locale]/trips/[id]/page.tsx`
- **الوصف:** عرض جميع تفاصيل رحلة محددة

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/rides/{id}` |
| **Method** | `GET` |
| **Response Type** | `{ data: { ride: Ride } }` |

#### التخطيط (Layout)

الصفحة مقسمة إلى ثلاثة أعمدة على الشاشات الكبيرة:
- **يسار (2/3):** معلومات الرحلة والدفع
- **يمين (1/3):** بيانات العميل/السائق وملخص الرحلة

#### أ. بطاقة حالة الرحلة

| العنصر | الوصف |
|--------|-------|
| حالة الرحلة | Badge بألوان مختلفة حسب الحالة |
| نوع الخدمة | Badge يوضح نوع الخدمة |
| رحلة فورية | Badge أخضر إذا كانت الرحلة فورية (`is_now`) |
| مناسبة مهمة | Badge بنفسجي إذا كانت مناسبة مهمة (`is_important_date`) |

**ألوان حالة الرحلة:**

| الحالة | اللون |
|--------|-------|
| `canceled_automatically` | أحمر (destructive) |
| `pending` | خط خارجي (outline) |
| `completed` | أساسي (primary) |
| `in_progress` | ثانوي (secondary) |
| `accepted` | ثانوي (secondary) |

#### ب. معلومات الموقع

| الموقع | الأيقونة | اللون | البيانات |
|--------|---------|-------|----------|
| نقطة الانطلاق | MapPinned | أزرق | العنوان، خط العرض، خط الطول |
| الوجهة | MapPin | أحمر | العنوان، خط العرض، خط الطول |

#### ج. معلومات التوقيت

| الحقل | الأيقونة | الوصف |
|-------|---------|-------|
| تاريخ الطلب | Calendar | تاريخ ووقت طلب الرحلة |
| وقت البداية | Clock (أخضر) | وقت بدء الرحلة (إن وُجد) |
| وقت الانتهاء | Clock (رمادي) | وقت انتهاء الرحلة (إن وُجد) |

#### د. مقاييس الرحلة (3 أعمدة)

| المقياس | الوصف |
|---------|-------|
| المسافة المتوقعة | المسافة بالكيلومتر |
| المدة المتوقعة | المدة بالدقائق |
| الساعات الإضافية | ساعات إضافية بعد التقدير الأولي |

#### هـ. بطاقة معلومات الدفع

**قسم التسعير:**
- السعر الأساسي
- السعر النهائي (إن اختلف عن الأساسي)

**ألوان حالة الدفع:**

| الحالة | اللون |
|--------|-------|
| `paid` | أخضر (success) |
| `pending` | أصفر (warning) |
| `failed` | أحمر (destructive) |
| `refunded` | خط خارجي (outline) |

**البيانات المعروضة:** حالة الدفع، طريقة الدفع، تاريخ الدفع (إن وُجد)

#### و. بطاقة معلومات العميل

| البيان | الوصف |
|--------|-------|
| الصورة | Avatar مع الأحرف الأولى |
| الاسم | اسم العميل |
| الجنس | Badge (ذكر/أنثى) |
| التقييم | تقييم بالنجوم |
| الجوال | رقم الجوال بالصيغة الدولية |
| البريد | البريد الإلكتروني |

**الإجراءات المتاحة:**
- زر الاتصال (`tel:+{country_code}{phone}`)
- زر المراسلة (`mailto:{email}`)

#### ز. بطاقة معلومات السائق (شرطية)

- تظهر فقط إذا كان للرحلة سائق (`trip.driver !== null`)
- نفس هيكل بطاقة العميل

#### ح. بطاقة ملخص الرحلة

| البيان | الوصف |
|--------|-------|
| معرف الرحلة | رقم الرحلة في النظام |
| نوع الخدمة | نوع الخدمة المطلوبة |
| عدد الأيام | عدد أيام الرحلة |
| طلبات نشطة | Badge (نعم/لا) |
| طلب العميل إكمال الرحلة | تنبيه أصفر إذا كان أكبر من 0 |

---

### 3. الإحصائيات

- **المسار:** `/trips/analytics`
- **الملف:** `app/[locale]/trips/analytics/page.tsx`
- **مكون الإحصائيات:** `components/Trips/TripsAnalytics.tsx`
- **الوصف:** نظرة شاملة على إحصائيات وأداء الرحلات

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/rides/count-by-status` |
| **Method** | `GET` |
| **Response Type** | `TripsAnalyticsResponse` |

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    pending: number;
    scheduled: number;
    accepted: number;
    driver_arrived: number;
    canceled_by_customer: number;
    canceled_by_driver: number;
    on_the_way: number;
    processing: number;
    done: number;
    canceled_automatically: number;
    total: number;
  }
}
```

---

#### أ. كروت الإحصائيات (4 كروت)

كل كرت قابل للنقر ويوجه إلى قائمة الرحلات بفلتر مناسب:

| الكرت | الأيقونة | اللون | البيانات | الرابط |
|-------|---------|-------|----------|--------|
| إجمالي الرحلات | MapPin | أزرق | `total` | `/trips?page=1` |
| الرحلات الناجحة | CheckCircle | أخضر | `done` | `/trips?page=1&filters[status]=done` |
| الرحلات الملغاة | XCircle | أحمر | `canceled_by_customer + canceled_by_driver + canceled_automatically` | `/trips?page=1&filters[status]=canceled_by_customer,canceled_by_driver,canceled_automatically` |
| الرحلات النشطة | Clock | كهرماني | `pending + scheduled + accepted + driver_arrived + on_the_way + processing` | `/trips?page=1&filters[status]=processing` |

---

#### ب. الرسوم البيانية (3 رسوم بيانية شريطية)

**1. الرحلات الجارية والناجحة:**

| التصنيف | اللون | الحقل |
|---------|-------|-------|
| مكتملة | أخضر | `data.done` |
| مقبولة | أزرق | `data.accepted` |
| في الطريق | كهرماني | `data.on_the_way` |
| السائق وصل | سماوي | `data.driver_arrived` |

**2. الرحلات الملغاة:**

| التصنيف | اللون | الحقل |
|---------|-------|-------|
| ملغاة من العميل | أحمر | `data.canceled_by_customer` |
| ملغاة من السائق | أحمر داكن | `data.canceled_by_driver` |
| ملغاة تلقائياً | أحمر غامق | `data.canceled_automatically` |

**3. الرحلات قيد التنفيذ:**

| التصنيف | اللون | الحقل |
|---------|-------|-------|
| قيد الانتظار | رمادي | `data.pending` |
| مجدولة | بنفسجي | `data.scheduled` |
| قيد المعالجة | برتقالي | `data.processing` |

كل رسم بياني يتضمن:
- تصور شريطي أفقي
- جدول تفاصيل رقمي أسفل الرسم
- حسابات النسب المئوية لكل تصنيف

---

#### ج. توزيع الحالات (Pie Chart)

| التصنيف | اللون |
|---------|-------|
| مكتملة | أخضر |
| ملغاة | أحمر |
| نشطة | كهرماني |

يعرض النسب المئوية مع عداد لكل تصنيف.

---

#### د. مؤشرات الأداء

| المؤشر | الوصف |
|--------|-------|
| نسبة النجاح | نسبة الرحلات المكتملة من الإجمالي |
| نسبة الإلغاء | نسبة الرحلات الملغاة من الإجمالي |
| الرحلات النشطة | عدد الرحلات النشطة حالياً |

يتضمن أشرطة تقدم ومؤشرات اتجاه (أسهم صعود/هبوط).

---

## أنواع البيانات (Types)

### Ride

```typescript
interface Ride {
  id: number;
  pickup: Pickup | null;
  destination: Pickup;
  status_key: string;
  status: string;
  price: string;
  final_price: null | string;
  ride_distance: string;
  ride_duration: string;
  actual_ride_distance: null | string;
  actual_ride_duration: null | string;
  payment_method_key: string | null;
  payment_method: Paymentmethod | null;
  payment_status_key: string;
  payment_status: string;
  requested_at: string;
  start_at: null | string;
  end_at: null | string;
  has_active_requests: number;
  active_extra_hours_request: number;
  extra_hours: number;
  service_type_key: string;
  service_type: string;
  number_of_days: number;
  fontas_value_requested: null;
  is_now: boolean;
  customer_requested_to_complete: number;
  is_important_date: boolean;
  paid_at: null | string;
  customer: Customer;
  driver: TripDriver | null;
}
```

### Customer / TripDriver

```typescript
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  rating: number;
  gender: Genders;
  profile_image: string | null;
}

interface TripDriver {
  id: number;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  rating: number;
  gender: Genders;
  profile_image: string | null;
}
```

### Pickup

```typescript
interface Pickup {
  lat: number;
  long: number;
  address: string;
}
```

### Paymentmethod

```typescript
interface Paymentmethod {
  title: string;
  logo: string;
}
```

---

## هيكل الملفات

```
app/[locale]/trips/
├── page.tsx                    # جميع الرحلات
├── columns.tsx                 # تعريف أعمدة الجدول
├── [id]/
│   └── page.tsx               # تفاصيل الرحلة
└── analytics/
    └── page.tsx               # الإحصائيات

components/Trips/
├── TripsFilter/
│   └── index.tsx              # مكون الفلترة
├── TripsSortingComponent/
│   └── index.tsx              # مكون الترتيب
└── TripsAnalytics.tsx         # مكون الإحصائيات
```

---

## ملخص API Calls

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/rides` | `GET` | جلب قائمة الرحلات مع الفلاتر والترقيم |
| `/rides/{id}` | `GET` | جلب تفاصيل رحلة محددة |
| `/rides/count-by-status` | `GET` | جلب إحصائيات الرحلات حسب الحالة |

---

## قيم حالات الرحلة

| المفتاح | القيمة بالعربية |
|---------|-----------------|
| `done` | الرحلة اكتملت |
| `pending` | قيد الانتظار |
| `accepted` | مقبول |
| `driver_arrived` | السائق وصل |
| `canceled_by_customer` | ألغيت من قبل العميل |
| `canceled_by_driver` | ألغيت من قبل السائق |
| `canceled_automatically` | ألغيت تلقائياً |
| `on_the_way` | في الطريق |
| `processing` | قيد المعالجة |
| `scheduled` | مجدولة |

---

## قيم طرق الدفع

| المفتاح | القيمة بالعربية |
|---------|-----------------|
| `cash` | كاش |
| `creditcard` | كارت بنكي |
| `stcpay` | STC Pay |
| `applepay` | Apple Pay |

---

## قيم حالات الدفع

| المفتاح | القيمة بالعربية |
|---------|-----------------|
| `paid` | تمت بنجاح |
| `unpaid` | لم يتم الدفع |
| `pending` | قيد الانتظار |

---

## أنواع الخدمات

| المفتاح | القيمة بالعربية |
|---------|-----------------|
| `taxi` | تاكسي |
| `fontas` | وقود |
| `tires` | إطارات |
| `towing` | سحب (العالقين في الرمال) |
| `light_transportation` | نقل خفيف |
| `driver_without_car` | سائق بدون سيارة |
| `important_dates` | مناسبات مهمة |
| `wensh` | ونش |

---

## ملاحظات تقنية

1. **Lazy Loading:** مكونات الفلترة والترتيب يتم تحميلها بشكل ديناميكي
2. **Scroll Preservation:** الحفاظ على موضع التمرير عند تطبيق الفلاتر عبر `useScrollPreservation`
3. **URL-Based Filters:** حالة الفلاتر تُحفظ في معاملات URL لسهولة المشاركة
4. **Pagination Reset:** يتم إعادة تعيين الصفحة إلى 1 عند تطبيق فلاتر جديدة
5. **Conditional Rendering:** بطاقة السائق تظهر فقط إذا كان للرحلة سائق
6. **Memoized Calculations:** حسابات الإحصائيات محفوظة في الذاكرة لتحسين الأداء
7. **Recharts:** مكتبة الرسوم البيانية المستخدمة في صفحة الإحصائيات
8. **ميزات معطلة:** الترتيب وفلاتر النطاق (السعر، المسافة، المدة) معطلة حالياً في الواجهة

---
