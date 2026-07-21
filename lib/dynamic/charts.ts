import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PieChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.PieChart as ComponentType<any>),
  { ssr: false }
);

export const Pie: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Pie as ComponentType<any>),
  { ssr: false }
);

export const Cell: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Cell as ComponentType<any>),
  { ssr: false }
);

export const ResponsiveContainer: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer as ComponentType<any>),
  { ssr: false }
);

export const Tooltip: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip as ComponentType<any>),
  { ssr: false }
);

export const LineChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.LineChart as ComponentType<any>),
  { ssr: false }
);

export const Line: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Line as ComponentType<any>),
  { ssr: false }
);

export const XAxis: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.XAxis as ComponentType<any>),
  { ssr: false }
);

export const YAxis: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.YAxis as ComponentType<any>),
  { ssr: false }
);

export const CartesianGrid: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid as ComponentType<any>),
  { ssr: false }
);

export const Legend: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Legend as ComponentType<any>),
  { ssr: false }
);

/* eslint-enable @typescript-eslint/no-explicit-any */
