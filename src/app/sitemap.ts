import type { MetadataRoute } from "next";
import { getPublishedProductPaths } from "@/lib/data/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) return [];

  const fixedRoutes = ["", "/catalogo", "/nosotros", "/contacto"];
  const products = await getPublishedProductPaths();
  return [
    ...fixedRoutes.map((route) => ({ url: `${siteUrl}${route}`, changeFrequency: "weekly" as const, priority: route ? 0.7 : 1 })),
    ...products.map((product) => ({ url: `${siteUrl}/producto/${product.slug}`, lastModified: product.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
