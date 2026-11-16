import type { Tables } from "@/lib/supabase/database.types";

export type Product = Tables<"products"> & {
  product_images: ProductImage[];
  product_sizes: Tables<"product_sizes">[];
};

export type ProductImage = Tables<"product_images"> & { signed_url: string | null };

export function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
