import type { MetadataRoute } from "next";
import { profile } from "./data/portfolio";
import { sections } from "./sections/registry";

// The list of pages, for search engines. Built from the section registry.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [...sections.map((s) => s.href), "/match"];
  return pages.map((path) => ({
    url: `${profile.siteUrl}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
