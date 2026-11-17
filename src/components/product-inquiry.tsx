"use client";

import { useId, useState, type CSSProperties, type MouseEvent } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { formatCop, type Product } from "@/lib/data/product-utils";
import { useProductVariant } from "@/components/product-variant-context";
import {
  buildProductInquiryMessage,
  buildWhatsAppUrl,
  getProductInquirySelectionError,
  whatsappNumber,
} from "@/lib/whatsapp";

export function ProductInquiry({ product, productUrl }: { product: Product; productUrl: string }) {
  const [sizeSelection, setSizeSelection] = useState<{ variantId: string | null; size: string }>({ variantId: null, size: "" });
  const [notice, setNotice] = useState("");
  const noticeId = useId();
  const { selectedVariant, setSelectedVariantId } = useProductVariant();
  const size = sizeSelection.variantId === (selectedVariant?.id ?? null) ? sizeSelection.size : "";
  const selectedColor = selectedVariant?.name ?? product.color ?? "";
  const sizes = selectedVariant
    ? [...selectedVariant.product_variant_sizes].sort((a, b) => a.sort_order - b.sort_order)
    : [...product.product_sizes].sort((a, b) => a.sort_order - b.sort_order);

  function openWhatsApp(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const selectionError = getProductInquirySelectionError({
      hasVariants: product.product_variants.length > 0,
      hasSizes: sizes.some((item) => item.is_available),
      color: selectedColor || null,
      size,
    });
    if (selectionError) {
      setNotice(selectionError);
      return;
    }
    if (!whatsappNumber) {
      setNotice("WhatsApp no está configurado en este momento. Intenta más tarde.");
      return;
    }

    setNotice("");
    const absoluteUrl = new URL(productUrl, window.location.origin).href;
    const message = buildProductInquiryMessage({
      productName: product.name,
      color: selectedColor || "No especificado",
      size: size || "Por confirmar",
      price: `${formatCop(product.price_cop)} COP`,
      productUrl: absoluteUrl,
    });
    window.open(buildWhatsAppUrl(whatsappNumber, message), "_blank", "noopener,noreferrer");
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
            onClick={() => { setSelectedVariantId(variant.id); setNotice(""); }}
            style={{ "--swatch": variant.color_hex } as CSSProperties}
            title={variant.name}
            type="button"
          ><span aria-hidden="true" />{variant.name}</button>)}
        </div>
      </>}
      <p className="eyebrow">ELIGE TU TALLA</p>
      <div aria-label="Selecciona una talla" className="size-picker" role="group">
        {sizes.map((item) => (
            <button aria-pressed={size === item.size} className="size-button" disabled={!item.is_available} key={item.id} onClick={() => { setSizeSelection({ variantId: selectedVariant?.id ?? null, size: item.size }); setNotice(""); }} type="button">
            {item.size}
          </button>
        ))}
        {!sizes.length && <p className="muted-copy">Consulta las tallas disponibles por WhatsApp.</p>}
      </div>
      {notice && <p aria-live="assertive" className="inquiry-notice" id={noticeId} role="alert">{notice}</p>}
      <a
        aria-describedby={notice ? noticeId : undefined}
        className="button button-dark button-wide"
        href={buildWhatsAppUrl(whatsappNumber) || "#"}
        onClick={openWhatsApp}
        rel="noreferrer"
        target="_blank"
      >
        <MessageCircle aria-hidden="true" size={17} /> Consultar por WhatsApp <ArrowUpRight aria-hidden="true" size={16} />
      </a>
      <a className="text-link" href="https://www.instagram.com/bedifferentofficial_/" rel="noreferrer" target="_blank">
        Escribir por Instagram <ArrowUpRight aria-hidden="true" size={14} />
      </a>
    </div>
  );
}
