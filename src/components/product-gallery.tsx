"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/data/product-utils";

export function ProductGallery({ name, images }: { name: string; images: ProductImage[] }) {
  const ordered = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = ordered[activeIndex];
  const src = active?.signed_url ?? null;

  return (
    <div className="gallery">
      <div className="gallery-main">
        {src ? <Image alt={active?.alt_text || name} className="gallery-image" height={1500} priority sizes="(max-width: 850px) 100vw, 58vw" src={src} width={1200} /> : (
          <div className="gallery-placeholder"><span>BE DIFFERENT / STUDIO</span><p>IMAGEN<br />NO DISPONIBLE</p><small>FOTOGRAFÍA NO DISPONIBLE</small></div>
        )}
      </div>
      {ordered.length > 1 && <div aria-label="Galería del producto" className="gallery-thumbnails">
        {ordered.map((image, index) => {
          const thumb = image.signed_url;
          return <button aria-label={`Ver imagen ${index + 1} de ${name}`} aria-pressed={activeIndex === index} className="gallery-thumbnail" key={image.id} onClick={() => setActiveIndex(index)} type="button">
            {thumb && <Image alt="" height={100} sizes="100px" src={thumb} width={100} />}
          </button>;
        })}
      </div>}
    </div>
  );
}
