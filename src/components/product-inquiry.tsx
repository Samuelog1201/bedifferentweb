"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import type { Product } from "@/lib/data/products";
import { useProductVariant } from "@/components/product-variant-context";

export function ProductInquiry({ product, productUrl }: { product: Product; productUrl: string }) {
  const [sizeSelection, setSizeSelection] = useState<{ variantId: string | null; size: string }>({ variantId: null, size: "" });
  const { selectedVariant, setSelectedVariantId } = useProductVariant();
  const size = sizeSelection.variantId === (selectedVariant?.id ?? null) ? sizeSelection.size : "";
  const selectedColor = selectedVariant?.name ?? product.color;
  const message = `Hola, BeDifferent. Estoy interesado en ${product.name}${size ? `, talla ${size}` : ""}${selectedColor ? `, color ${selectedColor}` : ""}. Quisiera conocer más información sobre su ${product.commercial_status === "preorder" ? "preventa" : "disponibilidad"}.`;
  const whatsappUrl = `https://wa.me/573053744560?text=${encodeURIComponent(`${message} ${productUrl}`)}`;
  const sizes = selectedVariant
    ? [...selectedVariant.product_variant_sizes].sort((a, b) => a.sort_order - b.sort_order)
    : [...product.product_sizes].sort((a, b) => a.sort_order - b.sort_order);

  function addAbsoluteProductLink(event: MouseEvent<HTMLAnchorElement>) {
    const absoluteUrl = new URL(productUrl, window.location.origin).href;
    event.currentTarget.href = `https://wa.me/573053744560?text=${encodeURIComponent(`${message} ${absoluteUrl}`)}`;
  }

  return (
    <div className="inquiry-panel">
      {product.product_variants.length > 0 && <>
        <p className="eyebrow">ELIGE TU COLOR</p>
        <div aria-label="Selecciona un color" className="variant-picker" role="group">
          {product.product_variants.map((variant) => <button
            aria-label={variant.name}
            aria-pressed={selectedVariant?.id === variant.id}
            className="variant-swatch"
            key={variant.id}
            onClick={() => setSelectedVariantId(variant.id)}
            style={{ "--swatch": variant.color_hex } as CSSProperties}
            title={variant.name}
            type="button"
          ><span aria-hidden="true" />{variant.name}</button>)}
        </div>
      </>}
      <p className="eyebrow">ELIGE TU TALLA</p>
      <div aria-label="Selecciona una talla" className="size-picker" role="group">
        {sizes.map((item) => (
            <button aria-pressed={size === item.size} className="size-button" disabled={!item.is_available} key={item.id} onClick={() => setSizeSelection({ variantId: selectedVariant?.id ?? null, size: item.size })} type="button">
            {item.size}
          </button>
        ))}
        {!sizes.length && <p className="muted-copy">Consulta las tallas disponibles por WhatsApp.</p>}
      </div>
      <a className="button button-dark button-wide" href={whatsappUrl} onClick={addAbsoluteProductLink} rel="noreferrer" target="_blank">
        <MessageCircle aria-hidden="true" size={17} /> Consultar por WhatsApp <ArrowUpRight aria-hidden="true" size={16} />
      </a>
      <a className="text-link" href="https://www.instagram.com/bedifferentofficial_/" rel="noreferrer" target="_blank">
        Escribir por Instagram <ArrowUpRight aria-hidden="true" size={14} />
      </a>
    </div>
  );
}
