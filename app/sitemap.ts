import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://naf--trax-ae.asia-southeast1.hosted.app";
  const locales = ["ar", "en"];

  const routes = [
    "",
    "/login",
    "/register",
    "/forgot-password",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "monthly",
        priority: route === "" ? 1.0 : 0.6,
      });
    }
  }

  return entries;
}
