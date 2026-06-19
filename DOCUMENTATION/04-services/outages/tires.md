# خدمة الإطارات (Tires Service)

## نظرة عامة

خدمة الإطارات هي خدمة تغيير وإصلاح إطارات المركبات. تتيح للعملاء طلب مساعدة لإصلاح أو تغيير الإطارات في مكانهم.

- **المسار:** `/services/outages/tires`
- **نوع الخدمة:** `tires`
- **العرض العربي:** الإطارات

---

## صفحات الخدمة

### 1. الإعدادات (Settings)
**المسار:** `/services/outages/tires/settings`

### 2. الطلبات (Orders)
**المسار:** `/services/outages/tires/orders`

### 3. الأدوات (Tools)
**المسار:** `/services/outages/tires/tools`

---

## صفحة الإعدادات

### الأقسام

1. **نسبة التطبيق**
2. **التحكم حسب الموقع**
3. **أسعار الخدمة**
4. **أوقات الذروة**
5. **المواقع/النقاط**

### API Endpoints

#### جلب إعدادات الإطارات
```
GET /tires/getServiceSettings?zone_id={zone_id}
```

#### تحديث إعدادات الإطارات
```
POST /tires/updateServiceSettings
Content-Type: multipart/form-data

type: "tires"
zone_id: number (optional)
app_percentage: number
is_coming_soon: 0 | 1
is_hidden: 0 | 1
service_price: number
change_tires_price: number
external_patch_service_price: number
tire_air_fill_price: number
price_per_km: number
price_per_minute: number
base_price: number
minimum_charge: number
waiting_cost: number
cancellation_cost: number
```

---

## إعدادات التسعير

### أسعار الإطارات الخاصة

| الإعداد | المفتاح | الوصف | الوحدة |
|---------|---------|-------|--------|
| سعر الخدمة | `service_price` | رسوم الخدمة الأساسية | ريال |
| سعر تغيير الإطار | `change_tires_price` | سعر تغيير الإطار الواحد | ريال/إطار |
| سعر الرتق الخارجي | `external_patch_service_price` | سعر رتق الإطار | ريال/رتق |
| سعر تعبئة الهواء | `tire_air_fill_price` | سعر تعبئة الإطار بالهواء | ريال/إطار |

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

## أنواع الخدمات

| الخدمة | الوصف |
|--------|-------|
| تغيير إطار | استبدال الإطار التالف بآخر جديد |
| رتق خارجي | إصلاح ثقب في الإطار |
| تعبئة هواء | تعبئة الإطار بالهواء |

---

## معادلة حساب السعر

```
السعر = service_price
      + (عدد_التغيير * change_tires_price)
      + (عدد_الرتق * external_patch_service_price)
      + (عدد_التعبئة * tire_air_fill_price)
      + المسافة * price_per_km

إذا السعر < minimum_charge:
    السعر = minimum_charge
```

---

## صفحة الطلبات

**المسار:** `/services/outages/tires/orders`

### API Endpoint
```
GET /services/tires/orders?{query_params}
```

### أعمدة الجدول

**المكون:** `components/Services/shared/Orders/columnTires.tsx`

| العمود | الوصف |
|--------|-------|
| رقم الطلب | معرف الطلب |
| العميل | اسم العميل |
| السائق | اسم السائق |
| نوع الخدمة | تغيير/رتق/تعبئة |
| العدد | عدد الإطارات |
| السعر | المبلغ الإجمالي |
| الحالة | حالة الطلب |
| التاريخ | تاريخ الطلب |
| الإجراءات | عرض التفاصيل |

### صفحة تفاصيل الطلب

**المسار:** `/services/outages/tires/orders/{id}`

---

## صفحة الأدوات

**المسار:** `/services/outages/tires/tools`

### API Endpoints

#### جلب الأدوات
```
GET /services/tires/tools
```

#### إضافة أداة
```
POST /services/tires/tools
Content-Type: multipart/form-data

title_ar: string
title_en: string
description_ar: string
description_en: string
image: File
```

### أمثلة على الأدوات

- جك (رافعة)
- مفتاح ربط
- كمبروسر هواء
- رقع إطارات
- إطار احتياطي

---

## المكونات

### Prices (مشترك)
**المكون:** `components/Services/shared/Prices/index.tsx`

يعرض حقول إضافية للإطارات:

```typescript
{serviceName === "tires" && (
  <>
    <CustomInput
      name="change_tires_price"
      label="سعر تغيير الإطار/ الإطار"
    />
    <CustomInput
      name="external_patch_service_price"
      label="سعر خدمة الرتق خارجي /الرتق"
    />
    <CustomInput
      name="tire_air_fill_price"
      label="سعر تعبئة الإطار بالهواء /الإطار"
    />
  </>
)}
```

---

## Response Types

```typescript
interface TiresServiceSettings {
  app_percentage: number;
  is_coming_soon: 0 | 1;
  is_hidden: 0 | 1;
  service_price: number;
  change_tires_price: number;
  external_patch_service_price: number;
  tire_air_fill_price: number;
  price_per_km: number;
  price_per_minute: number;
  base_price: number;
  minimum_charge: number;
  waiting_cost: number;
  cancellation_cost: number;
  payment_methods: PaymentMethod[];
}

type TireServiceType = "change" | "patch" | "air_fill";

interface TiresOrder {
  id: number;
  customer_id: number;
  driver_id: number;
  service_type: TireServiceType;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

interface TiresTool {
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
app/[locale]/services/outages/tires/
├── page.tsx                # يحول إلى settings
├── settings/
│   └── page.tsx            # إعدادات الإطارات
├── orders/
│   ├── page.tsx            # قائمة الطلبات
│   └── [id]/
│       └── page.tsx        # تفاصيل الطلب
└── tools/
    └── page.tsx            # أدوات الإطارات

components/Services/shared/
├── Prices/
│   └── index.tsx           # الأسعار (مع حقول الإطارات)
└── Orders/
    └── columnTires.tsx     # أعمدة جدول الإطارات
```

---
