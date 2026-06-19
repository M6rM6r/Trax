# صلاحيات المشرفين (Admin Permissions)

## نظرة عامة

قسم صلاحيات المشرفين يتيح إدارة المشرفين (المستخدمين الإداريين)، الأدوار والصلاحيات، التصنيفات (Labels)، وفرق إدارة الشكاوى. يعتمد النظام على هيكل صلاحيات هرمي حيث يتم تجميع الصلاحيات في مجموعات وأدوار تُسند للمستخدمين.

---

## الصفحات

### 1. المشرفين (Moderators)

- **المسار:** `/moderators`
- **الملف:** `app/[locale]/moderators/page.tsx`
- **الوصف:** عرض قائمة بجميع المشرفين المسجلين في النظام

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/users` |
| **Method** | `GET` |
| **Response Type** | `UsersResponse` |

**البيانات المُرجعة:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    records: UserRecord[];
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
| الاسم | `name` | اسم المشرف مع الصورة |
| البريد الإلكتروني | `email` | البريد الإلكتروني للمشرف |
| الإجراء | `actions` | عرض، تعديل، حذف |

---

#### إضافة مشرف جديد

- **المسار:** `/moderators/add`
- **الملف:** `app/[locale]/moderators/add/page.tsx`

**API Call:**
```
POST /users
Content-Type: multipart/form-data
```

**الحقول المطلوبة:**

| الحقل | النوع | الوصف | مطلوب | التحقق |
|-------|-------|-------|-------|--------|
| `name` | `string` | اسم المشرف | نعم | 3 حروف على الأقل، بدون أرقام، بدون مسافات في البداية/النهاية |
| `email` | `string` | البريد الإلكتروني | نعم | صيغة بريد صالحة |
| `password` | `string` | كلمة المرور | نعم | - |
| `confirmPassword` | `string` | تأكيد كلمة المرور | نعم | يجب أن يطابق كلمة المرور |
| `role` | `select` | الدور | نعم | يتم جلب الأدوار من `/roles` |

---

#### صفحة تفاصيل المشرف

- **المسار:** `/moderators/[id]`
- **الملف:** `app/[locale]/moderators/[id]/page.tsx`

**API Call:**

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/users/{id}` |
| **Method** | `GET` |

**البيانات المعروضة:**
- اسم المشرف والبريد الإلكتروني
- الصلاحيات مجمّعة حسب المجموعة (`group_ar`)
- زر التعديل (ينتقل إلى صفحة التعديل)
- زر الحذف (يفتح مربع حوار التأكيد)

---

#### تعديل بيانات المشرف

- **المسار:** `/moderators/[id]/edit`
- **الملف:** `app/[locale]/moderators/[id]/edit/page.tsx`

**API Calls المستخدمة:**

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/users/{id}` | `GET` | جلب بيانات المشرف الحالية |
| `/roles` | `GET` | جلب الأدوار المتاحة |
| `/modelDDLList?model_name=Permission` | `GET` | جلب جميع الصلاحيات المتاحة |
| `/users/{id}` | `POST` (`_method=put`) | تحديث بيانات المشرف |

**حقول التعديل:**

| الحقل | النوع | الوصف |
|-------|-------|-------|
| الاسم | `string` | اسم المشرف |
| البريد الإلكتروني | `string` | البريد الإلكتروني |
| كلمة المرور | `string` | اختياري (لإعادة تعيين كلمة المرور) |
| تأكيد كلمة المرور | `string` | اختياري |
| الصلاحيات | `checkbox[]` | اختيار صلاحيات فردية مباشرة |

**ملاحظة:** في صفحة التعديل، يمكن إسناد صلاحيات فردية مباشرة للمشرف بدلاً من الدور فقط. الصلاحيات تُعرض مجمّعة حسب المجموعة مع Checkboxes.

---

### 2. الأدوار (Roles)

- **المسار:** `/roles`
- **الملف:** `app/[locale]/roles/page.tsx`
- **الوصف:** إدارة الأدوار وتحديد الصلاحيات لكل دور

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/roles` |
| **Method** | `GET` |
| **Response Type** | `RolesResponse` |

---

#### الأعمدة المعروضة

