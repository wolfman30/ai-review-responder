import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/dashboard", "/api/"],
    },
    sitemap: "https://reviews.aiwolfsolutions.com/sitemap.xml",
  };
}
