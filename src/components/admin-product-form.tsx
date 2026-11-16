"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import type { Product } from "@/lib/data/products";
import type { ProductVariant } from "@/lib/data/product-utils";
import { AdminImageGalleryField } from "@/components/admin-image-gallery-field";

const initialState: ProductFormState = {};
const allSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;
type Size = typeof allSizes[number];
type EditableVariant = {
  client_key: string;
  id?: string;
  name: string;
  color_hex: string;
  sizes: { size: Size; is_available: boolean }[];
  images: ProductVariant["product_variant_images"];
};

function initialVariants(product?: Product): EditableVariant[] {
  if (product?.product_variants.length) {
    return product.product_variants.map((variant) => ({
      client_key: variant.id,
      id: variant.id,
      name: variant.name,
      color_hex: variant.color_hex,
      sizes: variant.product_variant_sizes.map((item) => ({ size: item.size as Size, is_available: item.is_available })),
      images: variant.product_variant_images,
    }));
  }
  if (product && (product.color || product.product_sizes.length)) {
    return [{
      client_key: "legacy-color",
      name: product.color || "Color original",
      color_hex: product.color_hex || "#111111",
      sizes: product.product_sizes.map((item) => ({ size: item.size as Size, is_available: item.is_available })),
      images: [],
    }];
  }
  return [];
}