| العمود | الحقل | الوصف |
|--------|-------|-------|
| تحديد | `select` | Checkbox لتحديد الصفوف |
| الاسم بالعربية | `title_ar` | اسم الدور بالعربية |
| الاسم بالإنجليزية | `title_en` | اسم الدور بالإنجليزية |
| الإجراء | `actions` | عرض، تعديل، حذف |

---

#### إنشاء دور جديد

- **المسار:** `/roles/add`
- **الملف:** `app/[locale]/roles/add/page.tsx`

**API Call:**
```
POST /roles
Content-Type: multipart/form-data
```

**الحقول المطلوبة:**

| الحقل | النوع | الوصف | مطلوب | التحقق |
|-------|-------|-------|-------|--------|
| `title_ar` | `string` | اسم الدور بالعربية | نعم | 3-50 حرف، بدون أرقام |
| `title_en` | `string` | اسم الدور بالإنجليزية | نعم | 3-50 حرف، بدون أرقام |
| `permissions[]` | `checkbox[]` | الصلاحيات المُسندة | نعم | صلاحية واحدة على الأقل |

**جلب الصلاحيات المتاحة:**
```
GET /modelDDLList?model_name=Permission
```

الصلاحيات تُعرض مجمّعة حسب `group_ar` مع عرض `title_ar` لكل صلاحية.

---

#### صفحة تفاصيل الدور

- **المسار:** `/roles/[id]`
- **الملف:** `app/[locale]/roles/[id]/page.tsx`

**API Call:**

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/roles/{id}` |
| **Method** | `GET` |

**البيانات المعروضة:**
- اسم الدور بالعربية والإنجليزية
- قائمة الصلاحيات مجمّعة حسب المجموعة
- زر التعديل وزر الحذف

---

#### تعديل الدور

- **المسار:** `/roles/[id]/edit`
- **الملف:** `app/[locale]/roles/[id]/edit/page.tsx`

**API Calls المستخدمة:**

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/roles/{id}` | `GET` | جلب بيانات الدور الحالية |
| `/modelDDLList?model_name=Permission` | `GET` | جلب جميع الصلاحيات المتاحة |
| `/roles/{id}` | `POST` (`_method=put`) | تحديث بيانات الدور |

**حقول التعديل:** نفس حقول الإنشاء مع تعبئة مسبقة بالبيانات الحالية.

---

### 3. التصنيفات (Categories / Labels)

- **المسار:** `/categories`
- **الملف:** `app/[locale]/categories/page.tsx`
- **الوصف:** إدارة التصنيفات (Labels) المستخدمة في النظام

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/labels` |
| **Method** | `GET` |
| **Response Type** | `LabelsResponse` |

---

#### الأعمدة المعروضة

| العمود | الحقل | الوصف |
|--------|-------|-------|
| الاسم بالعربية | `title_ar` | اسم التصنيف بالعربية |
| الاسم بالإنجليزية | `title_en` | اسم التصنيف بالإنجليزية |
| اللون | `color` | عرض اللون مع الكود السداسي |
| الحالة | `is_active` | نشط / غير نشط (StatusCell) |
| الإجراء | `actions` | عرض، تعديل، حذف |

---

#### إضافة تصنيف جديد

- **المسار:** `/categories/add`
- **الملف:** `app/[locale]/categories/add/page.tsx`

**API Call:**
```
POST /labels
Content-Type: multipart/form-data
```

**الحقول المطلوبة:**

| الحقل | النوع | الوصف | مطلوب | التحقق |
|-------|-------|-------|-------|--------|
| `title_ar` | `string` | الاسم بالعربية | نعم | 3-50 حرف |
| `title_en` | `string` | الاسم بالإنجليزية | نعم | 3-50 حرف |
| `description_ar` | `RichTextEditor` | الوصف بالعربية | نعم | 3-200 حرف |
| `description_en` | `RichTextEditor` | الوصف بالإنجليزية | نعم | 3-200 حرف |
| `color` | `ColorPicker` | لون التصنيف | نعم | صيغة Hex (الافتراضي: `#e66465`) |
| `is_active` | `select` | الحالة | نعم | 0 (غير نشط) أو 1 (نشط) |

