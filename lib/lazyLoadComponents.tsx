import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const loadable = <P extends object>(
  loader: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
  opts: Parameters<typeof dynamic>[1] = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => dynamic<P>(loader as any, opts as any);

export const loadOpenLayers = async () => await import("ol");

export const LazyTiptapEditorContent = loadable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => import("@tiptap/react").then((mod) => mod.EditorContent ?? (mod as any).default),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false,
  }
);

export const LazyRichTextEditor = loadable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => import("@/components/shared/RichTextEditor").then((m) => m.default ?? (m as any)),
  {
    loading: () => <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />,
    ssr: false,
  }
);

export const LazyMapComponent = loadable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => import("@/components/shared/MapComponent").then((m) => m.default ?? (m as any)),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />,
    ssr: false,
  }
);

export const LazyChart = loadable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => import("recharts").then((m) => m.ResponsiveContainer ?? (m as any).default),
  {
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
    ssr: false,
  }
);

export const loadPDFLib = async () => await import("jspdf");
export const loadExportUtils = async () => await import("@/lib/utils/exportUtils");

export const LazyFramerMotion = loadable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  () => import("framer-motion").then((m) => ({ default: (m as any).motion })),
  {
    ssr: false,
  }
);
