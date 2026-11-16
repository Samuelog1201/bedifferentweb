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
  sizes: z.array(z.enum(["XS", "S", "M", "L", "XL", "XXL"])).max(6),
  unavailable_sizes: z.array(z.enum(["XS", "S", "M", "L", "XL", "XXL"])).max(6),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).refine((tags) => new Set(tags.map((tag) => tag.toLocaleLowerCase("es-CO"))).size === tags.length),
}).superRefine((product, context) => {
  if (product.compare_at_price_cop !== null && product.compare_at_price_cop <= product.price_cop) {
    context.addIssue({ code: "custom", message: "El precio anterior debe superar el precio actual.", path: ["compare_at_price_cop"] });
  }
  if (product.unavailable_sizes.some((size) => !product.sizes.includes(size))) {
    context.addIssue({ code: "custom", message: "Solo puedes marcar como agotadas las tallas seleccionadas.", path: ["unavailable_sizes"] });
  }
});

export type ProductFormState = { error?: string; success?: boolean };

export async function saveProduct(_previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const rawId = String(formData.get("id") ?? "").trim();
  const sizes = [...new Set(formData.getAll("sizes").map(String))];
  const unavailableSizes = [...new Set(formData.getAll("unavailable_sizes").map(String))];
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
    color: formData.get("color") ?? "",
    color_hex: formData.get("color_hex") ?? "",
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

  if (fields.publication_status === "published") {
    if (!id) return { error: "Guarda el producto como borrador, carga al menos una fotografía y luego publícalo." };
    const { count, error: imageCountError } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", id);
    if (imageCountError) return { error: "No se pudo verificar la galería. Intenta de nuevo." };
    if (!count) return { error: "Carga al menos una fotografía antes de publicar el producto." };
  }

  const productResult = id
    ? await supabase.from("products").update({ ...fields, color_hex: fields.color_hex || null }).eq("id", id).select("id").single()
    : await supabase.from("products").insert({ ...fields, color_hex: fields.color_hex || null }).select("id").single();

  if (productResult.error) return { error: productResult.error.code === "23505" ? "Ese slug ya está en uso." : "No se pudo guardar el producto. Verifica los datos e inténtalo de nuevo." };
  const productId = productResult.data.id;

  const { data: currentSizes, error: currentSizesError } = await supabase.from("product_sizes").select("id,size").eq("product_id", productId);
  if (currentSizesError) return { error: "El producto se guardó, pero no fue posible actualizar las tallas." };

  if (selectedSizes.length) {
    const unavailableSizeSet = new Set(unavailableSizesList);
    const { error: sizesError } = await supabase.from("product_sizes").upsert(
      selectedSizes.map((size, sort_order) => ({ product_id: productId, size, sort_order, is_available: !unavailableSizeSet.has(size) })),
      { onConflict: "product_id,size" },
    );
    if (sizesError) return { error: "El producto se guardó, pero no fue posible actualizar las tallas." };
  }

  const removedSizeIds = (currentSizes ?? []).filter((item) => !selectedSizes.includes(item.size as typeof selectedSizes[number])).map((item) => item.id);
  if (removedSizeIds.length) {
    const { error: removeSizesError } = await supabase.from("product_sizes").delete().in("id", removedSizeIds).eq("product_id", productId);
    if (removeSizesError) return { error: "El producto se guardó, pero no fue posible retirar algunas tallas." };
  }

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath(`/producto/${fields.slug}`);
  if (previousSlug && previousSlug !== fields.slug) revalidatePath(`/producto/${previousSlug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  if (!id) redirect(`/admin/productos/${productId}/editar?created=1`);
  return { success: true };
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