export function AdminProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProduct, initialState);
  const [variants, setVariants] = useState(() => initialVariants(product));
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(product?.slug));
  const productId = product?.id ?? state.productId;
  const activeVariants = variants.map((variant) => ({
    ...variant,
    id: variant.id ?? state.variantIds?.find((saved) => saved.client_key === variant.client_key)?.id,
  }));

  function updateVariant(index: number, update: (variant: EditableVariant) => EditableVariant) {
    setVariants((current) => current.map((variant, variantIndex) => variantIndex === index ? update(variant) : variant));
  }

  function toggleSize(index: number, size: Size, checked: boolean) {
    updateVariant(index, (variant) => ({
      ...variant,
      sizes: checked
        ? [...variant.sizes.filter((item) => item.size !== size), { size, is_available: true }]
        : variant.sizes.filter((item) => item.size !== size),
    }));
  }

  function confirmPublication(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const isPublishing = formData.get("publication_status") === "published" && product?.publication_status !== "published";
    if (isPublishing && !window.confirm("¿Publicar esta pieza? Será visible en el catálogo público.")) event.preventDefault();
  }

  return <form action={action} className="product-admin-form" onSubmit={confirmPublication}>
    {productId && <input name="id" type="hidden" value={productId} />}
    <input name="variants_json" type="hidden" value={JSON.stringify(activeVariants.map(({ client_key, id, name, color_hex, sizes }) => ({ client_key, id, name, color_hex, sizes })))} />
    <div className="form-section-title"><span>01</span><h2>Información esencial</h2></div>
    <div className="form-fields two-col">
      <label>Nombre<input defaultValue={product?.name} maxLength={120} name="name" onChange={(event) => {
        if (!slugManuallyEdited) setSlug(event.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
      }} required /></label>
      <label>Slug<input autoComplete="off" name="slug" onChange={(event) => { setSlug(event.target.value); setSlugManuallyEdited(true); }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required spellCheck={false} value={slug} /></label>
      <label>Precio de lanzamiento (COP)<input defaultValue={product?.price_cop} min="0" name="price_cop" required step="1" type="number" /></label>
      <label>Precio oficial / anterior<input defaultValue={product?.compare_at_price_cop ?? ""} min="0" name="compare_at_price_cop" step="1" type="number" /></label>
      <label>Material<input defaultValue={product?.material} name="material" placeholder="Ej. 100% algodón" /></label>
      <label>Tipo de corte<select defaultValue={product?.fit ?? "oversized"} name="fit"><option value="oversized">Oversized</option><option value="regular-fit">Regular fit</option></select></label>
      <label>Categoría<select defaultValue={product?.category ?? "oversized"} name="category"><option value="oversized">Oversized</option><option value="regular-fit">Regular fit</option></select></label>
    </div>
    <label className="field-full">Resumen<input autoComplete="off" defaultValue={product?.summary} maxLength={240} name="summary" /></label>
    <label className="field-full">Descripción general<textarea autoComplete="off" defaultValue={product?.description} maxLength={10000} name="description" rows={5} /></label>
    <label className="field-full">Etiquetas<input autoComplete="off" defaultValue={product?.tags.join(", ")} maxLength={200} name="tags" placeholder="Ej. Essentials, Oversized…" /></label>

    <div className="form-section-title"><span>02</span><h2>Fotografías del producto</h2></div>
    <AdminImageGalleryField
      initialImages={product?.product_images}
      productId={productId}
      productName={product?.name ?? "Nuevo producto"}
      title="Fotografías del producto"
    />

    <div className="form-section-title"><span>03</span><h2>Colores y tallas</h2></div>
    <p className="variant-help">Cada color conserva sus propias fotografías y disponibilidad por talla.</p>
    <div className="variant-list">
      {activeVariants.map((variant, index) => <fieldset className="variant-editor" key={variant.client_key}>
        <div className="variant-editor-heading"><span>VARIANTE / {String(index + 1).padStart(2, "0")}</span>
          {variants.length > 1 && <button aria-label={`Eliminar variante ${variant.name || index + 1}`} className="variant-remove" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 aria-hidden="true" size={15} /> Eliminar color</button>}
        </div>
        <div className="variant-fields">
          <label>Nombre del color<input maxLength={60} onChange={(event) => updateVariant(index, (current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Beige" required value={variant.name} /></label>
          <label>Código HEX<input maxLength={7} onChange={(event) => updateVariant(index, (current) => ({ ...current, color_hex: event.target.value }))} pattern="#[0-9a-fA-F]{6}" placeholder="#D6B69A" required value={variant.color_hex} /></label>
          <label className="variant-color-picker">Selector visual<input aria-label={`Selector visual para ${variant.name || `color ${index + 1}`}`} onChange={(event) => updateVariant(index, (current) => ({ ...current, color_hex: event.target.value.toUpperCase() }))} type="color" value={/^#[0-9a-fA-F]{6}$/.test(variant.color_hex) ? variant.color_hex : "#111111"} /></label>
        </div>
        <fieldset className="variant-sizes"><legend>Tallas para {variant.name || "este color"} · activa las tallas y marca las agotadas</legend>
          {allSizes.map((size) => {
            const item = variant.sizes.find((entry) => entry.size === size);
            return <div className="size-option" key={size}>
              <label><input checked={Boolean(item)} onChange={(event) => toggleSize(index, size, event.target.checked)} type="checkbox" />{size}</label>
              <label className="size-unavailable"><input checked={Boolean(item && !item.is_available)} disabled={!item} onChange={(event) => updateVariant(index, (current) => ({ ...current, sizes: current.sizes.map((entry) => entry.size === size ? { ...entry, is_available: !event.target.checked } : entry) }))} type="checkbox" />Agotada</label>
            </div>;
          })}
        </fieldset>
        <AdminImageGalleryField
          initialImages={variant.images}
          productId={productId}
          productName={`${product?.name ?? "Nuevo producto"} · ${variant.name || "variante"}`}
          requiresVariant
          title={`Fotografías de ${variant.name || `color ${index + 1}`}`}
          variantId={variant.id}
        />
      </fieldset>)}
    </div>
    <button className="button button-outline variant-add" onClick={() => setVariants((current) => [...current, { client_key: crypto.randomUUID(), name: "", color_hex: "#111111", sizes: [], images: [] }])} type="button"><Plus aria-hidden="true" size={16} /> Agregar color</button>
    <div className="form-section-title"><span>04</span><h2>Publicación</h2></div>
    <div className="form-fields two-col">
      <label>Estado comercial<select defaultValue={product?.commercial_status ?? "preorder"} name="commercial_status"><option value="preorder">Preventa</option><option value="available">Disponible</option><option value="sold_out">Agotado</option><option value="coming_soon">Próximamente</option></select></label>
      <label>Visibilidad<select defaultValue={product?.publication_status ?? "draft"} name="publication_status"><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
    </div>
    <label className="featured-check"><input defaultChecked={product?.is_featured} name="is_featured" type="checkbox" /> Destacar en la página principal</label>
    {state.error && <p aria-live="assertive" className="form-error" role="alert">{state.error}</p>}
    {state.success && <p aria-live="polite" className="form-success">Producto guardado. Las fotos seleccionadas se están asociando a sus galerías en Supabase Storage.</p>}
    {state.productId && <Link className="text-link saved-product-link" href={`/admin/productos/${state.productId}/editar?${product ? "saved=1" : "created=1"}`}>Continuar en la edición completa del producto ↗</Link>}
    <button className="button button-dark" disabled={pending} type="submit">{pending ? "Guardando…" : productId ? "Guardar cambios" : "Guardar producto"}</button>
  </form>;
}