---

#### صفحة تفاصيل التصنيف

- **المسار:** `/categories/[id]`
- **الملف:** `app/[locale]/categories/[id]/page.tsx`

**API Call:**

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/labels/{id}` |
| **Method** | `GET` |

**البيانات المعروضة:**
- الاسم بالعربية والإنجليزية
- عرض اللون مع الكود السداسي
- حالة التصنيف (Badge)
- الوصف بالعربية (عبر مكون `ShowDescription`)
- الوصف بالإنجليزية (عبر مكون `ShowDescription`)
- زر التعديل وزر الحذف

---

#### تعديل التصنيف

- **المسار:** `/categories/[id]/edit`
- **الملف:** `app/[locale]/categories/[id]/edit/page.tsx`

**API Calls المستخدمة:**

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/labels/{id}` | `GET` | جلب بيانات التصنيف الحالية |
| `/labels/{id}` | `POST` (`_method=put`) | تحديث بيانات التصنيف |

**حقول التعديل:** نفس حقول الإنشاء مع تعبئة مسبقة بالبيانات الحالية.

---

### 4. إدارة فرق الشكاوى (Complaints Team)

- **المسار:** `/complaintsTeam`
- **الملف:** `app/[locale]/complaintsTeam/page.tsx`
- **الوصف:** إدارة فرق العمل المسؤولة عن التعامل مع الشكاوى

#### API Call

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/teams` |
| **Method** | `GET` |
| **Response Type** | `TeamsResponse` |

---

#### الأعمدة المعروضة

| العمود | الحقل | الوصف |
|--------|-------|-------|
| الاسم بالعربية | `title_ar` | اسم الفريق بالعربية |
| الاسم بالإنجليزية | `title_en` | اسم الفريق بالإنجليزية |
| عدد الأعضاء | `members_count` | عدد أعضاء الفريق (رابط قابل للنقر) |
| الحالة | `is_active` | نشط / غير نشط (StatusCell) |
| الإجراء | `actions` | عرض، تعديل، حذف |

---

#### إنشاء فريق جديد

- **المسار:** `/complaintsTeam/add`
- **الملف:** `app/[locale]/complaintsTeam/add/page.tsx`

**API Call:**
```
POST /teams
Content-Type: multipart/form-data
```

**API Calls لجلب البيانات:**

| Endpoint | الوصف |
|----------|-------|
| `/modelDDLList?model_name=User` | جلب قائمة المستخدمين المتاحين |
| `/modelDDLList?model_name=ComplaintCategory` | جلب تصنيفات الشكاوى |

**الحقول المطلوبة:**

| الحقل | النوع | الوصف | مطلوب | التحقق |
|-------|-------|-------|-------|--------|
| `title_ar` | `string` | اسم الفريق بالعربية | نعم | 3-50 حرف |
| `title_en` | `string` | اسم الفريق بالإنجليزية | نعم | 3-50 حرف |
| `is_active` | `select` | الحالة | نعم | 0 أو 1 |
| `categories[]` | `multi-select` | تصنيفات الشكاوى | نعم | تصنيف واحد على الأقل |
| `manager` | `select` | مدير الفريق | نعم | اختيار واحد |
| `members[]` | `multi-select` | أعضاء الفريق | نعم | عضو واحد على الأقل |

**منطق الفلترة الذكية:**
- عند اختيار مدير الفريق، يُستبعد من قائمة الأعضاء المتاحين
- عند اختيار أعضاء، يُستبعدون من قائمة المدراء المتاحين
- لا يمكن لشخص أن يكون مديراً وعضواً في نفس الوقت

---

#### صفحة تفاصيل الفريق

- **المسار:** `/complaintsTeam/[id]`
- **الملف:** `app/[locale]/complaintsTeam/[id]/page.tsx`

**API Call:**

| الخاصية | القيمة |
|---------|--------|
| **Endpoint** | `/teams/{id}` |
| **Method** | `GET` |

**البيانات المعروضة:**
- اسم الفريق بالعربية والإنجليزية
- حالة الفريق (Badge)
- التصنيفات المرتبطة (مفصولة بفواصل)
- اسم المدير
- جدول بأعضاء الفريق (المدير + الأعضاء)

**أعمدة جدول الأعضاء:**

| العمود | الوصف |
|--------|-------|
| الاسم | اسم العضو مع الصورة (AvatarWithName) |
| البريد الإلكتروني | البريد الإلكتروني للعضو |
| الدور | مدير (Manager) / عضو (Member) |
| الإجراء | حذف العضو من الفريق |

**العنوان:** `أعضاء الفريق (X اعضاء)`

---

#### صفحة أعضاء الفريق

- **المسار:** `/complaintsTeam/[id]/teamMember`
- **الملف:** `app/[locale]/complaintsTeam/[id]/teamMember/page.tsx`
- **الوصف:** عرض وإدارة أعضاء فريق محدد

**أعمدة الجدول:**

| العمود | الوصف |
|--------|-------|
| اسم الموظف | أول كلمتين من الاسم |
| الدور | دور العضو في الفريق |
| الإجراء | زر حذف العضو |

**مربع حوار حذف العضو:**
- العنوان: "هل أنت متأكد من حذف العضو من الفريق؟"
- تحذير بشأن إزالة العضو وإعادة تعيين الشكاوى

---

#### تعديل الفريق

- **المسار:** `/complaintsTeam/[id]/edit`
- **الملف:** `app/[locale]/complaintsTeam/[id]/edit/page.tsx`

**API Calls المستخدمة:**

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/teams/{id}` | `GET` | جلب بيانات الفريق الحالية |
| `/modelDDLList?model_name=User` | `GET` | جلب قائمة المستخدمين |
| `/modelDDLList?model_name=ComplaintCategory` | `GET` | جلب تصنيفات الشكاوى |
| `/teams/{id}` | `POST` (`_method=put`) | تحديث بيانات الفريق |

