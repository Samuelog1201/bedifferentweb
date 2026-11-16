"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

const LoginSchema = z.object({
  email: z.email().transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function signInAdmin(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Revisa el correo y la contraseña." };
  if (parsed.data.email !== process.env.ADMIN_EMAIL?.toLowerCase()) return { error: "No tienes acceso al administrador." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "No fue posible iniciar sesión. Verifica tus datos e inténtalo de nuevo." };

  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  if (typeof email !== "string" || email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    await supabase.auth.signOut();
    return { error: "La cuenta autenticada no está autorizada para el panel." };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}

const MoneySchema = z.string().trim().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(Number.MAX_SAFE_INTEGER));
const OptionalMoneySchema = z.union([z.literal("").transform(() => null), MoneySchema]);
const SizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);
const VariantsSchema = z.array(z.object({
  client_key: z.string().min(1).max(100),
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(60),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sizes: z.array(z.object({ size: SizeSchema, is_available: z.boolean() })).max(6),
})).refine((variants) => variants.every((variant) => new Set(variant.sizes.map((item) => item.size)).size === variant.sizes.length), "Tallas duplicadas")
  .refine((variants) => new Set(variants.map((variant) => variant.client_key)).size === variants.length, "Claves duplicadas");

const ProductSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().max(240),
  description: z.string().trim().max(10_000),
  price_cop: MoneySchema,
  compare_at_price_cop: OptionalMoneySchema,
  category: z.enum(["oversized", "regular-fit"]),
  fit: z.enum(["oversized", "regular-fit"]),
  material: z.string().trim().max(120),
  color: z.string().trim().max(60),
  color_hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  commercial_status: z.enum(["preorder", "available", "sold_out", "coming_soon"]),
  publication_status: z.enum(["draft", "published", "archived"]),
  is_featured: z.boolean(),
  sizes: z.array(SizeSchema).max(6),
  unavailable_sizes: z.array(SizeSchema).max(6),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).refine((tags) => new Set(tags.map((tag) => tag.toLocaleLowerCase("es-CO"))).size === tags.length),
}).superRefine((product, context) => {
  if (product.compare_at_price_cop !== null && product.compare_at_price_cop <= product.price_cop) {
    context.addIssue({ code: "custom", message: "El precio anterior debe superar el precio actual.", path: ["compare_at_price_cop"] });
  }
  if (product.unavailable_sizes.some((size) => !product.sizes.includes(size))) {
    context.addIssue({ code: "custom", message: "Solo puedes marcar como agotadas las tallas seleccionadas.", path: ["unavailable_sizes"] });
  }
});

export type ProductFormState = {
  error?: string;
  success?: boolean;
  productId?: string;
  variantIds?: { client_key: string; id: string }[];
};

