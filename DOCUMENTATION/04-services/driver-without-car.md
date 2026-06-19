# خدمة سائق بدون سيارة (Driver Without Car Service)

## نظرة عامة

خدمة سائق بدون سيارة هي خدمة تأجير السائقين بالوقت. تتيح للعملاء طلب سائق لقيادة سيارتهم الخاصة لفترة زمنية محددة.

- **المسار:** `/services/driver_without_car`
- **نوع الخدمة:** `driver_without_car`
- **العرض العربي:** سائق بدون سيارة

---

## صفحة إعدادات الخدمة

**المسار:** `/services/driver_without_car`

### الأقسام

1. **نسبة التطبيق**
2. **التحكم حسب الموقع**
3. **أسعار اليوم** (تعتمد على الوقت)
4. **أوقات الذروة**
5. **المواقع/النقاط**

---

## API Endpoints

### جلب إعدادات الخدمة
```
GET /getServiceSettings?type=driver_without_car&zone_id={zone_id}
```

### تحديث إعدادات الخدمة
```
POST /updateServiceSettings
Content-Type: multipart/form-data

type: "driver_without_car"
zone_id: number (optional)
app_percentage: number
is_coming_soon: 0 | 1
is_hidden: 0 | 1
price_per_time_period: number
basic_time: number
additional_time_price: number
cancellation_time: number
cancellation_cost: number
```

### جلب أوقات الذروة
```
GET /getPeakTimes?type=driver_without_car&zone_id={zone_id}
```

---

## إعدادات التسعير

### الأسعار الخاصة بالخدمة

| الإعداد | المفتاح | الوصف | الوحدة |
|---------|---------|-------|--------|
| سعر الفترة الزمنية | `price_per_time_period` | السعر الأساسي للفترة | ريال |
| الوقت الأساسي | `basic_time` | مدة الفترة الأساسية | دقيقة |
| سعر الوقت الإضافي | `additional_time_price` | سعر كل فترة إضافية | ريال |
| وقت الإلغاء | `cancellation_time` | المدة المسموحة للإلغاء المجاني | دقيقة |
| سعر الإلغاء | `cancellation_cost` | رسوم الإلغاء بعد المدة المسموحة | ريال |

### الأسعار المشتركة

| الإعداد | المفتاح | الوصف |
|---------|---------|-------|
| نسبة التطبيق | `app_percentage` | نسبة التطبيق من كل طلب |

---

## معادلة حساب السعر

```
السعر = price_per_time_period (للفترة الأساسية)
      + (الفترات_الإضافية * additional_time_price)

إذا تم الإلغاء بعد cancellation_time:
    السعر = cancellation_cost
```

### مثال:
- الوقت الأساسي: 60 دقيقة
- سعر الفترة: 100 ريال
- سعر الوقت الإضافي: 50 ريال/ساعة

إذا استخدم العميل الخدمة لمدة 90 دقيقة:
```
السعر = 100 + (30/60 * 50) = 100 + 25 = 125 ريال
```

---

## المكونات

### PricesDay (مخصص)
يعرض الحقول الخاصة بخدمة سائق بدون سيارة:

```typescript
// في صفحة الخدمة
base_price={
  params.serviceType === "driver_without_car"
    ? getServiceSettingsValue(data.data, "price_per_time_period")
    : getServiceSettingsValue(data.data, "base_price")
}
cancellation_time={getServiceSettingsValue(data.data, "cancellation_time")}
basic_time={getServiceSettingsValue(data.data, "basic_time")}
additional_time_price={getServiceSettingsValue(data.data, "additional_time_price")}
```

---

## حالات خاصة

### 1. التسعير بالوقت
هذه الخدمة تختلف عن باقي الخدمات لأنها تعتمد على الوقت وليس المسافة:
- لا تستخدم `price_per_km`
- لا تستخدم `price_per_minute` بالطريقة التقليدية
- تستخدم `price_per_time_period` و `basic_time` بدلاً من ذلك

### 2. الإلغاء المجاني
العميل يمكنه الإلغاء مجاناً خلال `cancellation_time` دقيقة من بداية الطلب.

### 3. لا يملك السائق سيارة
السائقين في هذه الخدمة:
- لا يملكون سيارة خاصة
- يقودون سيارة العميل
- لا يحتاجون لتوثيق استمارة مركبة

---

## Response Types

```typescript
interface DriverWithoutCarServiceSettings {
  app_percentage: number;
  is_coming_soon: 0 | 1;
  is_hidden: 0 | 1;
  price_per_time_period: number;
  basic_time: number;
  additional_time_price: number;
  cancellation_time: number;
  cancellation_cost: number;
  payment_methods: PaymentMethod[];
}
```

---

## هيكل الملفات

```
app/[locale]/services/driver_without_car/
└── (uses [serviceType]/page.tsx)

components/Drivers/Pricing/
├── AppPercentage.tsx
├── LocationBasedControl.tsx
├── PricesDay.tsx          # يعرض حقول الوقت للخدمة
├── PeakPrices.tsx
├── Positions.tsx
└── PointsData.tsx
```

---

## مقارنة مع الخدمات الأخرى

| الميزة | سائق بدون سيارة | التاكسي | الونش |
|--------|----------------|---------|-------|
| وحدة التسعير | الوقت | المسافة + الوقت | المسافة |
| يحتاج سيارة | لا | نعم | نعم |
| الوقت الأساسي | نعم | لا | لا |
| سعر الكيلو | لا | نعم | نعم |

---
