# خدمة السحب (Towing Service)

## نظرة عامة

خدمة السحب هي خدمة سحب ونقل المركبات المعطلة. تتيح للعملاء طلب سيارة سحب لنقل مركبتهم المعطلة.

- **المسار:** `/services/outages/towing`
- **نوع الخدمة:** `towing`
- **العرض العربي:** السحب

---

## صفحات الخدمة

### 1. الإعدادات (Settings)
**المسار:** `/services/outages/towing/settings`

### 2. الطلبات (Orders)
**المسار:** `/services/outages/towing/orders`

### 3. الأدوات (Tools)
**المسار:** `/services/outages/towing/tools`

---

## صفحة الإعدادات

### الأقسام

1. **نسبة التطبيق**
2. **التحكم حسب الموقع**
3. **أسعار الخدمة**
4. **أوقات الذروة**
5. **المواقع/النقاط**

### API Endpoints

#### جلب إعدادات السحب
```
GET /towing/getServiceSettings?zone_id={zone_id}
```

#### تحديث إعدادات السحب
```
POST /towing/updateServiceSettings
Content-Type: multipart/form-data

type: "towing"
zone_id: number (optional)
app_percentage: number
is_coming_soon: 0 | 1
is_hidden: 0 | 1
service_price: number
distance_from_paved_road: number
price_per_km: number
price_per_minute: number
base_price: number
minimum_charge: number
waiting_cost: number
cancellation_cost: number
```

---

## إعدادات التسعير

### أسعار السحب الخاصة

| الإعداد | المفتاح | الوصف | الوحدة |
|---------|---------|-------|--------|
| سعر الخدمة | `service_price` | رسوم الخدمة الأساسية | ريال |
| المسافة من الطريق الممهد | `distance_from_paved_road` | رسوم المسافة خارج الطريق | ريال/كم |

### الأسعار المشتركة

| الإعداد | المفتاح | الوصف | الوحدة |
|---------|---------|-------|--------|
| نسبة التطبيق | `app_percentage` | نسبة التطبيق | % |
| سعر الكيلو | `price_per_km` | لكل كيلومتر | ريال |
| سعر الدقيقة | `price_per_minute` | لكل دقيقة | ريال |
| السعر الثابت | `base_price` | سعر ثابت | ريال |
| الحد الأدنى | `minimum_charge` | أقل سعر | ريال |
| سعر الانتظار | `waiting_cost` | لكل دقيقة | ريال |
| سعر الإلغاء | `cancellation_cost` | عند الإلغاء | ريال |

---

## حالة خاصة: المسافة من الطريق الممهد

خدمة السحب تحتوي على إعداد خاص `distance_from_paved_road` يحسب رسوم إضافية عندما تكون المركبة المعطلة خارج الطريق الممهد (في الصحراء أو الطرق الترابية).

```typescript
{serviceName === "towing" && (
  <CustomInput
    name="distance_from_paved_road"
    label="المسافة من الطريق الممهد"
    placeholder="0.000"
  />
)}
```

---

## معادلة حساب السعر

```
السعر = service_price
      + المسافة_الأساسية * price_per_km
      + المسافة_خارج_الطريق * distance_from_paved_road
      + الوقت * price_per_minute

إذا السعر < minimum_charge:
    السعر = minimum_charge
```

---

## صفحة الطلبات

**المسار:** `/services/outages/towing/orders`

### API Endpoint
```
GET /services/towing/orders?{query_params}
```

### أعمدة الجدول

**المكون:** `components/Services/shared/Orders/columnTowing.tsx`

| العمود | الوصف |
|--------|-------|
| رقم الطلب | معرف الطلب |
| العميل | اسم العميل |
| السائق | اسم السائق |
| نوع المركبة | نوع المركبة المسحوبة |
| من | نقطة الانطلاق |
| إلى | نقطة الوصول |
| المسافة | المسافة بالكيلومتر |
| السعر | المبلغ الإجمالي |
| الحالة | حالة الطلب |
| التاريخ | تاريخ الطلب |
| الإجراءات | عرض التفاصيل |

### صفحة تفاصيل الطلب

**المسار:** `/services/outages/towing/orders/{id}`

---

## صفحة الأدوات

**المسار:** `/services/outages/towing/tools`

### API Endpoints

#### جلب الأدوات
```
GET /services/towing/tools
```

#### إضافة أداة
```
POST /services/towing/tools
Content-Type: multipart/form-data

title_ar: string
title_en: string
description_ar: string
description_en: string
image: File
```

### أمثلة على الأدوات

- سلاسل سحب
- حبال سحب
- ونش هيدروليكي
- سطحة نقل
- معدات السلامة

---

## المكونات

### Prices (مشترك)
**المكون:** `components/Services/shared/Prices/index.tsx`

يعرض حقل إضافي للسحب:

```typescript
{serviceName === "towing" && (
  <CustomInput
    name="distance_from_paved_road"
    label="المسافة من الطريق الممهد"
    placeholder="0.000"
    step="0.1"
    maxDecimals={3}
  />
)}
```

---

## Response Types

```typescript
interface TowingServiceSettings {
  app_percentage: number;
  is_coming_soon: 0 | 1;
  is_hidden: 0 | 1;
  service_price: number;
  distance_from_paved_road: number;
  price_per_km: number;
  price_per_minute: number;
  base_price: number;
  minimum_charge: number;
  waiting_cost: number;
  cancellation_cost: number;
  payment_methods: PaymentMethod[];
}

interface TowingOrder {
  id: number;
  customer_id: number;
  driver_id: number;
  vehicle_type: string;
  pickup_location: Location;
  dropoff_location: Location;
  distance: number;
  off_road_distance: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface TowingTool {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image: string;
  created_at: string;
}
```

---

## هيكل الملفات

```
app/[locale]/services/outages/towing/
├── page.tsx                # يحول إلى settings
├── settings/
│   └── page.tsx            # إعدادات السحب
├── orders/
│   ├── page.tsx            # قائمة الطلبات
│   └── [id]/
│       └── page.tsx        # تفاصيل الطلب
└── tools/
    └── page.tsx            # أدوات السحب

components/Services/shared/
├── Prices/
│   └── index.tsx           # الأسعار (مع حقل المسافة)
└── Orders/
    └── columnTowing.tsx    # أعمدة جدول السحب
```

---
