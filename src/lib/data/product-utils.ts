import type { Tables } from "@/lib/supabase/database.types";

export type Product = Tables<"products"> & {
  product_images: ProductImage[];
  product_sizes: Tables<"product_sizes">[];
  product_variants: ProductVariant[];
};

export type ProductImage = Tables<"product_images"> & { signed_url: string | null };
export type ProductVariantImage = Tables<"product_variant_images"> & { signed_url: string | null };
export type ProductVariant = Tables<"product_variants"> & {
  product_variant_images: ProductVariantImage[];
  product_variant_sizes: Tables<"product_variant_sizes">[];
};

export function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
