import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductGallery } from "@/components/product-gallery";
import { ProductInquiry } from "@/components/product-inquiry";
import { ProductVariantProvider } from "@/components/product-variant-context";
import { SiteHeader } from "@/components/site-header";
import { formatCop } from "@/lib/data/product-utils";
import { getAdminProductPreviewById } from "@/lib/data/admin-preview";

export const metadata: Metadata = { title: "Vista previa privada | BeDifferent", robots: { index: false, follow: false } };

export default async function AdminProductPreviewPage({ params }: PageProps<"/admin/productos/[id]/vista-previa">) {
  const { id } = await params;
  const product = await getAdminProductPreviewById(id);
  if (!product) notFound();

  const states: Record<string, string> = { preorder: "EN PREVENTA", available: "DISPONIBLE", sold_out: "AGOTADO", coming_soon: "PRÓXIMAMENTE" };
  const productUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/producto/${product.slug}`
    : `/producto/${product.slug}`;

  return <main>
    <div className="preview-private-bar"><span>VISTA PREVIA PRIVADA · NO VISIBLE EN EL CATÁLOGO</span><Link href={`/admin/productos/${product.id}/editar`}><ArrowLeft aria-hidden="true" size={14} /> Volver al editor</Link></div>
    <SiteHeader />
    <div className="product-detail-wrap" id="main-content" tabIndex={-1}>
      <ProductVariantProvider product={product}><div className="product-detail">
        <ProductGallery images={product.product_images} name={product.name} />
        <section className="product-info">
          <p className="eyebrow">{product.category.replace("-", " ")} / {states[product.commercial_status]}</p>
          <h1>{product.name}</h1>
          <div className="detail-price-group">{product.compare_at_price_cop && <del className="detail-compare-price">{formatCop(product.compare_at_price_cop)}</del>}<p className="detail-price">{formatCop(product.price_cop)}</p></div>
          {product.summary && <p className="detail-summary">{product.summary}</p>}
          <div className="detail-rule" />
          <dl className="product-specs">
            <div><dt>Material</dt><dd>{product.material || "Consulta por WhatsApp"}</dd></div>
            <div><dt>Corte</dt><dd>{product.fit === "regular-fit" ? "Regular fit" : "Oversized"}</dd></div>
            {!product.product_variants.length && product.color && <div><dt>Color</dt><dd>{product.color}</dd></div>}
          </dl>
          {product.tags.length > 0 && <ul aria-label="Etiquetas del producto" className="product-detail-tags">{product.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
          <ProductInquiry product={product} productUrl={productUrl} />
          <p className="detail-footnote">La publicación se abrirá para visitantes cuando cambies su visibilidad a “Publicado”.</p>
        </section>
      </div></ProductVariantProvider>
      {product.description && <section className="product-description"><p className="eyebrow">DETALLES / 01</p><p>{product.description}</p></section>}
    </div>
  </main>;
}
