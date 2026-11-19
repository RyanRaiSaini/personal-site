import type { MetadataRoute } from "next";
import { profile } from "./data/portfolio";

// Search engines are welcome everywhere except the data routes
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${profile.siteUrl}/sitemap.xml`,
  };
}
