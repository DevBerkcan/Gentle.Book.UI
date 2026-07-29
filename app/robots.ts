import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/superadmin", "/my-bookings", "/verify-email"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
