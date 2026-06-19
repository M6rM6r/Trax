# خدمة النقل الخفيف (Light Transportation Service)

## نظرة عامة

خدمة النقل الخفيف هي خدمة نقل البضائع بالشاحنات الصغيرة (البكاسي). تتيح للعملاء طلب شاحنة صغيرة لنقل بضائعهم.

- **المسار:** `/services/light_transportation`
- **نوع الخدمة:** `light_transportation`
- **العرض العربي:** النقل الخفيف

---

## صفحة إعدادات الخدمة

**المسار:** `/services/light_transportation`

### التبويبات

صفحة النقل الخفيف تحتوي على تبويبين:

1. **النقل الخفيف** - إعدادات الخدمة
2. **بضاعات النقل الخفيف** - أنواع البضائع

### أقسام تبويب الإعدادات

1. **نسبة التطبيق**
2. **التحكم حسب الموقع**
3. **أسعار اليوم**
4. **أوقات الذروة**
5. **المواقع/النقاط**

---

## API Endpoints

### جلب إعدادات النقل الخفيف
```
GET /getServiceSettings?type=light_transportation&zone_id={zone_id}&subtype={subtype}
```

### تحديث إعدادات النقل الخفيف
```
POST /updateServiceSettings
Content-Type: multipart/form-data

type: "light_transportation"
zone_id: number (optional)
subtype: string (optional)
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
GET /getPeakTimes?type=light_transportation&zone_id={zone_id}&subtype={subtype}
```

### جلب أنواع البضائع
```
GET /lightTransportationCargo?{query_params}
```

**Response:**
```typescript
interface ListLightTransportationCargo {
  success: boolean;
  data: {
    records: CargoType[];
    pagination_data: PaginationData;
  }
}

interface CargoType {
  id: number;
  title_ar: string;
  title_en: string;
  image: string;
  is_active: 0 | 1;
}
```

### إضافة نوع بضاعة
```
POST /lightTransportationCargo
Content-Type: multipart/form-data

title_ar: string
title_en: string
image: File
```

### تعديل نوع بضاعة
```
POST /lightTransportationCargo/{id}
Content-Type: multipart/form-data

title_ar: string
title_en: string
image: File (optional)
```

### حذف نوع بضاعة
```
DELETE /lightTransportationCargo/{id}
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

---

## المكونات

### 1. LightTransportationTabs
المكون الرئيسي الذي يعرض التبويبات.

**المكون:** `components/Services/LightTransportationTabs/index.tsx`

```typescript
<LightTransportationTabs
  lightTransportationContent={
    // محتوى إعدادات الخدمة
  }
  lightTransportationGoodsContent={
    // محتوى أنواع البضائع
  }
/>
```

### 2. تبويب الإعدادات
يحتوي على:
- `AppPercentage`
- `LocationBasedControl`
- `PricesDay`
- `PeakPrices`
- `Positions` / `PointsData`

### 3. تبويب البضائع
يحتوي على:
- `DataTable` لعرض أنواع البضائع
- زر "أضف نوع" للإضافة

---

## صفحة إضافة/تعديل البضائع

**المسار:** `/services/lightTransportationGoods/add`

### الحقول

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| `title_ar` | `string` | نعم | اسم البضاعة بالعربية |
| `title_en` | `string` | نعم | اسم البضاعة بالإنجليزية |
| `image` | `File` | نعم | صورة البضاعة |

---

## أنواع الكابينة

| النوع | القيمة | الوصف |
|-------|--------|-------|
| كابينة مفردة | `single_cabin` | شاحنة بكابينة واحدة |
| كابينة مزدوجة | `double_cabin` | شاحنة بكابينتين |

---

## حالات خاصة

### 1. نظام التبويبات
صفحة النقل الخفيف مقسمة إلى تبويبين:
```typescript
{params.serviceType === "light_transportation" && (
  <LightTransportationTabs
    lightTransportationContent={...}
    lightTransportationGoodsContent={...}
  />
)}
```

### 2. أنواع البضائع
يمكن إضافة أنواع بضائع مخصصة مثل:
- أثاث
- أجهزة كهربائية
- مواد بناء
- بضائع عامة

### 3. لا يتطلب WASL صارم
خدمة النقل الخفيف لا تتطلب تحقق WASL صارم.

---

## Response Types

```typescript
interface LightTransportationServiceSettings {
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

interface CargoType {
  id: number;
  title_ar: string;
  title_en: string;
  image: string;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
}

type CabinType = "single_cabin" | "double_cabin";
```

---

## أعمدة جدول البضائع

**المكون:** `app/[locale]/services/[serviceType]/columns.tsx`

| العمود | الوصف |
|--------|-------|
| صورة | صورة البضاعة |
| الاسم بالعربية | `title_ar` |
| الاسم بالإنجليزية | `title_en` |
| الحالة | نشط/غير نشط |
| الإجراءات | تعديل/حذف |

---

## هيكل الملفات

```
app/[locale]/services/light_transportation/
└── (uses [serviceType]/page.tsx)

app/[locale]/services/lightTransportationGoods/
├── page.tsx               # قائمة البضائع (فارغة)
├── add/
│   └── page.tsx           # إضافة بضاعة
└── [id]/
    └── page.tsx           # تعديل بضاعة

components/Services/
├── LightTransportationTabs/
│   └── index.tsx          # تبويبات النقل الخفيف
```

---
