import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import type { Product } from "@/lib/data/product-utils";

export async function getAdminProductPreviewById(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*, product_images(*), product_sizes(*), product_variants(*, product_variant_images(*), product_variant_sizes(*))").eq("id", id).maybeSingle();
  if (error || !data) return null;

  const paths = [
    ...data.product_images.map((image) => image.storage_path),
    ...data.product_variants.flatMap((variant) => variant.product_variant_images.map((image) => image.storage_path)),
  ];
  const signedUrls = paths.length
    ? await supabase.storage.from("be-different-products").createSignedUrls(paths, 60 * 60)
    : { data: [], error: null };
  if (signedUrls.error) return null;

  const urlByPath = new Map(paths.map((path, index) => [path, signedUrls.data[index]?.signedUrl ?? null]));
  return {
    ...data,
    product_images: data.product_images.map((image) => ({ ...image, signed_url: urlByPath.get(image.storage_path) ?? null })),
    product_variants: data.product_variants.map((variant) => ({
      ...variant,
      product_variant_images: variant.product_variant_images.map((image) => ({ ...image, signed_url: urlByPath.get(image.storage_path) ?? null })),
    })),
  } as unknown as Product;
}