**حقول التعديل:** نفس حقول الإنشاء مع تعبئة مسبقة بالبيانات الحالية ونفس منطق الفلترة الذكية.

---

## أنواع البيانات (Types)

### UserRecord (المشرف)

```typescript
interface UserRecord {
  id: number;
  name: string;
  email: string;
  created_at: string;
  permissions: UserPermission[];
}

interface UserPermission {
  id: number;
  permission: string;
  title: string;
  group: string;
}
```

### RolesRecord (الدور)

```typescript
interface RolesRecord {
  id: number;
  title_en: string;
  title_ar: string;
  created_at: string;
  permissions: RolePermission[];
}
```

### LabelsRecord (التصنيف)

```typescript
interface LabelsRecord {
  id: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  color: string;
  is_active: number;
  created_at: string;
}
```

### Team (الفريق)

```typescript
interface Team {
  id: number;
  title_ar: string;
  title_en: string;
  is_active: number;
  members_count: number;
  categories: Category[];
  members: Member[];
  manager: Manager;
  created_at: string;
}

interface Manager {
  id: number;
  name: string;
  email: string;
}

interface Member {
  id: number;
  name: string;
  email: string;
  is_manager: number;
}
```

---

## نظام الصلاحيات

يعتمد النظام على هيكل صلاحيات هرمي:

1. **الصلاحيات (Permissions):** قدرات فردية (مثل: عرض المستخدمين، تعديل الأدوار)
2. **المجموعات (Groups):** تنظيم الصلاحيات حسب الفئة (مثل: إدارة المشرفين، إدارة الأدوار)
3. **الأدوار (Roles):** مجموعات من الصلاحيات تُسند للمستخدمين
4. **المشرفين (Users):** يمكنهم الحصول على صلاحيات عبر الأدوار أو صلاحيات مباشرة

**كل صلاحية تحتوي على:**
- `id` - المعرف الفريد
- `permission` - مفتاح الصلاحية (slug)
- `title` - عنوان العرض
- `group` - المجموعة / الفئة

---

## هيكل الملفات