export async function saveProduct(_previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const rawId = String(formData.get("id") ?? "").trim();
  let variantsInput: unknown;
  try {
    variantsInput = JSON.parse(String(formData.get("variants_json") || "[]"));
  } catch {
    return { error: "No se pudo leer la información de colores. Vuelve a intentarlo." };
  }
  const variantsParsed = VariantsSchema.safeParse(variantsInput);
  if (!variantsParsed.success) return { error: "Revisa los nombres, códigos HEX y tallas de cada color." };
  const variants = variantsParsed.data;
  if (new Set(variants.map((variant) => variant.name.toLocaleLowerCase("es-CO"))).size !== variants.length) {
    return { error: "Cada variante debe tener un nombre de color diferente." };
  }
  const sizes = variants[0]?.sizes.map((item) => item.size) ?? [];
  const unavailableSizes = variants[0]?.sizes.filter((item) => !item.is_available).map((item) => item.size) ?? [];
  const tags = [...new Set(String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean))];
  const parsed = ProductSchema.safeParse({
    id: rawId || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    summary: formData.get("summary") ?? "",
    description: formData.get("description") ?? "",
    price_cop: formData.get("price_cop"),
    compare_at_price_cop: formData.get("compare_at_price_cop") ?? "",
    category: formData.get("category"),
    fit: formData.get("fit"),
    material: formData.get("material") ?? "",
    color: variants[0]?.name ?? "",
    color_hex: variants[0]?.color_hex ?? "",
    commercial_status: formData.get("commercial_status"),
    publication_status: formData.get("publication_status"),
    is_featured: formData.get("is_featured") === "on",
    sizes,
    unavailable_sizes: unavailableSizes,
    tags,
  });
  if (!parsed.success) return { error: "Revisa los campos: precio, precio anterior, slug, etiquetas y tallas." };

  const { sizes: selectedSizes, unavailable_sizes: unavailableSizesList, id, ...fields } = parsed.data;
  const supabase = await createClient();

  let previousSlug: string | null = null;
  if (id) {
    const { data: existing, error: existingError } = await supabase.from("products").select("slug").eq("id", id).maybeSingle();
    if (existingError || !existing) return { error: "No se encontró el producto que intentas editar." };
    previousSlug = existing.slug;
  }
  const { error: variantsSchemaError } = await supabase.from("product_variants").select("id").limit(0);
  if (variantsSchemaError) return { error: "La base de datos aún no tiene habilitado el sistema de variantes. Aplica la migración antes de guardar el producto." };

  if (fields.publication_status === "published") {
    if (!id) return { error: "Guarda el producto como borrador, carga al menos una fotografía y luego publícalo." };
    const [{ count: generalCount, error: generalError }, { data: currentVariants, error: variantsError }] = await Promise.all([
      supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", id),
      supabase.from("product_variants").select("id, product_variant_images(id)").eq("product_id", id),
    ]);
    if (generalError || variantsError) return { error: "No se pudo verificar las galerías. Intenta de nuevo." };
    const variantCount = currentVariants?.reduce((total, variant) => total + (variant.product_variant_images?.length ?? 0), 0) ?? 0;
    if (!(generalCount || variantCount)) return { error: "Carga al menos una fotografía general o de una variante antes de publicar." };
  }

  const productResult = id
    ? await supabase.from("products").update({ ...fields, color_hex: fields.color_hex || null }).eq("id", id).select("id").single()
    : await supabase.from("products").insert({ ...fields, color_hex: fields.color_hex || null }).select("id").single();

  if (productResult.error) return { error: productResult.error.code === "23505" ? "Ese slug ya está en uso." : "No se pudo guardar el producto. Verifica los datos e inténtalo de nuevo." };
  const productId = productResult.data.id;

  const { data: currentVariants, error: currentVariantsError } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  if (currentVariantsError) return { error: "El producto se guardó, pero no fue posible cargar sus variantes. Verifica que la migración esté aplicada." };
  const submittedIds = new Set(variants.flatMap((variant) => variant.id ? [variant.id] : []));
  if ([...submittedIds].some((variantId) => !currentVariants?.some((current) => current.id === variantId))) {
    return { error: "Una variante ya no pertenece a este producto. Recarga la página antes de guardar." };
  }
  const removedVariantIds = (currentVariants ?? []).map((variant) => variant.id).filter((variantId) => !submittedIds.has(variantId));
  if (removedVariantIds.length) {
    const { data: removedImages } = await supabase.from("product_variant_images").select("storage_path").in("variant_id", removedVariantIds);
    const { error: deleteVariantsError } = await supabase.from("product_variants").delete().in("id", removedVariantIds).eq("product_id", productId);
    if (deleteVariantsError) return { error: "El producto se guardó, pero no fue posible eliminar los colores retirados." };
    if (removedImages?.length) await supabase.storage.from("be-different-products").remove(removedImages.map((image) => image.storage_path));
  }

  const savedVariantIds: { client_key: string; id: string }[] = [];
  for (const [sort_order, variant] of variants.entries()) {
    let variantId = variant.id;
    if (variantId) {
      const { data, error } = await supabase.from("product_variants")
        .update({ name: variant.name, color_hex: variant.color_hex, sort_order })
        .eq("id", variantId).eq("product_id", productId).select("id").maybeSingle();
      if (error || !data) return { error: "El producto se guardó, pero no fue posible actualizar un color." };
      variantId = data.id;
    } else {
      const { data, error } = await supabase.from("product_variants")
        .insert({ product_id: productId, name: variant.name, color_hex: variant.color_hex, sort_order })
        .select("id").single();
      if (error || !data) return { error: "El producto se guardó, pero no fue posible agregar un color." };
      variantId = data.id;
    }
    savedVariantIds.push({ client_key: variant.client_key, id: variantId });
    const { error: clearSizesError } = await supabase.from("product_variant_sizes").delete().eq("variant_id", variantId);
    if (clearSizesError) return { error: "El producto se guardó, pero no fue posible actualizar las tallas de un color." };
    if (variant.sizes.length) {
      const { error } = await supabase.from("product_variant_sizes").insert(variant.sizes.map((item, order) => ({
        variant_id: variantId!, size: item.size, is_available: item.is_available, sort_order: order,
      })));
      if (error) return { error: "El producto se guardó, pero no fue posible guardar las tallas de un color." };
    }
  }

  const { data: currentSizes, error: currentSizesError } = await supabase.from("product_sizes").select("id,size").eq("product_id", productId);
  if (currentSizesError) return { error: "El producto se guardó, pero no fue posible actualizar las tallas antiguas." };
  if (selectedSizes.length) {
    const unavailableSizeSet = new Set(unavailableSizesList);
    const { error: sizesError } = await supabase.from("product_sizes").upsert(
      selectedSizes.map((size, sort_order) => ({ product_id: productId, size, sort_order, is_available: !unavailableSizeSet.has(size) })),
      { onConflict: "product_id,size" },
    );
    if (sizesError) return { error: "El producto se guardó, pero no fue posible actualizar las tallas antiguas." };
  }
  const removedSizeIds = (currentSizes ?? []).filter((item) => !selectedSizes.includes(item.size as typeof selectedSizes[number])).map((item) => item.id);
  if (removedSizeIds.length) {
    const { error } = await supabase.from("product_sizes").delete().in("id", removedSizeIds).eq("product_id", productId);
    if (error) return { error: "El producto se guardó, pero no fue posible retirar algunas tallas antiguas." };
  }

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath(`/producto/${fields.slug}`);
  if (previousSlug && previousSlug !== fields.slug) revalidatePath(`/producto/${previousSlug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  return { success: true, productId, variantIds: savedVariantIds };
}

export type ArchiveState = { error?: string; success?: boolean };

export async function archiveProduct(_previous: ArchiveState, formData: FormData): Promise<ArchiveState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Identificador de producto inválido." };
  const supabase = await createClient();
  const { data: product, error: lookupError } = await supabase.from("products").select("slug").eq("id", id.data).maybeSingle();
  if (lookupError || !product) return { error: "No se encontró el producto para archivar." };
  const { error } = await supabase.from("products").update({ publication_status: "archived" }).eq("id", id.data);
  if (error) return { error: "No se pudo archivar el producto. Intenta de nuevo." };
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin/productos");
  revalidatePath(`/producto/${product.slug}`);
  return { success: true };
}
