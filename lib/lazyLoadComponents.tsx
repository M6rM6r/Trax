import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const loadable = <P extends object>(
  loader: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
  opts: Parameters<typeof dynamic>[1] = {}
) => dynamic<P>(loader as any, opts as any);

export const loadXLSX = async () => await import("xlsx");
export const loadOpenLayers = async () => await import("ol");

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
