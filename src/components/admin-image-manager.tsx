"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProductImage } from "@/lib/data/product-utils";
import type { Tables } from "@/lib/supabase/database.types";

type ProductImageRow = Tables<"product_images"> | Tables<"product_variant_images">;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 8 * 1024 * 1024;
const maxImages = 12;

export async function optimizeImage(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error("image-too-large");
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas-unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
    if (!blob || blob.type !== "image/webp") throw new Error("image-encoding-failed");
    const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 100) || "bedifferent-image";
    return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

export function AdminImageManager({
  productId,
  productName,
  initialImages,
  variantId,
  initialFiles = [],
  initialPrimaryIndex = -1,
  galleryTitle,
}: {
  productId: string;
  productName: string;
  initialImages: ProductImageRow[];
  variantId?: string;
  initialFiles?: File[];
  initialPrimaryIndex?: number;
  galleryTitle?: string;
}) {
  const [images, setImages] = useState<ProductImage[]>(() => initialImages
    .map((image) => ({ ...image, signed_url: null }) as ProductImage)
    .sort((a, b) => a.sort_order - b.sort_order));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pendingUploadStarted = useRef(false);
  const imagePathsKey = JSON.stringify(images.map((image) => image.storage_path));

  useEffect(() => {
    let cancelled = false;
    async function loadSignedUrls() {
      const paths = JSON.parse(imagePathsKey) as string[];
      if (paths.length === 0) return;
      const supabase = createClient();
      const { data } = await supabase.storage.from("be-different-products").createSignedUrls(
        paths,
        60 * 60,
      );
      if (!cancelled && data) {
        const signedUrls = new Map(paths.map((path, index) => [path, data[index]?.signedUrl ?? null]));
        setImages((current) => current.map((image) => ({ ...image, signed_url: signedUrls.get(image.storage_path) ?? null })));
      }
    }
    void loadSignedUrls();
    return () => { cancelled = true; };
  }, [imagePathsKey]);

  const uploadFileList = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const invalid = files.find((file) => !acceptedTypes.has(file.type) || file.size > maxBytes);
    if (invalid) {
      setMessage("Usa JPG, PNG o WebP de máximo 8 MB por imagen.");
      return;
    }
    if (images.length + files.length > maxImages) {
      setMessage(`Cada producto admite máximo ${maxImages} fotografías.`);
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const uploaded: ProductImage[] = [];
    try {
      for (const sourceFile of files) {
        const file = await optimizeImage(sourceFile);
        if (file.size > maxBytes) throw new Error("optimized-image-too-large");
        const path = `${productId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("be-different-products").upload(path, file, { contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;

        const imageFields = {
          storage_path: path,
          alt_text: `${productName} · imagen ${images.length + uploaded.length + 1}`.slice(0, 120),
          sort_order: images.length + uploaded.length,
          is_primary: images.length + uploaded.length === 0,
        };
        const { data, error } = variantId
          ? await supabase.from("product_variant_images").insert({ ...imageFields, variant_id: variantId }).select("*").single()
          : await supabase.from("product_images").insert({ ...imageFields, product_id: productId }).select("*").single();
        if (error) {
          await supabase.storage.from("be-different-products").remove([path]);
          throw error;
        }
        uploaded.push({ ...data, signed_url: null } as unknown as ProductImage);
        const { data: signed } = await supabase.storage.from("be-different-products").createSignedUrl(path, 60 * 60);
        if (signed?.signedUrl) uploaded[uploaded.length - 1] = { ...uploaded[uploaded.length - 1], signed_url: signed.signedUrl };
      }
      if (uploaded.length && initialPrimaryIndex >= 0 && initialPrimaryIndex < uploaded.length) {
        const selected = uploaded[initialPrimaryIndex];
        const clearResult = variantId
          ? await supabase.from("product_variant_images").update({ is_primary: false }).eq("variant_id", variantId)
          : await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
        const primaryResult = variantId
          ? await supabase.from("product_variant_images").update({ is_primary: true }).eq("id", selected.id).eq("variant_id", variantId)
          : await supabase.from("product_images").update({ is_primary: true }).eq("id", selected.id).eq("product_id", productId);
        if (clearResult.error || primaryResult.error) throw new Error("primary-image-save-failed");
        uploaded[initialPrimaryIndex] = { ...selected, is_primary: true };
      }
      setMessage(`${uploaded.length} ${uploaded.length === 1 ? "imagen cargada" : "imágenes cargadas"}.`);
    } catch {
      setMessage(uploaded.length
        ? `Carga parcial: ${uploaded.length} ${uploaded.length === 1 ? "imagen quedó cargada" : "imágenes quedaron cargadas"}; el resto no se completó.`
        : "No se completó la carga. Usa JPG, PNG o WebP válidos de máximo 8 MB y vuelve a intentarlo.");
    } finally {
      if (uploaded.length) setImages((current) => [...current, ...uploaded]);
      setBusy(false);
    }
  }, [images, initialPrimaryIndex, productId, productName, variantId]);

  useEffect(() => {
    if (!initialFiles.length || pendingUploadStarted.current) return;
    pendingUploadStarted.current = true;
    queueMicrotask(() => { void uploadFileList(initialFiles); });
  }, [initialFiles, uploadFileList]);

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await uploadFileList(files);
  }

  async function setPrimary(imageId: string) {
    const previousPrimary = images.find((image) => image.is_primary);
    if (previousPrimary?.id === imageId) return;
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    try {
      if (previousPrimary) {
        const { error: clearError } = variantId
          ? await supabase.from("product_variant_images").update({ is_primary: false }).eq("id", previousPrimary.id).eq("variant_id", variantId)
          : await supabase.from("product_images").update({ is_primary: false }).eq("id", previousPrimary.id).eq("product_id", productId);
        if (clearError) throw clearError;
      }
      const { error } = variantId
        ? await supabase.from("product_variant_images").update({ is_primary: true }).eq("id", imageId).eq("variant_id", variantId)
        : await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId).eq("product_id", productId);
      if (error) throw error;
      setImages((current) => current.map((image) => ({ ...image, is_primary: image.id === imageId })));
    } catch {
      let restoreFailed = false;
      if (previousPrimary) {
        try {
          const { error } = variantId
            ? await supabase.from("product_variant_images").update({ is_primary: true }).eq("id", previousPrimary.id).eq("variant_id", variantId)
            : await supabase.from("product_images").update({ is_primary: true }).eq("id", previousPrimary.id).eq("product_id", productId);
          restoreFailed = Boolean(error);
        } catch {
          restoreFailed = true;
        }
      }
      setMessage(restoreFailed
        ? "No se pudo cambiar la imagen principal ni restaurar la anterior. Revisa la galería."
        : "No se pudo cambiar la imagen principal.");
    } finally {
      setBusy(false);
    }
  }

  async function moveTo(imageId: string, target: number) {
    const index = images.findIndex((image) => image.id === imageId);
    if (index < 0 || target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy(true);
    const supabase = createClient();
    try {
      const results = await Promise.all(reordered.map((image, sort_order) => variantId
        ? supabase.from("product_variant_images").update({ sort_order }).eq("id", image.id).eq("variant_id", variantId)
        : supabase.from("product_images").update({ sort_order }).eq("id", image.id).eq("product_id", productId)));
      if (results.some((result) => result.error)) {
        setMessage("No se pudo guardar todo el nuevo orden. Recarga la galería antes de continuar.");
      } else {
        setImages(reordered.map((image, sort_order) => ({ ...image, sort_order })));
      }
    } catch {
      setMessage("No se pudo guardar todo el nuevo orden. Recarga la galería antes de continuar.");
    } finally {
      setBusy(false);
    }
  }

  async function move(imageId: string, direction: -1 | 1) {
    const index = images.findIndex((image) => image.id === imageId);
    await moveTo(imageId, index + direction);
  }

  async function removeImage(image: ProductImage) {
    if (!window.confirm("¿Eliminar esta imagen de la publicación?")) return;
    setBusy(true);
    const supabase = createClient();
    try {
      const { error } = variantId
        ? await supabase.from("product_variant_images").delete().eq("id", image.id).eq("variant_id", variantId)
        : await supabase.from("product_images").delete().eq("id", image.id).eq("product_id", productId);
      if (error) {
        setMessage("No se pudo eliminar la imagen.");
        return;
      }

      let storageCleanupFailed = false;
      try {
        const { error: storageError } = await supabase.storage.from("be-different-products").remove([image.storage_path]);
        storageCleanupFailed = Boolean(storageError);
      } catch {
        storageCleanupFailed = true;
      }
      const remaining = images.filter((item) => item.id !== image.id).map((item, sort_order) => ({ ...item, sort_order }));
      const issues: string[] = [];
      let promotedPrimaryId: string | null = null;
      setImages(remaining);

      if (image.is_primary && remaining[0]) {
        const { error: primaryError } = variantId
          ? await supabase.from("product_variant_images").update({ is_primary: true }).eq("id", remaining[0].id).eq("variant_id", variantId)
          : await supabase.from("product_images").update({ is_primary: true }).eq("id", remaining[0].id).eq("product_id", productId);
        if (primaryError) issues.push("No se pudo asignar una imagen principal nueva.");
        else promotedPrimaryId = remaining[0].id;
      }

      const updatedImages = remaining.map((item) => ({ ...item, is_primary: item.id === promotedPrimaryId || item.is_primary, sort_order: item.sort_order }));
      setImages(updatedImages);
      const orderResults = await Promise.all(updatedImages.map((item) => variantId
        ? supabase.from("product_variant_images").update({ sort_order: item.sort_order }).eq("id", item.id).eq("variant_id", variantId)
        : supabase.from("product_images").update({ sort_order: item.sort_order }).eq("id", item.id).eq("product_id", productId)));
      if (orderResults.some((result) => result.error)) issues.push("No se pudo guardar todo el nuevo orden.");
      if (storageCleanupFailed) issues.push("El archivo privado no pudo eliminarse y requiere limpieza.");

      setMessage(issues.length ? `Imagen retirada. ${issues.join(" ")}` : "Imagen eliminada.");
    } catch {
      setMessage("La imagen pudo retirarse parcialmente. Recarga la galería para confirmar el estado.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAltText(image: ProductImage, altText: string) {
    const value = altText.trim().slice(0, 120);
    if (value === image.alt_text) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = variantId
        ? await supabase.from("product_variant_images").update({ alt_text: value }).eq("id", image.id).eq("variant_id", variantId)
        : await supabase.from("product_images").update({ alt_text: value }).eq("id", image.id).eq("product_id", productId);
      if (error) setMessage("No se pudo guardar el texto alternativo.");
      else setImages((current) => current.map((item) => item.id === image.id ? { ...item, alt_text: value } : item));
    } catch {
      setMessage("No se pudo guardar el texto alternativo.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="image-manager">
    <div className="form-section-title"><span>{variantId ? "COLOR" : "02"}</span><h2>{galleryTitle ?? (variantId ? `Fotografías de ${productName.split(" · ").at(-1)}` : "Fotografías del producto")}</h2></div>
    <label className="image-upload"><ImagePlus aria-hidden="true" size={19} /><span>{busy ? "SUBIENDO IMÁGENES…" : "+ SUBIR IMÁGENES"}<small>JPG, JPEG, PNG o WebP · máx. 8 MB · hasta {maxImages} por galería. Arrastra las tarjetas para ordenar.</small></span><input accept="image/jpeg,image/png,image/webp" disabled={busy || images.length >= maxImages} multiple onChange={uploadFiles} type="file" /></label>
    {message && <p aria-live="polite" className="form-feedback">{message}</p>}
    {initialFiles.length > 0 && !busy && message.startsWith("No se completó la carga") && <button className="button button-outline retry-image-upload" onClick={() => { void uploadFileList(initialFiles); }} type="button">Reintentar fotos seleccionadas</button>}
    {images.length > 0 && <div className="admin-image-grid">{images.map((image, index) => {
      const src = image.signed_url;
      return <article className="admin-image-card" draggable={!busy} key={image.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData("text/plain");
        if (draggedId) void moveTo(draggedId, index);
      }} onDragStart={(event) => event.dataTransfer.setData("text/plain", image.id)}>
        <div className="admin-image-preview">{src && <Image alt={image.alt_text} height={600} sizes="(max-width: 600px) 40vw, 180px" src={src} width={480} />}{image.is_primary && <span className="primary-label"><Star aria-hidden="true" size={12} /> Principal</span>}</div>
        <label className="image-alt-label">Texto alternativo<input defaultValue={image.alt_text} disabled={busy} maxLength={120} onBlur={(event) => { void saveAltText(image, event.currentTarget.value); }} /></label>
        <div className="admin-image-actions">
          <button aria-label="Mover arriba" disabled={busy || index === 0} onClick={() => move(image.id, -1)} type="button"><ArrowUp aria-hidden="true" size={15} /></button>
          <button aria-label="Mover abajo" disabled={busy || index === images.length - 1} onClick={() => move(image.id, 1)} type="button"><ArrowDown aria-hidden="true" size={15} /></button>
          {!image.is_primary && <button aria-label="Marcar como principal" disabled={busy} onClick={() => setPrimary(image.id)} type="button"><Star aria-hidden="true" size={15} /></button>}
          <button aria-label="Eliminar imagen" className="delete-image" disabled={busy} onClick={() => removeImage(image)} type="button"><Trash2 aria-hidden="true" size={15} /></button>
        </div>
      </article>;
    })}</div>}
  </section>;
}
