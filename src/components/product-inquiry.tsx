"use client";

import { useState, type MouseEvent } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import type { Product } from "@/lib/data/products";

export function ProductInquiry({ product, productUrl }: { product: Product; productUrl: string }) {
  const [size, setSize] = useState("");
  const message = `Hola, BeDifferent. Estoy interesado en ${product.name}${size ? `, talla ${size}` : ""}${product.color ? `, color ${product.color}` : ""}. Quisiera conocer más información sobre su ${product.commercial_status === "preorder" ? "preventa" : "disponibilidad"}.`;
  const whatsappUrl = `https://wa.me/573053744560?text=${encodeURIComponent(`${message} ${productUrl}`)}`;
  const sizes = [...product.product_sizes].sort((a, b) => a.sort_order - b.sort_order);

  function addAbsoluteProductLink(event: MouseEvent<HTMLAnchorElement>) {
    const absoluteUrl = new URL(productUrl, window.location.origin).href;
    event.currentTarget.href = `https://wa.me/573053744560?text=${encodeURIComponent(`${message} ${absoluteUrl}`)}`;
  }

  return (
    <div className="inquiry-panel">
      <p className="eyebrow">ELIGE TU TALLA</p>
      <div aria-label="Selecciona una talla" className="size-picker" role="group">
        {sizes.map((item) => (
          <button aria-pressed={size === item.size} className="size-button" disabled={!item.is_available} key={item.id} onClick={() => setSize(item.size)} type="button">
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
