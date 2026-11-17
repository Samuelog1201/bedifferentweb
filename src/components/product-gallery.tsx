"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ArrowLeft, ArrowRight, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/data/product-utils";
import { useProductVariant } from "@/components/product-variant-context";

export function ProductGallery({ name, images }: { name: string; images: ProductImage[] }) {
  const { selectedVariant } = useProductVariant();
  const variantImages = selectedVariant?.product_variant_images ?? [];
  const displayedImages = variantImages.length ? variantImages : images;
  const ordered = [...displayedImages].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const [activeSelection, setActiveSelection] = useState<{ variantId: string | null; index: number }>({ variantId: null, index: 0 });
  const activeIndex = activeSelection.variantId === selectedVariant?.id ? activeSelection.index : 0;
  const active = ordered[activeIndex];
  const src = active?.signed_url ?? null;
  const [lightboxSelection, setLightboxSelection] = useState<{ variantId: string | null; index: number } | null>(null);
  const lightboxIndex = lightboxSelection?.variantId === (selectedVariant?.id ?? null) ? lightboxSelection.index : 0;
  const lightboxImage = ordered[lightboxIndex];
  const touchStartX = useRef<number | null>(null);
  const lightboxOpen = Boolean(lightboxSelection && lightboxSelection.variantId === (selectedVariant?.id ?? null) && lightboxImage?.signed_url);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxSelection(null);
      if (event.key === "ArrowRight") setLightboxSelection((current) => current ? { ...current, index: (current.index + 1) % ordered.length } : current);
      if (event.key === "ArrowLeft") setLightboxSelection((current) => current ? { ...current, index: (current.index - 1 + ordered.length) % ordered.length } : current);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, ordered.length]);

  function showImage(index: number) {
    setActiveSelection({ variantId: selectedVariant?.id ?? null, index });
  }

  function showLightboxImage(index: number) {
    setLightboxSelection({ variantId: selectedVariant?.id ?? null, index });
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined || ordered.length < 2) return;
    const distance = end - start;
    if (Math.abs(distance) < 45) return;
    showLightboxImage((lightboxIndex + (distance < 0 ? 1 : -1) + ordered.length) % ordered.length);
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        {src ? <button
          aria-label={`Ampliar fotografía ${activeIndex + 1} de ${name}`}
          className="gallery-main-trigger"
          onClick={() => showLightboxImage(activeIndex)}
          type="button"
        >
          <Image alt={active?.alt_text || name} className="gallery-image" height={1500} preload quality={95} sizes="(max-width: 850px) 100vw, 58vw" src={src} width={1200} />
          <span className="gallery-zoom-hint"><ZoomIn aria-hidden="true" size={14} /> AMPLIAR</span>
        </button> : (
          <div className="gallery-placeholder"><span>BE DIFFERENT / STUDIO</span><p>IMAGEN<br />NO DISPONIBLE</p><small>FOTOGRAFÍA NO DISPONIBLE</small></div>
        )}
      </div>
      {ordered.length > 1 && <div aria-label="Galería del producto" className="gallery-thumbnails">
        {ordered.map((image, index) => {
          const thumb = image.signed_url;
          return <button aria-label={`Ver imagen ${index + 1} de ${name}`} aria-pressed={activeIndex === index} className="gallery-thumbnail" key={image.id} onClick={() => showImage(index)} type="button">
            {thumb && <Image alt="" height={100} quality={75} sizes="72px" src={thumb} width={100} />}
          </button>;
        })}
      </div>}
      {lightboxOpen && lightboxImage?.signed_url && <div
        aria-label={`Fotografías de ${name}`}
        aria-modal="true"
        className="product-lightbox"
        onClick={(event) => { if (event.target === event.currentTarget) setLightboxSelection(null); }}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        role="dialog"
      >
        <button aria-label="Cerrar fotografía ampliada" autoFocus className="lightbox-close" onClick={() => setLightboxSelection(null)} type="button"><X aria-hidden="true" size={22} /></button>
        <div className="lightbox-image-wrap">
          <Image
            alt={lightboxImage.alt_text || name}
            className="lightbox-image"
            fill
            quality={100}
            sizes="100vw"
            src={lightboxImage.signed_url}
          />
        </div>
        {ordered.length > 1 && <>
          <button aria-label="Fotografía anterior" className="lightbox-nav lightbox-prev" onClick={() => showLightboxImage((lightboxIndex - 1 + ordered.length) % ordered.length)} type="button"><ArrowLeft aria-hidden="true" size={20} /></button>
          <button aria-label="Fotografía siguiente" className="lightbox-nav lightbox-next" onClick={() => showLightboxImage((lightboxIndex + 1) % ordered.length)} type="button"><ArrowRight aria-hidden="true" size={20} /></button>
        </>}
        <p aria-live="polite" className="lightbox-caption">{name}<span>{String(lightboxIndex + 1).padStart(2, "0")} / {String(ordered.length).padStart(2, "0")}</span></p>
      </div>}
    </div>
  );
}
