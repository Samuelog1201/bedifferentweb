"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, Trash2, ArrowDown, ArrowUp } from "lucide-react";
import { AdminImageManager, optimizeImage } from "@/components/admin-image-manager";
import type { Tables } from "@/lib/supabase/database.types";

type PersistedImage = Tables<"product_images"> | Tables<"product_variant_images">;
type StagedImage = { id: string; file: File; preview: string };
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 8 * 1024 * 1024;
const maxImages = 12;

export function AdminImageGalleryField({
  productId,
  variantId,
  productName,
  title,
  initialImages = [],
  requiresVariant = false,
}: {
  productId?: string;
  variantId?: string;
  productName: string;
  title: string;
  initialImages?: PersistedImage[];
  requiresVariant?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useRef(new Set<string>());
  const [staged, setStaged] = useState<StagedImage[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  async function selectFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (files.some((file) => !acceptedTypes.has(file.type) || file.size > maxBytes)) {
      setError("Selecciona imágenes JPG, JPEG, PNG o WebP de máximo 8 MB cada una.");
      return;
    }
    if (initialImages.length + staged.length + files.length > maxImages) {
      setError(`Esta galería admite hasta ${maxImages} fotografías.`);
      return;
    }
    setBusy(true);
    setError("");
    const prepared: StagedImage[] = [];
    try {
      for (const file of files) {
        const optimized = await optimizeImage(file);
        if (optimized.size > maxBytes) throw new Error("image-too-large");
        const preview = URL.createObjectURL(optimized);
        previewUrls.current.add(preview);
        prepared.push({ id: crypto.randomUUID(), file: optimized, preview });
      }
      setStaged((current) => [...current, ...prepared]);
      setPrimaryId((current) => current ?? prepared[0]?.id ?? null);
    } catch {
      preparedCleanup(prepared);
      setError("No se pudieron preparar las imágenes. Comprueba los archivos e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  function preparedCleanup(images: StagedImage[]) {
    images.forEach((image) => {
      URL.revokeObjectURL(image.preview);
      previewUrls.current.delete(image.preview);
    });
  }

  function removeStaged(id: string) {
    const removed = staged.find((image) => image.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.preview);
      previewUrls.current.delete(removed.preview);
    }
    const remaining = staged.filter((image) => image.id !== id);
    setStaged(remaining);
    if (primaryId === id) setPrimaryId(remaining[0]?.id ?? null);
  }

  function moveStaged(id: string, direction: -1 | 1) {
    const index = staged.findIndex((image) => image.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= staged.length) return;
    const ordered = [...staged];
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    setStaged(ordered);
  }

  if (productId && (!requiresVariant || variantId)) {
    return <div className="admin-gallery-field">
      <AdminImageManager
        galleryTitle={title}
        initialImages={initialImages}
        initialFiles={staged.map((image) => image.file)}
        initialPrimaryIndex={staged.findIndex((image) => image.id === primaryId)}
        productId={productId}
        productName={productName}
        variantId={variantId}
      />
      {staged.length > 0 && <p aria-live="polite" className="gallery-upload-handoff">El borrador quedó guardado y las fotos seleccionadas se enviaron a esta galería. Revisa el estado de carga arriba.</p>}
    </div>;
  }

  return <section className="staged-gallery" aria-label={title}>
    <div className="staged-gallery-heading"><h3>{title}</h3><span>{staged.length}/{maxImages}</span></div>
    <p>{requiresVariant ? "Selecciona las fotos ahora. Guarda el producto para crear el color y subirlas a su galería." : "Selecciona las fotos ahora. Al guardar el producto como borrador, se subirán y quedarán asociadas a esta galería."}</p>
    <input
      accept="image/jpeg,image/png,image/webp"
      aria-label={`Seleccionar imágenes para ${title}`}
      className="visually-hidden-file-input"
      multiple
      onChange={selectFiles}
      ref={inputRef}
      type="file"
    />
    <button className="button button-outline staged-upload-button" disabled={busy || staged.length >= maxImages} onClick={() => inputRef.current?.click()} type="button">
      <ImagePlus aria-hidden="true" size={17} /> {busy ? "PREPARANDO IMÁGENES…" : "+ SUBIR IMÁGENES"}
    </button>
    {error && <p aria-live="assertive" className="form-error" role="alert">{error}</p>}
    {staged.length > 0 && <div className="admin-image-grid staged-image-grid">{staged.map((image, index) => <article className="admin-image-card staged-image-card" key={image.id}>
      <div className="admin-image-preview">
        <Image alt={`${productName} · imagen pendiente ${index + 1}`} fill src={image.preview} unoptimized />
        {primaryId === image.id && <span className="primary-label"><Star aria-hidden="true" size={12} /> Principal</span>}
      </div>
      <div className="admin-image-actions">
        <button aria-label={`Mover imagen ${index + 1} arriba`} disabled={index === 0 || busy} onClick={() => moveStaged(image.id, -1)} type="button"><ArrowUp aria-hidden="true" size={15} /></button>
        <button aria-label={`Mover imagen ${index + 1} abajo`} disabled={index === staged.length - 1 || busy} onClick={() => moveStaged(image.id, 1)} type="button"><ArrowDown aria-hidden="true" size={15} /></button>
        {primaryId !== image.id && <button aria-label={`Elegir imagen ${index + 1} como principal`} onClick={() => setPrimaryId(image.id)} type="button"><Star aria-hidden="true" size={15} /></button>}
        <button aria-label={`Eliminar imagen ${index + 1}`} className="delete-image" onClick={() => removeStaged(image.id)} type="button"><Trash2 aria-hidden="true" size={15} /></button>
      </div>
    </article>)}</div>}
  </section>;
}
