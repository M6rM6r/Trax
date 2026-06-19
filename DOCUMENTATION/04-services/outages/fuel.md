# خدمة الوقود (Fuel Service)

## نظرة عامة

خدمة الوقود هي خدمة تزويد الوقود للمركبات المتعطلة. تتيح للعملاء طلب تزويد وقود في مكانهم.

- **المسار:** `/services/outages/fuel`
- **نوع الخدمة:** `fuel`
- **العرض العربي:** الوقود

---

## صفحات الخدمة

### 1. الإعدادات (Settings)
**المسار:** `/services/outages/fuel/settings`

### 2. الطلبات (Orders)
**المسار:** `/services/outages/fuel/orders`

### 3. الأدوات (Tools)
**المسار:** `/services/outages/fuel/tools`

---

## صفحة الإعدادات

### الأقسام

1. **نسبة التطبيق**
2. **التحكم حسب الموقع**
3. **أسعار الخدمة**
4. **أوقات الذروة**
5. **المواقع/النقاط**

### API Endpoints

#### جلب إعدادات الوقود
```
GET /fuel/getServiceSettings?zone_id={zone_id}
```

#### تحديث إعدادات الوقود
```
POST /fuel/updateServiceSettings
Content-Type: multipart/form-data

type: "fuel"
zone_id: number (optional)
app_percentage: number
is_coming_soon: 0 | 1
is_hidden: 0 | 1
service_price: number
fuel_91_price: number
fuel_95_price: number
dezel_price: number
price_per_km: number
price_per_minute: number
base_price: number
minimum_charge: number
waiting_cost: number
cancellation_cost: number
```

---

## إعدادات التسعير

### أسعار الوقود الخاصة

| الإعداد | المفتاح | الوصف | الوحدة |
|---------|---------|-------|--------|
| سعر الخدمة | `service_price` | رسوم الخدمة الأساسية | ريال |
| سعر بنزين 91 | `fuel_91_price` | سعر لتر بنزين 91 | ريال/لتر |
| سعر بنزين 95 | `fuel_95_price` | سعر لتر بنزين 95 | ريال/لتر |
| سعر الديزل | `dezel_price` | سعر لتر الديزل | ريال/لتر |

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

## معادلة حساب السعر

```
السعر = service_price
      + (الكمية * سعر_نوع_الوقود)
      + المسافة * price_per_km
      + الوقت * price_per_minute

إذا السعر < minimum_charge:
    السعر = minimum_charge
```

---

## صفحة الطلبات

**المسار:** `/services/outages/fuel/orders`

### API Endpoint
```
GET /services/fuel/orders?{query_params}
```

### أعمدة الجدول

**المكون:** `components/Services/shared/Orders/columnFuel.tsx`

| العمود | الوصف |
|--------|-------|
| رقم الطلب | معرف الطلب |
| العميل | اسم العميل |
| السائق | اسم السائق |
| نوع الوقود | 91 / 95 / ديزل |
| الكمية | كمية الوقود باللتر |
| السعر | المبلغ الإجمالي |
| الحالة | حالة الطلب |
| التاريخ | تاريخ الطلب |
| الإجراءات | عرض التفاصيل |

### صفحة تفاصيل الطلب

**المسار:** `/services/outages/fuel/orders/{id}`

---

## صفحة الأدوات

**المسار:** `/services/outages/fuel/tools`

### API Endpoints

#### جلب الأدوات
```
GET /services/fuel/tools
```

#### إضافة أداة
```
POST /services/fuel/tools
Content-Type: multipart/form-data

title_ar: string
title_en: string
description_ar: string
description_en: string
image: File
```

#### تعديل أداة
```
POST /services/fuel/tools/{id}
Content-Type: multipart/form-data

title_ar: string
title_en: string
description_ar: string
description_en: string
image: File (optional)
```

#### حذف أداة
```
DELETE /services/fuel/tools/{id}
```

### حقول الأداة

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `title_ar` | `string` | نعم | اسم الأداة بالعربية |
| `title_en` | `string` | نعم | اسم الأداة بالإنجليزية |
| `description_ar` | `string` | نعم | وصف الأداة بالعربية |
| `description_en` | `string` | نعم | وصف الأداة بالإنجليزية |
| `image` | `File` | نعم | صورة الأداة |

---

## المكونات

### 1. AppPercentage (مخصص للوقود)
**المكون:** `components/Services/Fuel/AppPercantage/index.tsx`

### 2. Prices (مشترك)
**المكون:** `components/Services/shared/Prices/index.tsx`

يعرض حقول إضافية للوقود:
- `fuel_91_price`
- `fuel_95_price`
- `dezel_price`

```typescript
{serviceName === "fuel" && (
  <>
    <CustomInput name="fuel_91_price" label="سعر بنزين 91 / لتر" />
    <CustomInput name="fuel_95_price" label="سعر بنزين 95 / لتر" />
    <CustomInput name="dezel_price" label="سعر الديزل / لتر" />
  </>
)}
```

---

## Response Types

```typescript
interface FuelServiceSettings {
  app_percentage: number;
  is_coming_soon: 0 | 1;
  is_hidden: 0 | 1;
  service_price: number;
  fuel_91_price: number;
  fuel_95_price: number;
  dezel_price: number;
  price_per_km: number;
  price_per_minute: number;
  base_price: number;
  minimum_charge: number;
  waiting_cost: number;
  cancellation_cost: number;
  payment_methods: PaymentMethod[];
}

interface FuelOrder {
  id: number;
  customer_id: number;
  driver_id: number;
  fuel_type: "91" | "95" | "diesel";
  quantity: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

interface FuelTool {
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
app/[locale]/services/outages/fuel/
├── page.tsx                # يحول إلى settings
├── settings/
│   └── page.tsx            # إعدادات الوقود
├── orders/
│   ├── page.tsx            # قائمة الطلبات
│   └── [id]/
│       └── page.tsx        # تفاصيل الطلب
└── tools/
    └── page.tsx            # أدوات الوقود

components/Services/
├── Fuel/
│   ├── AppPercantage/
│   │   └── index.tsx       # نسبة التطبيق للوقود
│   └── AcceptOrder/
│       └── index.tsx       # قبول الطلب
└── shared/
    ├── Prices/
    │   └── index.tsx       # الأسعار (مع حقول الوقود)
    └── Orders/
        └── columnFuel.tsx  # أعمدة جدول الوقود
```

---
