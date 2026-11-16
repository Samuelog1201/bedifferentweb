"use client";

import { useActionState, useState, type FormEvent } from "react";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import type { Product } from "@/lib/data/products";

const initialState: ProductFormState = {};
const allSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export function AdminProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProduct, initialState);
  const [selectedSizes, setSelectedSizes] = useState(() => product?.product_sizes.map((item) => item.size) ?? []);
  const [unavailableSizes, setUnavailableSizes] = useState(() => product?.product_sizes.filter((item) => !item.is_available).map((item) => item.size) ?? []);

  function toggleSize(size: typeof allSizes[number], checked: boolean) {
    setSelectedSizes((current) => checked ? [...current, size] : current.filter((item) => item !== size));
    if (!checked) setUnavailableSizes((current) => current.filter((item) => item !== size));
  }

  function confirmPublication(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const isPublishing = formData.get("publication_status") === "published" && product?.publication_status !== "published";
    if (isPublishing && !window.confirm("¿Publicar esta pieza? Será visible en el catálogo público.")) event.preventDefault();
  }

  return <form action={action} className="product-admin-form" onSubmit={confirmPublication}>
    {product && <input name="id" type="hidden" value={product.id} />}
    <div className="form-section-title"><span>01</span><h2>Información esencial</h2></div>
    <div className="form-fields two-col">
      <label>Nombre<input defaultValue={product?.name} maxLength={120} name="name" required /></label>
      <label>Slug<input autoComplete="off" defaultValue={product?.slug} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required spellCheck={false} /></label>
      <label>Precio COP<input defaultValue={product?.price_cop} min="0" name="price_cop" required step="1" type="number" /></label>
      <label>Precio anterior opcional<input defaultValue={product?.compare_at_price_cop ?? ""} min="0" name="compare_at_price_cop" step="1" type="number" /></label>
      <label>Material<input defaultValue={product?.material} name="material" placeholder="Ej. 100% algodón" /></label>
      <label>Color<input defaultValue={product?.color} name="color" /></label>
      <label>Código de color<input defaultValue={product?.color_hex ?? ""} name="color_hex" placeholder="#0A0A0A" /></label>
      <label>Tipo de corte<select defaultValue={product?.fit ?? "oversized"} name="fit"><option value="oversized">Oversized</option><option value="regular-fit">Regular fit</option></select></label>
      <label>Categoría<select defaultValue={product?.category ?? "oversized"} name="category"><option value="oversized">Oversized</option><option value="regular-fit">Regular fit</option></select></label>
    </div>
    <label className="field-full">Resumen<input autoComplete="off" defaultValue={product?.summary} maxLength={240} name="summary" /></label>
    <label className="field-full">Descripción<textarea autoComplete="off" defaultValue={product?.description} maxLength={10000} name="description" rows={5} /></label>
    <label className="field-full">Etiquetas<input autoComplete="off" defaultValue={product?.tags.join(", ")} maxLength={200} name="tags" placeholder="Ej. Essentials, Oversized…" /></label>
    <div className="form-section-title"><span>02</span><h2>Tallas y disponibilidad</h2></div>
    <fieldset className="size-checkboxes"><legend>Selecciona las tallas y marca las que están agotadas</legend>
      {allSizes.map((size) => {
        const selected = selectedSizes.includes(size);
        return <div className="size-option" key={size}>
          <label><input checked={selected} name="sizes" onChange={(event) => toggleSize(size, event.target.checked)} type="checkbox" value={size} />{size}</label>
          <label className="size-unavailable"><input checked={unavailableSizes.includes(size)} disabled={!selected} name="unavailable_sizes" onChange={(event) => setUnavailableSizes((current) => event.target.checked ? [...current, size] : current.filter((item) => item !== size))} type="checkbox" value={size} />Agotada</label>
        </div>;
      })}
    </fieldset>
    <div className="form-section-title"><span>03</span><h2>Publicación</h2></div>
    <div className="form-fields two-col">
      <label>Estado comercial<select defaultValue={product?.commercial_status ?? "preorder"} name="commercial_status"><option value="preorder">Preventa</option><option value="available">Disponible</option><option value="sold_out">Agotado</option><option value="coming_soon">Próximamente</option></select></label>
      <label>Visibilidad<select defaultValue={product?.publication_status ?? "draft"} name="publication_status"><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
    </div>
    <label className="featured-check"><input defaultChecked={product?.is_featured} name="is_featured" type="checkbox" /> Destacar en la página principal</label>
    {state.error && <p aria-live="assertive" className="form-error" role="alert">{state.error}</p>}
    {state.success && <p aria-live="polite" className="form-success">Cambios guardados.</p>}
    <button className="button button-dark" disabled={pending} type="submit">{pending ? "Guardando…" : product ? "Guardar cambios" : "Guardar producto"}</button>
  </form>;
}
