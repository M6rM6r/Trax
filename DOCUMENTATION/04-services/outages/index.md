# خدمات العطالات (Outages Services)

## نظرة عامة

خدمات العطالات (الدعم السريع) هي مجموعة خدمات الطوارئ والمساعدة على الطريق. تشمل ثلاث خدمات رئيسية:

1. **الوقود (Fuel)** - تزويد الوقود
2. **الإطارات (Tires)** - تغيير وإصلاح الإطارات
3. **السحب (Towing)** - سحب المركبات المعطلة

---

## هيكل الصفحات

### الصفحة الرئيسية
**المسار:** `/services/outages`

### صفحات الخدمات الفرعية

| الخدمة | المسار الرئيسي | الإعدادات | الطلبات | الأدوات |
|--------|---------------|-----------|---------|---------|
| الوقود | `/services/outages/fuel` | `/settings` | `/orders` | `/tools` |
| الإطارات | `/services/outages/tires` | `/settings` | `/orders` | `/tools` |
| السحب | `/services/outages/towing` | `/settings` | `/orders` | `/tools` |

### صفحة الإحصائيات
**المسار:** `/services/outages/analytics`

---

## التنقل بين التبويبات

كل خدمة من خدمات العطالات تحتوي على 3 تبويبات:

```
┌────────────┬────────────┬────────────┐
│  الإعدادات │   الطلبات  │   الأدوات  │
└────────────┴────────────┴────────────┘
```

**المكون:** `components/Services/shared/ServicesTabsHeader/index.tsx`

```typescript
<ServicesTabsHeader serviceName="fuel" />
// أو
<ServicesTabsHeader serviceName="tires" />
// أو
<ServicesTabsHeader serviceName="towing" />
```

---

## API Endpoints المشتركة

### جلب إعدادات الخدمة
```
GET /{serviceName}/getServiceSettings?zone_id={zone_id}
```

### تحديث إعدادات الخدمة
```
POST /{serviceName}/updateServiceSettings
Content-Type: multipart/form-data
```

### جلب الطلبات
```
GET /services/{serviceName}/orders?{query_params}
```

### جلب الأدوات
```
GET /services/{serviceName}/tools
```

### إضافة أداة
```
POST /services/{serviceName}/tools
Content-Type: multipart/form-data

title_ar: string
title_en: string
description_ar: string
description_en: string
image: File
```

### تعديل أداة
```
POST /services/{serviceName}/tools/{id}
Content-Type: multipart/form-data
```

### حذف أداة
```
DELETE /services/{serviceName}/tools/{id}
```

---

## الإعدادات المشتركة

| الإعداد | المفتاح | الوصف |
|---------|---------|-------|
| نسبة التطبيق | `app_percentage` | نسبة التطبيق |
| إيقاف الخدمة | `is_coming_soon` | جعل الخدمة قريباً |
| إخفاء الخدمة | `is_hidden` | إخفاء من التطبيق |
| سعر الخدمة | `service_price` | السعر الأساسي |
| سعر الكيلو | `price_per_km` | لكل كيلومتر |
| سعر الدقيقة | `price_per_minute` | لكل دقيقة |
| السعر الثابت | `base_price` | سعر ثابت |
| الحد الأدنى | `minimum_charge` | أقل سعر |
| سعر الانتظار | `waiting_cost` | لكل دقيقة انتظار |
| سعر الإلغاء | `cancellation_cost` | عند الإلغاء |

---

## المكونات المشتركة

### 1. ServicesTabsHeader
تبويبات التنقل بين الإعدادات والطلبات والأدوات.

### 2. Prices
نموذج تعديل أسعار الخدمة.

**المكون:** `components/Services/shared/Prices/index.tsx`

### 3. Orders
جدول عرض الطلبات.

**المكون:** `components/Services/shared/Orders/index.tsx`

### 4. Tools
إدارة الأدوات المطلوبة للخدمة.

**المكون:** `components/Services/shared/Tools/index.tsx`

---

## ملفات التوثيق

| الملف | الوصف |
|-------|-------|
| `index.md` | نظرة عامة (هذا الملف) |
| `fuel.md` | خدمة الوقود |
| `tires.md` | خدمة الإطارات |
| `towing.md` | خدمة السحب |

---

## هيكل الملفات

```
app/[locale]/services/outages/
├── page.tsx                    # الصفحة الرئيسية
├── analytics/
│   └── page.tsx                # الإحصائيات
├── fuel/
│   ├── page.tsx                # يحول إلى settings
│   ├── settings/
│   │   └── page.tsx            # إعدادات الوقود
│   ├── orders/
│   │   ├── page.tsx            # قائمة الطلبات
│   │   └── [id]/
│   │       └── page.tsx        # تفاصيل الطلب
│   └── tools/
│       └── page.tsx            # أدوات الوقود
├── tires/
│   └── ...                     # نفس هيكل الوقود
└── towing/
    └── ...                     # نفس هيكل الوقود

components/Services/
├── shared/
│   ├── Prices/
│   │   └── index.tsx           # نموذج الأسعار
│   ├── ServicesTabsHeader/
│   │   └── index.tsx           # تبويبات التنقل
│   ├── Tools/
│   │   └── index.tsx           # إدارة الأدوات
│   └── Orders/
│       ├── index.tsx           # جدول الطلبات
│       ├── columnFuel.tsx      # أعمدة الوقود
│       ├── columnTires.tsx     # أعمدة الإطارات
│       └── columnTowing.tsx    # أعمدة السحب
└── Fuel/
    ├── AppPercantage/
    └── AcceptOrder/
```

---
