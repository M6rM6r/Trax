# خدمة التاكسي (Taxi Service)

## نظرة عامة

خدمة التاكسي هي الخدمة الأساسية للنقل بالسيارات الخاصة. تتيح للعملاء طلب سيارة تاكسي للتوصيل من نقطة إلى أخرى.

- **المسار:** `/services/taxi`
- **نوع الخدمة:** `taxi`
- **العرض العربي:** تاكسي

---

## صفحة إعدادات الخدمة

**المسار:** `/services/taxi`

### الأقسام

1. **نسبة التطبيق**
2. **التحكم حسب الموقع**
3. **أسعار اليوم**
4. **أوقات الذروة**
5. **المواقع/النقاط**

---

## API Endpoints

### جلب إعدادات التاكسي
```
GET /getServiceSettings?type=taxi&zone_id={zone_id}
```

### تحديث إعدادات التاكسي
```
POST /updateServiceSettings
Content-Type: multipart/form-data

type: "taxi"
zone_id: number (optional)
app_percentage: number
is_coming_soon: 0 | 1
is_hidden: 0 | 1
price_per_km: number
price_per_minute: number
base_price: number
minimum_charge: number
waiting_cost: number
cancellation_cost: number
free_km: number
```

### جلب أوقات الذروة
```
GET /getPeakTimes?type=taxi&zone_id={zone_id}
```

---

## إعدادات التسعير

### الأسعار الأساسية

| الإعداد | المفتاح | الوصف | الوحدة |
|---------|---------|-------|--------|
| نسبة التطبيق | `app_percentage` | نسبة التطبيق من كل رحلة | % |
| سعر الكيلو | `price_per_km` | السعر لكل كيلومتر | ريال |
| سعر الدقيقة | `price_per_minute` | السعر لكل دقيقة | ريال |
| السعر الثابت | `base_price` | السعر الأساسي للرحلة | ريال |
| الحد الأدنى | `minimum_charge` | أقل سعر للرحلة | ريال |
| سعر الانتظار | `waiting_cost` | سعر الانتظار لكل دقيقة | ريال |
| سعر الإلغاء | `cancellation_cost` | سعر إلغاء الرحلة | ريال |
| الكيلومترات المجانية | `free_km` | عدد الكيلومترات المجانية | كم |

### معادلة حساب السعر

```
السعر = base_price
      + (المسافة - free_km) * price_per_km
      + الوقت * price_per_minute
      + وقت_الانتظار * waiting_cost

إذا السعر < minimum_charge:
    السعر = minimum_charge
```

---

## أوقات الذروة

### إضافة وقت ذروة
```
POST /addPeakTime
Content-Type: multipart/form-data

type: "taxi"
zone_id: number (optional)
day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday"
start_time: HH:MM
end_time: HH:MM
multiplier: number
```

### تعديل وقت ذروة
```
POST /updatePeakTime/{id}
Content-Type: multipart/form-data

day: string
start_time: HH:MM
end_time: HH:MM
multiplier: number
```

### حذف وقت ذروة
```
DELETE /deletePeakTime/{id}
```

**ملاحظة:** خلال أوقات الذروة، يتم ضرب السعر في `multiplier`.

---

## وسائل الدفع

| وسيلة الدفع | المفتاح | الوصف |
|-------------|---------|-------|
| الدفع النقدي | `cash_payment` | الدفع نقداً للسائق |
| البطاقة البنكية | `card_payment` | الدفع بالبطاقة البنكية |
| المحفظة | `wallet_payment` | الدفع من محفظة التطبيق |
| Apple Pay | `apple_pay` | الدفع عبر Apple Pay |
| STC Pay | `stc_pay` | الدفع عبر STC Pay |

---

## المكونات

### 1. AppPercentage
يعرض ويتيح تعديل نسبة التطبيق.

```typescript
<AppPercentage
  app_percentage={data.app_percentage}
  type="taxi"
/>
```

### 2. LocationBasedControl
يتيح اختيار المنطقة الجغرافية للإعدادات.

```typescript
<LocationBasedControl />
```

### 3. PricesDay
يعرض ويتيح تعديل أسعار الخدمة.

```typescript
<PricesDay
  is_coming_soon={data.is_coming_soon}
  is_hidden={data.is_hidden}
  price_per_km={data.price_per_km}
  price_per_minute={data.price_per_minute}
  base_price={data.base_price}
  minimum_charge={data.minimum_charge}
  waiting_cost={data.waiting_cost}
  cancellation_cost={data.cancellation_cost}
  free_km={data.free_km}
  type="taxi"
  service_settings={data}
/>
```

### 4. PeakPrices
يعرض ويتيح إدارة أوقات الذروة.

```typescript
<PeakPrices
  data={peakTimesData}
  serviceName="taxi"
/>
```

### 5. Positions
يعرض ويتيح إدارة مواقع الانتظار.

```typescript
<Positions serviceName="taxi" />
```

---

## حالات خاصة

### 1. المواعيد المهمة
خدمة التاكسي تدعم "المواعيد المهمة" التي تتيح للعملاء حجز رحلات مسبقاً.

### 2. القواعد الخاصة
يمكن تحديد قواعد خاصة للسائقين مثل:
- السماح بالحيوانات الأليفة
- التكييف
- عدد الأمتعة المسموح

### 3. WASL Integration
خدمة التاكسي مرتبطة بنظام وصل للتحقق من السائقين والمركبات.

---

## Response Types

```typescript
interface TaxiServiceSettings {
  app_percentage: number;
  is_coming_soon: 0 | 1;
  is_hidden: 0 | 1;
  price_per_km: number;
  price_per_minute: number;
  base_price: number;
  minimum_charge: number;
  waiting_cost: number;
  cancellation_cost: number;
  free_km: number;
  payment_methods: PaymentMethod[];
}

interface PaymentMethod {
  id: number;
  key: string;
  title: string;
  title_key: string;
  value: 0 | 1;
}
```

---

## هيكل الملفات

```
app/[locale]/services/taxi/
└── (uses [serviceType]/page.tsx)

components/Drivers/Pricing/
├── AppPercentage.tsx
├── LocationBasedControl.tsx
├── PricesDay.tsx
├── PeakPrices.tsx
├── Positions.tsx
└── PointsData.tsx
```

---