```
app/[locale]/moderators/
├── page.tsx                    # قائمة المشرفين
├── columns.tsx                 # تعريف أعمدة الجدول
├── add/
│   └── page.tsx               # إضافة مشرف
└── [id]/
    ├── page.tsx               # تفاصيل المشرف
    └── edit/
        └── page.tsx           # تعديل المشرف

app/[locale]/roles/
├── page.tsx                    # قائمة الأدوار
├── columns.tsx                 # تعريف أعمدة الجدول
├── add/
│   └── page.tsx               # إنشاء دور
└── [id]/
    ├── page.tsx               # تفاصيل الدور
    └── edit/
        └── page.tsx           # تعديل الدور

app/[locale]/categories/
├── page.tsx                    # قائمة التصنيفات
├── columns.tsx                 # تعريف أعمدة الجدول
├── add/
│   └── page.tsx               # إضافة تصنيف
└── [id]/
    ├── page.tsx               # تفاصيل التصنيف
    └── edit/
        └── page.tsx           # تعديل التصنيف

app/[locale]/complaintsTeam/
├── page.tsx                    # قائمة الفرق
├── columns.tsx                 # تعريف أعمدة الجدول
├── add/
│   └── page.tsx               # إنشاء فريق
└── [id]/
    ├── page.tsx               # تفاصيل الفريق
    ├── columns.tsx            # أعمدة جدول الأعضاء
    ├── edit/
    │   └── page.tsx           # تعديل الفريق
    └── teamMember/
        ├── page.tsx           # أعضاء الفريق
        └── columns.tsx        # أعمدة جدول الأعضاء
```

---

## ملخص API Calls

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/users` | `GET` | جلب قائمة المشرفين |
| `/users` | `POST` | إضافة مشرف جديد |
| `/users/{id}` | `GET` | جلب بيانات مشرف محدد |
| `/users/{id}` | `POST` (`PUT`) | تعديل بيانات مشرف |
| `/users/{id}` | `DELETE` | حذف مشرف |
| `/roles` | `GET` | جلب قائمة الأدوار |
| `/roles` | `POST` | إنشاء دور جديد |
| `/roles/{id}` | `GET` | جلب بيانات دور محدد |
| `/roles/{id}` | `POST` (`PUT`) | تعديل دور |
| `/roles/{id}` | `DELETE` | حذف دور |
| `/labels` | `GET` | جلب قائمة التصنيفات |
| `/labels` | `POST` | إضافة تصنيف جديد |
| `/labels/{id}` | `GET` | جلب بيانات تصنيف محدد |
| `/labels/{id}` | `POST` (`PUT`) | تعديل تصنيف |
| `/labels/{id}` | `DELETE` | حذف تصنيف |
| `/teams` | `GET` | جلب قائمة الفرق |
| `/teams` | `POST` | إنشاء فريق جديد |
| `/teams/{id}` | `GET` | جلب بيانات فريق محدد |
| `/teams/{id}` | `POST` (`PUT`) | تعديل فريق |
| `/teams/{id}` | `DELETE` | حذف فريق |
| `/modelDDLList?model_name=Permission` | `GET` | جلب الصلاحيات المتاحة |
| `/modelDDLList?model_name=User` | `GET` | جلب قائمة المستخدمين |
| `/modelDDLList?model_name=ComplaintCategory` | `GET` | جلب تصنيفات الشكاوى |

---

## ملاحظات تقنية

1. **Formik:** جميع النماذج تستخدم Formik لإدارة حالة النموذج
2. **Validation Schema:** كل نموذج يستخدم مخطط تحقق خاص (Yup)
3. **FormData:** جميع الطلبات تُرسل بصيغة `multipart/form-data`
4. **Method Override:** عمليات التعديل تستخدم `_method=put` مع `POST`
5. **Dynamic Filtering:** فلترة ذكية لخيارات المدير/الأعضاء في فرق الشكاوى
6. **groupByGroupToArray():** دالة مساعدة لتجميع الصلاحيات حسب المجموعة
7. **RichTextEditor:** محرر نصوص غني للوصف في التصنيفات (يدعم HTML)
8. **ColorPicker:** أداة اختيار ألوان لتحديد لون التصنيف بصيغة Hex
9. **Soft Delete:** جميع عمليات الحذف تتطلب تأكيد عبر مربع حوار
10. **Toast Notifications:** إشعارات نجاح/خطأ عبر `useResponseToast`

---
