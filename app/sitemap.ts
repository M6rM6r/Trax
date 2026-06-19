import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://trax.app";
  const locales = ["ar", "en"];

  const routes = [
    "",
    "/login",
    "/check-in",
    "/employees",
    "/employees/inactive",
    "/attendance",
    "/attendance/reports",
    "/geofences",
    "/live-map",
    "/settings",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.7,
      });
    }
  }

  return entries;
}
