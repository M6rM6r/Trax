# الخدمات (Services)

## نظرة عامة

قسم الخدمات يحتوي على إعدادات وتكوينات جميع الخدمات المتاحة في التطبيق. يتيح هذا القسم التحكم في الأسعار، أوقات الذروة، النطاقات الجغرافية، ووسائل الدفع لكل خدمة.

---

## أنواع الخدمات

| الخدمة | المسار | الوصف |
|--------|--------|-------|
| التاكسي | `/services/taxi` | خدمة النقل بالتاكسي |
| وايت الماء | `/services/fontas` | خدمة نقل المياه بالصهاريج |
| السطحات والدينات | `/services/wensh` | خدمة الونش والسطحات |
| النقل الخفيف | `/services/light_transportation` | خدمة النقل بالشاحنات الصغيرة |
| العطالات | `/services/fast_support` | خدمة الدعم السريع |
| سائق بدون سيارة | `/services/driver_without_car` | خدمة تأجير السائقين |

---

## هيكل صفحات الخدمات

### صفحة الخدمة الرئيسية

**المسار:** `/services/[serviceType]`

كل خدمة تحتوي على:

1. **نسبة التطبيق (App Percentage)**
2. **التحكم حسب الموقع (Location Based Control)**
3. **أسعار اليوم (Prices Day)**
4. **أوقات الذروة (Peak Prices)**
5. **المواقع/النقاط (Positions/Points)**

---

## API Endpoints المشتركة

### جلب إعدادات الخدمة
```
GET /getServiceSettings?type={serviceType}&zone_id={zone_id}&subtype={subtype}
```

**Response:**
```typescript
interface ServiceSettingsResponse {
  success: boolean;
  data: ServiceSetting[];
}

interface ServiceSetting {
  id: number;
  key: string;
  value: string | number;
  title: string;
  title_key: string;
  type: string;
  subtype?: string;
  zone_id?: number;
}
```

### تحديث إعدادات الخدمة
```
POST /updateServiceSettings
Content-Type: multipart/form-data

type: string (serviceType)
zone_id: number (optional)
subtype: string (optional)
{setting_key}: {setting_value}
```

### جلب أوقات الذروة
```
GET /getPeakTimes?type={serviceType}&zone_id={zone_id}&subtype={subtype}
```

**Response:**
```typescript
interface PeakTimesResponse {
  success: boolean;
  data: PeakTime[] | PeakTime;
}

interface PeakTime {
  id: number;
  type: string;
  day: string;
  start_time: string;
  end_time: string;
  multiplier: number;
  zone_id?: number;
}
```

---

## الإعدادات المشتركة

### إعدادات الحالة

| الإعداد | المفتاح | القيم | الوصف |
|---------|---------|-------|-------|
| إيقاف الخدمة مؤقتاً | `is_coming_soon` | `0` / `1` | جعل الخدمة "قريباً" |
| إخفاء الخدمة | `is_hidden` | `0` / `1` | إخفاء الخدمة من التطبيق |

### إعدادات الأسعار الأساسية

| الإعداد | المفتاح | الوصف |
|---------|---------|-------|
| نسبة التطبيق | `app_percentage` | نسبة التطبيق من كل رحلة |
| سعر الكيلو | `price_per_km` | السعر لكل كيلومتر |
| سعر الدقيقة | `price_per_minute` | السعر لكل دقيقة |
| السعر الثابت | `base_price` | السعر الأساسي للرحلة |
| الحد الأدنى | `minimum_charge` | أقل سعر للرحلة |
| سعر الانتظار | `waiting_cost` | سعر الانتظار لكل دقيقة |
| سعر الإلغاء | `cancellation_cost` | سعر إلغاء الرحلة |
| الكيلومترات المجانية | `free_km` | عدد الكيلومترات المجانية |

### وسائل الدفع

| وسيلة الدفع | المفتاح |
|-------------|---------|
| الدفع النقدي | `cash_payment` |
| البطاقة البنكية | `card_payment` |
| المحفظة | `wallet_payment` |
| Apple Pay | `apple_pay` |
| STC Pay | `stc_pay` |

---

## المكونات المشتركة

### 1. AppPercentage
**المكون:** `components/Drivers/Pricing/AppPercentage`

يعرض ويتيح تعديل نسبة التطبيق من كل رحلة.

### 2. LocationBasedControl
**المكون:** `components/Drivers/Pricing/LocationBasedControl`

يتيح التحكم في الإعدادات حسب المنطقة الجغرافية.

### 3. PricesDay
**المكون:** `components/Drivers/Pricing/PricesDay`

يعرض ويتيح تعديل أسعار الخدمة على مدار اليوم.

**الحقول:**
- `is_coming_soon` - إيقاف الخدمة مؤقتاً
- `is_hidden` - إخفاء الخدمة
- `price_per_km` - سعر الكيلو
- `price_per_minute` - سعر الدقيقة
- `base_price` - السعر الثابت
- `minimum_charge` - الحد الأدنى
- `waiting_cost` - سعر الانتظار
- `cancellation_cost` - سعر الإلغاء
- `free_km` - الكيلومترات المجانية

### 4. PeakPrices
**المكون:** `components/Drivers/Pricing/PeakPrices`

يعرض ويتيح إدارة أوقات الذروة ومضاعفات الأسعار.

### 5. Positions
**المكون:** `components/Drivers/Pricing/Positions`

يعرض ويتيح إدارة مواقع الانتظار والنقاط.

### 6. PointsData
**المكون:** `components/Drivers/Pricing/PointsData`

يعرض بيانات النقاط للسائقين.

---

## هيكل الملفات

```
app/[locale]/services/
├── [serviceType]/
│   ├── page.tsx           # صفحة الخدمة الديناميكية
│   └── columns.tsx        # أعمدة الجدول
├── analytics/
│   └── page.tsx           # إحصائيات الخدمات
├── orders/
│   ├── page.tsx           # قائمة الطلبات
│   └── [id]/
│       └── page.tsx       # تفاصيل الطلب
├── lightTransportationGoods/
│   ├── page.tsx           # بضائع النقل الخفيف
│   ├── add/
│   │   └── page.tsx       # إضافة بضاعة
│   └── [id]/
│       └── page.tsx       # تفاصيل البضاعة
└── outages/
    ├── page.tsx           # العطالات الرئيسية
    ├── analytics/
    │   └── page.tsx       # إحصائيات العطالات
    ├── fuel/              # خدمة الوقود
    ├── tires/             # خدمة الإطارات
    └── towing/            # خدمة السحب

components/Services/
├── Analytics/
│   └── ServicesAnalytics.tsx
├── Fuel/
│   ├── AcceptOrder/
│   ├── AppPercantage/
│   └── ServicesFuelTabsHeader/
├── shared/
│   ├── Prices/
│   ├── ServicesTabsHeader/
│   ├── Tools/
│   └── Orders/
├── LightTransportationTabs/
└── ServicesTyriesPage/
```

---

## ملفات التوثيق في هذا المجلد

| الملف | الوصف |
|-------|-------|
| `services.md` | نظرة عامة على الخدمات (هذا الملف) |
| `taxi.md` | خدمة التاكسي |
| `fontas.md` | خدمة وايت الماء |
| `wensh.md` | خدمة الونش والسطحات |
| `light-transportation.md` | خدمة النقل الخفيف |
| `driver-without-car.md` | خدمة سائق بدون سيارة |
| `outages/` | مجلد خدمات العطالات |

---
