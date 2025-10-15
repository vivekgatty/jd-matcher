import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.jdmatcher.com";
  const now = new Date();

  const routes = [
    "/",               // home
    "/studio",
    "/studio/ad",
    "/studio/email",
    "/studio/portfolio",
    "/studio/templates",
    "/share"           // the landing of the share page (query params come later)
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 0.9 : 0.6,
  }));
}
