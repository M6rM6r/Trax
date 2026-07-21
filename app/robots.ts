import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/ar", "/en"],
      disallow: ["/api/", "/ar/check-in", "/ar/employees", "/ar/attendance", "/ar/live-map", "/ar/geofences", "/ar/settings", "/en/check-in", "/en/employees", "/en/attendance", "/en/live-map", "/en/geofences", "/en/settings", "/ar/mastermind", "/en/mastermind"],
    },
    sitemap: "https://naf--trax-ae.asia-southeast1.hosted.app/sitemap.xml",
  };
}
