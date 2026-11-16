import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductImage } from "./product-utils";
export type { Product } from "./product-utils";

const signedUrlLifetimeSeconds = 60 * 60;
const catalogPageSize = 12;

async function attachSignedImageUrls<T extends { product_images: ProductImage[] }>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  products: T[],
) {
  const paths = [...new Set(products.flatMap((product) => product.product_images.map((image) => image.storage_path)))];
  if (paths.length === 0) return products;

  const { data, error } = await supabase.storage
    .from("be-different-products")
    .createSignedUrls(paths, signedUrlLifetimeSeconds);
  if (error) {
    console.error("Could not create product image URLs", error.message);
    return products.map((product) => ({
      ...product,
      product_images: product.product_images.map((image) => ({ ...image, signed_url: null })),
    }));
  }

  const urls = new Map(paths.map((path, index) => [path, data[index]?.signedUrl ?? null]));
  return products.map((product) => ({
    ...product,
    product_images: product.product_images.map((image) => ({ ...image, signed_url: urls.get(image.storage_path) ?? null })),
  }));
}

function productListQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("products").select("*, product_images(*), product_sizes(*)").eq("publication_status", "published");
}

export async function getFeaturedProducts() {
  const supabase = await createClient();
  const { data, error } = await productListQuery(supabase)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Could not load featured products", error.message);
    return [] satisfies Product[];
  }
  return attachSignedImageUrls(supabase, (data ?? []) as unknown as Product[]);
}

export type CatalogCategory = "all" | "oversized" | "regular-fit";
export type CatalogSort = "featured" | "newest" | "price-asc" | "price-desc";
export type CatalogStatus = "all" | Product["commercial_status"];

export async function getCatalogProducts(options: {
  category: CatalogCategory;
  query: string;
  sort: CatalogSort;
  status: CatalogStatus;
  page: number;
}) {
  const page = Math.max(1, Math.floor(options.page));
  const offset = (page - 1) * catalogPageSize;
  const supabase = await createClient();
  let query = supabase.from("products").select("*, product_images(*), product_sizes(*)", { count: "exact" }).eq("publication_status", "published");

  if (options.category !== "all") query = query.eq("category", options.category);
  if (options.status !== "all") query = query.eq("commercial_status", options.status);

  const search = options.query.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
  if (search) query = query.ilike("name", `%${search}%`);

  if (options.sort === "price-asc") query = query.order("price_cop", { ascending: true });
  else if (options.sort === "price-desc") query = query.order("price_cop", { ascending: false });
  else if (options.sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

  const { data, error, count } = await query.range(offset, offset + catalogPageSize - 1);
  if (error) {
    console.error("Could not load catalog products", error.message);
    return { products: [] as Product[], totalCount: 0, page, pageCount: 0, pageSize: catalogPageSize };
  }

  const totalCount = count ?? 0;
  return {
    products: await attachSignedImageUrls(supabase, (data ?? []) as unknown as Product[]),
    totalCount,
    page,
    pageCount: Math.ceil(totalCount / catalogPageSize),
    pageSize: catalogPageSize,
  };
}

export async function getPublishedProductPaths() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("publication_status", "published");

  if (error) {
    console.error("Could not load published product paths", error.message);
    return [];
  }
  return data ?? [];
}

export const getPublishedProductBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await productListQuery(supabase)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Could not load product", error.message);
    return null;
  }

  if (!data) return null;
  const [product] = await attachSignedImageUrls(supabase, [data as unknown as Product]);
  return product;
});
