# خدمة الونش والسطحات (Wensh Service)

## نظرة عامة

خدمة الونش (السطحات والدينات) هي خدمة نقل وسحب المركبات المعطلة. تتيح للعملاء طلب سطحة لنقل سيارتهم المعطلة.

- **المسار:** `/services/wensh`
- **نوع الخدمة:** `wensh`
- **العرض العربي:** سطحات ودينات

---

## صفحة إعدادات الخدمة

**المسار:** `/services/wensh`

### الأقسام

1. **نسبة التطبيق**
2. **التحكم حسب الموقع**
3. **أسعار اليوم**
4. **أوقات الذروة**
5. **المواقع/النقاط**

---

## API Endpoints

### جلب إعدادات الونش
```
GET /getServiceSettings?type=wensh&zone_id={zone_id}
```

### تحديث إعدادات الونش
```
POST /updateServiceSettings
Content-Type: multipart/form-data

type: "wensh"
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
GET /getPeakTimes?type=wensh&zone_id={zone_id}
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

type: "wensh"
zone_id: number (optional)
day: string
start_time: HH:MM
end_time: HH:MM
multiplier: number
```

---

## أنواع الونش

| النوع | القيمة | الوصف |
|-------|--------|-------|
| سطحة عادية | `normal_flatbed` | لنقل السيارات الصغيرة |
| سطحة كبيرة | `large_flatbed` | لنقل السيارات الكبيرة والشاحنات الصغيرة |
| دينا | `dyna` | لنقل البضائع والمركبات الصغيرة |

---

## المكونات

### 1. AppPercentage
يعرض ويتيح تعديل نسبة التطبيق.

```typescript
<AppPercentage
  app_percentage={data.app_percentage}
  type="wensh"
/>
```

### 2. PricesDay
يعرض ويتيح تعديل جميع أسعار الخدمة.

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
  type="wensh"
  service_settings={data}
/>
```

---

## حالات خاصة

### 1. نوع الونش
كل سائق ونش يحدد نوع الونش الذي يملكه:
- `normal_flatbed` - سطحة عادية
- `large_flatbed` - سطحة كبيرة
- `dyna` - دينا

### 2. لا يتطلب WASL صارم
خدمة الونش لا تتطلب تحقق WASL صارم مثل التاكسي.

### 3. لا يتطلب ماركة وموديل
على عكس التاكسي، سائقي الونش لا يحتاجون لتحديد ماركة وموديل المركبة.

---

## Response Types

```typescript
interface WenshServiceSettings {
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

type WenshType = "normal_flatbed" | "large_flatbed" | "dyna";
```

---

## هيكل الملفات

```
app/[locale]/services/wensh/
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
