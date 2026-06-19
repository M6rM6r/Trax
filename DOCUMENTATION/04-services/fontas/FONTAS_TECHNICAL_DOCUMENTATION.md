# Fontas Service - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [API Endpoints](#api-endpoints)
5. [Service Page Features](#service-page-features)
6. [Units Management](#units-management)
7. [Data Models](#data-models)
8. [State Management](#state-management)
9. [Validation](#validation)
10. [Key Functions](#key-functions)
11. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Overview

The Fontas Service is a water delivery management system within the Holol Naql dashboard. It consists of two main sections:

1. **Service Configuration Page** (`/ar/services/fontas?subtype=22`) - Manages pricing, app percentage, peak times, and service settings for different fontas units
2. **Units Management** (`/ar/vehicles/units`) - CRUD operations for fontas units (water containers)

### Key Features
- Dynamic unit-based pricing configuration
- Bulk pricing updates (apply to all, valid water only, or invalid water only)
- Peak time pricing management
- Active driver protection (prevents deletion/deactivation of units with active drivers)
- Duplicate unit validation
- Real-time data synchronization with cache revalidation

---

## Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: React hooks (useState, useEffect, useRef, custom hooks)
- **Form Handling**: Formik
- **Validation**: Yup
- **Data Fetching**: Custom fetcher utilities (SSR & CSR)
- **Styling**: Tailwind CSS + shadcn/ui components

### Design Patterns
1. **Server Components**: Main pages use Server Components for SSR
2. **Client Components**: Interactive forms and modals use "use client"
3. **Custom Hooks**: Business logic extracted to reusable hooks
4. **Confirmation Dialogs**: Two-step confirmation for critical updates
5. **Optimistic Updates**: Values restored on mismatch scenarios

---

## File Structure

```
app/[locale]/
├── services/
│   └── [serviceType]/
│       └── page.tsx                          # Dynamic service page (handles fontas)
│
└── vehicles/
    └── units/
        ├── page.tsx                          # List all fontas units
        ├── columns.tsx                       # Table column definitions
        ├── add/
        │   └── page.tsx                      # Create new unit
        ├── [id]/
        │   ├── page.tsx                      # View unit details
        │   └── edit/
        │       └── page.tsx                  # Edit unit

components/
├── Drivers/
│   └── Pricing/
│       ├── AppPercentage/
│       │   ├── index.tsx                     # Main AppPercentage wrapper
│       │   ├── components/
│       │   │   ├── AppPercentageForm.tsx    # Reusable form component
│       │   │   └── ConfirmDialog.tsx        # Confirmation dialog
│       │   └── services/
│       │       └── FontasAppPercentage/
│       │           ├── index.tsx            # Fontas-specific implementation
│       │           ├── FontasDropdown.tsx   # Unit selection dropdown
│       │           ├── FontasCheckboxes.tsx # Bulk update checkboxes
│       │           └── useFontasAppPercentage.ts  # Custom hook
│       │
│       ├── PricesDay/
│       │   ├── index.tsx                     # Main PricesDay wrapper
│       │   ├── components/
│       │   │   ├── PricesDayForm.tsx        # Reusable form component
│       │   │   ├── StandardPricingFields.tsx # Pricing input fields
│       │   │   ├── FontasCheckboxes.tsx     # Bulk update checkboxes
│       │   │   └── FontasConfirmDialog.tsx  # Fontas confirmation dialog
│       │   ├── services/
│       │   │   └── FontasPricesDay.tsx      # Fontas-specific implementation
│       │   └── hooks/
│       │       └── useFontasPricesDay.ts    # Custom hook
│       │
│       └── PeakPrices/
│           ├── index.tsx                     # Peak prices table
│           ├── AddPeakPrice.tsx             # Add peak time dialog
│           ├── EditPeakPrice.tsx            # Edit peak time dialog
│           ├── DeletePeakTime.tsx           # Delete single peak time
│           ├── DeleteAllPeakTimes.tsx       # Delete all peak times
│           └── columns*.tsx                  # Service-specific columns

lib/
├── types/
│   ├── validationTypes.ts                    # Yup validation schemas
│   ├── responseTypes.ts                      # API response TypeScript types
│   └── enums.ts                              # Enum definitions (FontasTypes, FontasUnits)
├── fetcher.ts                                # Server-side data fetching
├── fetcherClient.ts                          # Client-side data fetching
└── helperFunctions.ts                        # Utility functions
```

---

## API Endpoints

### Service Settings

#### Get Service Settings
```
GET /getServiceSettings?type=fontas&subtype={unit_id}&zone_id={zone_id}
```
**Response**: Service configuration including pricing, app percentage, payment methods, visibility settings

#### Update Service Settings
```
POST /updateServiceSettings
```
**Body** (FormData):
```typescript
{
  type: string;                      // "fontas"
  app_percentage?: number;           // 0-100
  base_price?: number;
  price_per_km?: number;
  price_per_minute?: number;
  free_km?: number;
  cancellation_cost?: number;
  cancellation_time?: number;        // in minutes
  is_coming_soon?: 0 | 1;
  is_hidden?: 0 | 1;
  subtype?: number;                  // fontas unit ID (omit for bulk updates)
  zone_id?: number;

  // Bulk update parameters
  apply_app_percentage_for?: "all" | "valid" | "invalid";
  apply_prices_for?: "all" | "valid" | "invalid";
}
```

### Peak Times

#### Get Peak Times
```
GET /getPeakTimes?type=fontas&subtype={unit_id}&zone_id={zone_id}
```

#### Add Peak Time
```
POST /storePeakTime
```

#### Update Peak Time
```
POST /updatePeakTime/{id}
```

#### Delete Peak Time
```
DELETE /deletePeakTime/{id}
```

#### Delete All Peak Times
```
POST /deleteAllPeakTimes
```

### Fontas Units

#### List Units
```
GET /fontasUnits?itemPerPage={limit}&page={page}
```
**Response**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    records: UnitsRecord[];
    pagination_data: {
      current_page: number;
      total_pages: number;
      total_records: number;
    }
  }
}
```

#### Get Single Unit
```
GET /fontasUnits/{id}
```

#### Create Unit
```
POST /fontasUnits
```
**Body** (FormData):
```typescript
{
  type: "valid" | "invalid";        // Water drinkability
  unit: "ton" | "gallon";           // Measurement unit
  value: number;                     // Quantity
  basic_price: number;               // Base price (deprecated, always 0)
  is_active: "0" | "1";             // Status
}
```

#### Update Unit
```
POST /fontasUnits/{id}
```
**Body** (FormData): Same as create + `_method: "put"`

#### Delete Unit
```
DELETE /fontasUnits/{id}
```

---

## Service Page Features

### 1. App Percentage Management

**Location**: Top section of service page

**Component**: `FontasAppPercentage`

**Features**:
- Input field for percentage (0-100)
- Unit selection dropdown (grouped by valid/invalid water)
- Bulk update checkboxes:
  - Apply to all units
  - Apply to valid water only
  - Apply to invalid water only
- Confirmation dialog before applying changes
- Automatic value restoration when checkbox type doesn't match current unit

**Flow**:
```
User enters percentage → Selects checkbox (optional) → Clicks Save
→ Confirmation dialog opens → User confirms
→ API call with apply_app_percentage_for parameter
→ Cache revalidation → UI updates
```

**Key Features**:
1. **Checkbox Logic**: Only one checkbox can be checked at a time
2. **Value Restoration**: When updating "valid" water only but viewing an "invalid" unit, the form value reverts to original after update
3. **Forced Values**: Uses `forcedValue` state to prevent `enableReinitialize` from overwriting restored values
4. **Scroll Position Preservation**: Maintains scroll position when switching units

### 2. Pricing Configuration

**Location**: Middle section of service page

**Component**: `FontasPricesDay`

**Fields**:
- Base Price (السعر الثابت)
- Price Per Km (السعر بالكيلو)
- Price Per Minute (السعر بالدقيقة)
- Free Km (الكيلوات المجانية)
- Cancellation Cost (تكلفة الإلغاء)
- Cancellation Time (وقت الإلغاء)
- Is Coming Soon (قريباً)
- Is Hidden (مخفي)

**Features**:
- Same bulk update checkboxes as App Percentage
- Confirmation dialog with unit label display
- Zone-based pricing support
- Value restoration logic

### 3. Peak Times Management

**Location**: Bottom section of service page

**Component**: `PeakPrices`

**Features**:
- Add peak time dialog
- Edit existing peak time
- Delete single peak time
- Delete all peak times
- Time overlap validation
- Day-based scheduling (Saturday - Friday)

**Peak Time Fields**:
- Day (اليوم)
- Start Time (وقت البدء)
- End Time (وقت النهاية)
- Price Per Km (السعر بالكيلو)
- Price Per Minute (السعر بالدقيقة)
- Fixed Price (السعر الثابت)
- Minimum Charge (السعر الأدنى)
- Waiting Cost (تكلفة الانتظار)
- Cancellation Cost (تكلفة الإلغاء)
- Free Km (Fontas only)
- Cancellation Time (Fontas only)

---

## Units Management

### 1. List Page

**Route**: `/ar/vehicles/units`

**Features**:
- Paginated table of all fontas units
- Columns:
  - Type (يكتب) - Valid/Invalid for drinking
  - Value (القيمة) - Quantity
  - Unit (الوحدة) - Ton/Gallon
  - Active Drivers Count (السائقين) - Badge showing count
  - Status (الحالة) - Active/Inactive badge
  - Actions (الإجراء) - View/Edit/Delete buttons
- "Create Unit" button in top right
- Dynamic rendering with no caching
- Active drivers count displayed as badge

**Key Features**:
1. **Delete Protection**: Delete button disabled if unit has active drivers
2. **Visual Indicators**:
   - Active driver count shown in badge
   - Status shown with color-coded badge

### 2. Add Page

**Route**: `/ar/vehicles/units/add`

**Form Fields**:
- Type (النوع): Dropdown (Valid/Invalid for drinking)
- Unit (وحدة): Dropdown (Ton/Gallon)
- Value (القيمة): Number input

**Validation**:
```typescript
{
  type: required,
  unit: required,
  value: positive number required,
  is_active: string required (default "0")
}
```

**Features**:
1. **Duplicate Detection**: Checks if unit with same type, unit, and value exists
   - If exists and active: Shows error "Unit already exists and is active"
   - If exists but inactive: Prompts to activate from edit page
2. **Warning Dialog**: After successful creation, shows warning:
   - Unit is inactive by default
   - Must configure pricing before activation
   - Cannot delete/deactivate once drivers are assigned
3. **Arabic-English Mapping**: Converts API Arabic values to English for comparison

**Arabic to English Mapping**:
```typescript
mapArabicToEnglish(value, type) {
  if (type === 'type') {
    'صالح للشرب' | 'صالح' → 'valid'
    'غير صالح للشرب' | 'غير صالح' → 'invalid'
  }
  if (type === 'unit') {
    'طن' → 'ton'
    'جالون' → 'gallon'
  }
}
```

### 3. Edit Page

**Route**: `/ar/vehicles/units/{id}/edit`

**Form Fields**: Same as add page + Status dropdown (Active/Inactive)

**Features**:
1. **Data Mapping**: Converts API Arabic values to English before populating form
2. **Inactive Unit Warning**: Shows warning banner if unit is inactive
3. **Deactivation Protection**: Prevents deactivation if unit has active drivers
4. **Validation**: Same as add page

**Protection Logic**:
```typescript
if (unit.is_active === 1 && newStatus === "0" && unit.active_drivers_count > 0) {
  throw Error("Cannot deactivate unit with active drivers");
}
```

### 4. View Page

**Route**: `/ar/vehicles/units/{id}`

**Displays**:
- Type (النوع)
- Unit (وحدة)
- Value (القيمة)
- Status (الحالة) - Badge with color
- Edit button
- Delete button (protected if has active drivers)

---

## Data Models

### UnitsRecord
```typescript
interface UnitsRecord {
  id: number;
  type: string;                    // Arabic: "صالح للشرب" | "غير صالح للشرب"
  unit: string;                    // Arabic: "طن" | "جالون"
  value: number;
  basic_price: number;             // Deprecated (always 0)
  is_active: number;               // 0 or 1
  active_drivers_count: number;    // Number of active drivers using this unit
  created_at: string;              // ISO timestamp
}
```

### UnitsResponse
```typescript
interface UnitsResponse {
  success: boolean;
  message: string;
  data: {
    records: UnitsRecord[];
    pagination_data: {
      current_page: number;
      total_pages: number;
      total_records: number;
    }
  }
}
```

### ServiceSettingsData
```typescript
interface ServiceSettingsData {
  key: string;                     // e.g., "app_percentage", "base_price"
  value: string | number;
  service_subtype: number | null;  // fontas unit ID
  zone_id: number | null;
}
```

### PeakTimeData
```typescript
interface PeakTimeData {
  id: number;
  day: string;                     // Day of week
  start_time: string;              // HH:mm format
  end_time: string;                // HH:mm format
  price_per_km: number;
  price_per_minute: number;
  fixed_price: number;
  minimum_charge: number;
  waiting_cost: number;
  cancellation_cost: number;
  free_km?: number;                // Fontas only
  cancellation_time?: number;      // Fontas only
}
```

---

## State Management

### Custom Hooks

#### useFontasAppPercentage
**Location**: `components/Drivers/Pricing/AppPercentage/services/FontasAppPercentage/useFontasAppPercentage.ts`

**Purpose**: Manages app percentage form state, checkbox logic, and confirmation dialog

**State**:
```typescript
{
  applyToAll: boolean;             // Apply to all units
  applyToValid: boolean;           // Apply to valid water only
  applyToInvalid: boolean;         // Apply to invalid water only
  confirmOpen: boolean;            // Confirmation dialog visibility
  confirmLoading: boolean;         // Confirmation in progress
  pendingValues: any;              // Values awaiting confirmation
  forcedValue: string | number | null;  // Override for form value
}
```

**Key Methods**:
- `handleCheckboxChange`: Ensures only one checkbox is checked
- `handleFormSubmit`: Opens confirmation dialog
- `handleConfirmSubmit`: Performs API call with bulk parameters
- `getCurrentUnitType`: Returns "valid" | "invalid" | null
- Value restoration logic for mismatched checkbox types

#### useFontasPricesDay
**Location**: `components/Drivers/Pricing/PricesDay/hooks/useFontasPricesDay.ts`

**Purpose**: Similar to useFontasAppPercentage but for pricing fields

**Additional Features**:
- Manages multiple pricing fields
- Stores original values in ref for restoration
- Handles payment methods from service settings

### State Preservation Patterns

#### 1. Scroll Position Preservation
```typescript
const scrollPositionRef = useRef(0);

// Before navigation
scrollPositionRef.current = window.scrollY;
startLoading();
router.replace(url, { scroll: false });

// After data loads
requestAnimationFrame(() => {
  window.scrollTo({
    top: scrollPositionRef.current,
    behavior: "instant"
  });
});
```

#### 2. Value Restoration
```typescript
const originalValuesRef = useRef(initialValues);
const [forcedValues, setForcedValues] = useState(null);

// After bulk update
if (checkboxType !== currentUnitType) {
  setForcedValues(originalValuesRef.current);
  // Prevents enableReinitialize from overwriting
}
```

#### 3. Checkbox State Persistence
```typescript
// Store checkbox states with form values
setPendingValues({
  ...formValues,
  _checkboxStates: { applyToAll, applyToValid, applyToInvalid }
});

// Extract when confirming
const { _checkboxStates, ...actualValues } = pendingValues;
```

---

## Validation

### Unit Validation Schema
**File**: `lib/types/validationTypes.ts`

```typescript
export const validationForUnits = Yup.object({
  type: Yup.string().required("النوع مطلوب"),
  unit: Yup.string().required("الوحدة مطلوبة"),
  value: Yup.number().positive("القيمة مطلوبة"),
  is_active: Yup.string().required("الحالة مطلوبة"),
});
```

**Note**: `basic_price` field removed from validation (deprecated)

### App Percentage Validation
```typescript
export const validationForAppPercentage = Yup.object({
  percentage: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "النسبة المئوية لا يمكن أن تكون رقمًا سالبًا")
    .max(100, "النسبة المئوية يجب ألا تتجاوز 100"),
});
```

### Pricing Validation
```typescript
export const validationForPrices = Yup.object({
  price_per_km: Yup.number()
    .transform((value) => (isNaN(value) || value === "" ? undefined : value))
    .min(0, "السعر بالكيلو لا يمكن أن يكون رقما سالبا")
    .max(100, "السعر بالكيلو يجب ألا يتجاوز 100"),
  price_per_minute: Yup.number()
    .min(0)
    .max(100),
  base_price: Yup.number().min(0),
  minimum_charge: Yup.number().min(0).max(100),
  waiting_cost: Yup.number().min(0).max(100),
  cancellation_cost: Yup.number().min(0).max(100),
});
```

### Peak Time Validation
```typescript
export const validationForPeakTimes = Yup.object({
  day: Yup.string().required("اليوم مطلوب"),
  startTime: Yup.string().required("وقت البدء مطلوب"),
  endTime: Yup.string().required("وقت النهاية مطلوب"),
  priceKilo: Yup.number().max(100).required("السعر بالكيلو مطلوب"),
  minuteKilo: Yup.number().max(100).required("السعر بالدقيقة مطلوب"),
  fixedPrice: Yup.number().max(100).required("السعر الثابت مطلوب"),
  minPrice: Yup.number().max(100),
  waitingTime: Yup.number().max(100),
  cancelTime: Yup.number().max(100).required("وقت الإلغاء مطلوب"),
  // Fontas-specific
  freeKm: Yup.number().max(1000),
  cancellationTime: Yup.number().max(1440), // max 24 hours in minutes
});
```

---

## Key Functions

### getServiceSettingsValue
**Location**: `lib/helperFunctions.ts`

**Purpose**: Extracts setting value for specific key and optional subtype

```typescript
export function getServiceSettingsValue(
  data: ServiceSettingsData[],
  key: string,
  service_subtype?: string | null | number
): string | number {
  // Try to find with subtype first
  if (service_subtype) {
    const itemWithSubtype = data.find(
      (item) => item.key == key && item.service_subtype == service_subtype
    );
    if (itemWithSubtype) {
      return itemWithSubtype.value;
    }
  }

  // Fallback to item without subtype
  const item = data.find((item) => item.key == key && !item.service_subtype);
  return item ? item.value : "";
}
```

**Usage**:
```typescript
const appPercentage = getServiceSettingsValue(
  data.data,
  "app_percentage",
  searchParams.subtype  // fontas unit ID
);
```

### revalidateServiceCache
**Location**: `app/actions/revalidate.ts`

**Purpose**: Server action to revalidate Next.js cache

```typescript
"use server";
import { revalidateTag } from "next/cache";

export async function revalidateServiceCache(tag: string) {
  revalidateTag(tag);
}
```

**Usage**:
```typescript
await revalidateServiceCache(`service-${serviceType}`);
```

### mapArabicToEnglish
**Location**: Unit add/edit pages

**Purpose**: Converts API Arabic enum values to English for validation/comparison

```typescript
const mapArabicToEnglish = (arabicValue: string, type: 'type' | 'unit') => {
  if (type === 'type') {
    if (arabicValue === 'صالح للشرب' || arabicValue === 'صالح') return 'valid';
    if (arabicValue === 'غير صالح للشرب' || arabicValue === 'غير صالح') return 'invalid';
  }
  if (type === 'unit') {
    if (arabicValue === 'طن') return 'ton';
    if (arabicValue === 'جالون') return 'gallon';
  }
  return arabicValue;
};
```

---

## Common Issues & Troubleshooting

### 1. Values Not Updating After Bulk Update

**Problem**: When applying pricing to "valid" water only, but currently viewing an "invalid" unit, the form doesn't show original values.

**Solution**: Implemented value restoration logic in custom hooks:
```typescript
if (checkboxType !== currentUnitType) {
  setForcedValues(originalValuesRef.current);
  pendingSetFieldValue.current("field", originalValue);
}
```

**Prevention**: Always clear `forcedValues` when unit changes:
```typescript
useEffect(() => {
  setForcedValues(null);
}, [searchParams.get("subtype")]);
```

### 2. Cache Not Refreshing

**Problem**: Service page shows stale data after updates.

**Solutions**:
1. Use `export const dynamic = 'force-dynamic'` in page components
2. Add `export const revalidate = 0` in page components
3. Pass `{ cache: 'no-store' }` to fetcher calls
4. Call `revalidateServiceCache()` after mutations

### 3. Duplicate Unit Creation

**Problem**: Users creating duplicate units with same type, unit, and value.

**Solution**: Pre-check before submission:
```typescript
const existingUnits = await fetcherClient("/fontasUnits?itemPerPage=50");
const duplicateUnit = existingUnits?.data?.records?.find(
  (unit: any) => {
    const mappedType = mapArabicToEnglish(unit.type, 'type');
    const mappedUnit = mapArabicToEnglish(unit.unit, 'unit');
    return mappedType === values.type &&
           mappedUnit === values.unit &&
           parseFloat(unit.value) === parseFloat(values.value);
  }
);
```

### 4. Cannot Delete Unit with Active Drivers

**Problem**: Delete button doesn't work for units with drivers.

**Expected Behavior**: This is intentional protection.

**Solution**: Show toast message:
```typescript
if (row.original.active_drivers_count > 0) {
  toast({
    description: "لا يمكن حذف وحدة الفونتاس لأن هناك سائقين نشطين مرتبطين بها",
    variant: "destructive",
  });
}
```

### 5. Arabic/English Enum Mismatch

**Problem**: Database expects English values but API returns Arabic.

**Solution**: Use `mapArabicToEnglish` function before:
- Form submission
- Duplicate checking
- Validation

### 6. Scroll Position Lost on Unit Change

**Problem**: Page scrolls to top when switching units.

**Solution**: Store and restore scroll position:
```typescript
scrollPositionRef.current = window.scrollY;
router.replace(url, { scroll: false });

// After render
requestAnimationFrame(() => {
  window.scrollTo({ top: scrollPositionRef.current, behavior: "instant" });
});
```

### 7. Form Reinitializes After Update

**Problem**: `enableReinitialize` overwrites manually set values after API response.

**Solution**: Use forced values to override:
```typescript
<Formik
  initialValues={{
    field: forcedValues?.field ?? propValue
  }}
  enableReinitialize={forcedValues === null}
/>
```

### 8. Checkbox States Not Preserved in Confirmation

**Problem**: Checkbox states change between form submit and confirmation.

**Solution**: Store checkbox states with form values:
```typescript
setPendingValues({
  ...formValues,
  _checkboxStates: { applyToAll, applyToValid, applyToInvalid }
});
```

---

## Performance Optimizations

### 1. Server-Side Rendering
- Main pages use Server Components for faster initial load
- Data fetched server-side reduces client-side API calls

### 2. Conditional Data Fetching
```typescript
// Only fetch for relevant service types
if (params.serviceType === "fontas") {
  fontasUnits = await fetcher("/fontasUnits?itemPerPage=50");
}
```

### 3. Request Deduplication
- Next.js automatically deduplicates identical fetch requests in the same render pass

### 4. Loading States
- Global loading overlay prevents multiple concurrent actions
- Component-level loading states for better UX

### 5. Pagination
- Units list paginated to reduce payload size
- Default 50 items per page for dropdown (all active units)






