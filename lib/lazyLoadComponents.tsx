// lib/lazyLoadComponents.tsx
/**
 * Lazy Load Heavy Dependencies
 * Fixed for TypeScript + Next.js
 *
 * - Save this file as .tsx
 * - Use dynamic only for React components
 * - Use loader functions for non-component libraries
 */

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// -------------------------
// Helper: a small typed wrapper
// -------------------------
const loadable = <P extends object>(
  loader: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
  opts: Parameters<typeof dynamic>[1] = {}
) => dynamic<P>(loader as any, opts as any);

// ============================================
// LAZY LOAD LIBRARIES (non-React modules)
// Use these loader functions from client code when you need the raw module.
// Example: const xlsx = await loadXLSX();
// ============================================
export const loadXLSX = async () => await import("xlsx");
export const loadOpenLayers = async () => await import("ol");

// For libraries that export utilities (use like `const { something } = await loadFoo();`)
// They are safe to call inside useEffect or event handlers (client-side).

// ============================================
// LAZY LOAD HEAVY CHARTING LIBRARY
// ============================================
// export const LazyRecharts = dynamic(() => import("recharts"), {
//   loading: () => <div>Loading chart...</div>,
//   ssr: false,
// });

// ============================================
// LAZY LOAD REACT COMPONENTS (use dynamic)
// ============================================

// If the package exposes a React component as named export, grab that named export.
// Example: tiptap exports EditorContent and React components — pick the one you need.

// Tiptap: load EditorContent component (named export)
export const LazyTiptapEditorContent = loadable(
  () =>
    import("@tiptap/react").then(
      (mod) => mod.EditorContent ?? (mod as any).default
    ),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false,
  }
);

// If you need the whole tiptap react module (hooks, Editor class, etc.), use loader instead:
// export const loadTiptapModule = async () => await import('@tiptap/react');

// ============================================
// LAZY LOAD HEAVY COMPONENTS (your project components)
// ============================================
export const LazyOverviewAnalytics = loadable(
  () =>
    import("@/components/Home/Analytics/OverviewAnalytics").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
    // keep ssr true only if the component supports server rendering
    ssr: false, // set to false if it uses browser-only APIs
  }
);

export const LazyDriversAnalytics = loadable(
  () =>
    import("@/components/Drivers/Analytics/AllDriversAnalytics").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

export const LazyCustomersAnalytics = loadable(
  () =>
    import("@/components/Customers/Analytics/CustomerAnalytics").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

export const LazyServicesAnalytics = loadable(
  () =>
    import("@/components/Services/Analytics/ServicesAnalytics").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

export const LazyTripsAnalytics = loadable(
  () =>
    import("@/components/Trips/TripsAnalytics").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

export const LazyOutagesAnalytics = loadable(
  () =>
    import("@/components/outages/Analytics").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

// ============================================
// LAZY LOAD HEAVY FORMS / DIALOGS
// ============================================
export const LazyRichTextEditor = loadable(
  () =>
    import("@/components/shared/RichTextEditor").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

export const LazyMapComponent = loadable(
  () =>
    import("@/components/shared/MapComponent").then(
      (m) => m.default ?? (m as any)
    ),
  {
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
    ssr: false,
  }
);

export const LazyImagePreviewDialog = loadable(
  () =>
    import("@/components/shared/ImagePreviewDialog").then(
      (m: any) => m.default ?? (m as any)
    ),
  { loading: () => <div>Loading...</div>, ssr: false }
);

export const LazyAuthenticatorDialog = loadable(
  () =>
    import("@/components/shared/AuthenticatorDialog").then(
      (m) => m.default ?? (m as any)
    ),
  { loading: () => <div>Loading...</div>, ssr: false }
);

export const LazySMSVerificationDialog = loadable(
  () =>
    import("@/components/shared/SMSVerificationDialog").then(
      (m) => m.default ?? (m as any)
    ),
  { loading: () => <div>Loading...</div>, ssr: false }
);

// ============================================
// USAGE EXAMPLES
// ============================================
// 1) React dynamic component (in a client component):
//    import { LazyOverviewAnalytics } from '@/lib/lazyLoadComponents';
//    <LazyOverviewAnalytics {...props} />
//
// 2) Non-component library (use inside an effect or handler):
//    import { loadXLSX } from '@/lib/lazyLoadComponents';
//    useEffect(() => {
//      (async () => {
//        const XLSX = await loadXLSX();
//        // use XLSX
//      })();
//    }, []);
