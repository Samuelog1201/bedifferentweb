"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "@/lib/data/product-utils";

type VariantContextValue = {
  selectedVariant: ProductVariant | null;
  setSelectedVariantId: (id: string) => void;
};

const VariantContext = createContext<VariantContextValue | null>(null);

export function ProductVariantProvider({ product, children }: { product: Product; children: ReactNode }) {
  const [selectedId, setSelectedId] = useState(product.product_variants[0]?.id ?? "");
  const selectedVariant = product.product_variants.find((variant) => variant.id === selectedId) ?? null;
  return <VariantContext.Provider value={{ selectedVariant, setSelectedVariantId: setSelectedId }}>{children}</VariantContext.Provider>;
}

export function useProductVariant() {
  const context = useContext(VariantContext);
  if (!context) throw new Error("Product components must be wrapped in ProductVariantProvider.");
  return context;
}
