import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCop, type Product } from "@/lib/data/product-utils";

const statusLabel: Record<Product["commercial_status"], string> = {
  preorder: "Preventa",
  available: "Disponible",
  sold_out: "Agotado",
  coming_soon: "Próximamente",
};

export function ProductCard({ product }: { product: Product }) {
  const variantImages = product.product_variants.flatMap((variant) => variant.product_variant_images);
  const image = product.product_images.find((item) => item.is_primary)
    ?? [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]
    ?? variantImages.find((item) => item.is_primary)
    ?? [...variantImages].sort((a, b) => a.sort_order - b.sort_order)[0];
  const imageUrl = image?.signed_url ?? null;

  return (
    <article className="product-card">
      <Link aria-label={`Ver ${product.name}`} className="product-media" href={`/producto/${product.slug}`}>
        {imageUrl ? (
          <Image alt={image?.alt_text || product.name} className="product-image" height={1000} quality={90} sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" src={imageUrl} width={800} />
        ) : (
          <div aria-hidden="true" className="product-placeholder">
            <span>{product.category === "oversized" ? "OVR" : "REG"}</span>
            <span>IMAGEN<br />NO DISPONIBLE</span>
          </div>
        )}
        <span className="product-status">{statusLabel[product.commercial_status]}</span>
        <span className="product-open"><ArrowUpRight aria-hidden="true" size={18} /></span>
      </Link>
      <div className="product-meta">
        <div>
          <p className="product-category">{product.category.replace("-", " ")}</p>
          <h3><Link href={`/producto/${product.slug}`}>{product.name}</Link></h3>
          {(product.product_variants[0]?.name || product.color) && <p className="product-color">{product.product_variants[0]?.name || product.color}</p>}
        </div>
        <div className="product-price-group">
          {product.compare_at_price_cop && <span className="product-compare-price">{formatCop(product.compare_at_price_cop)}</span>}
          <p className="product-price">{formatCop(product.price_cop)}</p>
        </div>
      </div>
      {product.summary && <p className="product-summary">{product.summary}</p>}
      {product.tags.length > 0 && <ul aria-label={`Etiquetas de ${product.name}`} className="product-tags">{product.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
    </article>
  );
}
