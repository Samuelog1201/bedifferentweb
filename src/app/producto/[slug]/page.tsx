import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ProductGallery } from "@/components/product-gallery";
import { ProductInquiry } from "@/components/product-inquiry";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedProductBySlug } from "@/lib/data/products";
import { formatCop } from "@/lib/data/product-utils";

type Props = PageProps<"/producto/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado | BeDifferent" };
  return { title: `${product.name} | BeDifferent`, description: product.summary || product.description.slice(0, 160) };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const state: Record<string, string> = { preorder: "EN PREVENTA", available: "DISPONIBLE", sold_out: "AGOTADO", coming_soon: "PRÓXIMAMENTE" };
  return <main><SiteHeader /><div className="product-detail-wrap" id="main-content" tabIndex={-1}>
    <Link className="back-link" href="/catalogo"><ArrowLeft aria-hidden="true" size={15} /> Volver a la colección</Link>
    <div className="product-detail">
      <ProductGallery images={product.product_images} name={product.name} />
      <section className="product-info">
        <p className="eyebrow">{product.category.replace("-", " ")} / {state[product.commercial_status]}</p>
        <h1>{product.name}</h1>
        <div className="detail-price-group">
          {product.compare_at_price_cop && <del className="detail-compare-price">{formatCop(product.compare_at_price_cop)}</del>}
          <p className="detail-price">{formatCop(product.price_cop)}</p>
        </div>
        {product.summary && <p className="detail-summary">{product.summary}</p>}
        <div className="detail-rule" />
        <dl className="product-specs">
          <div><dt>Material</dt><dd>{product.material || "Consulta por WhatsApp"}</dd></div>
          <div><dt>Corte</dt><dd>{product.fit === "regular-fit" ? "Regular fit" : "Oversized"}</dd></div>
          {product.color && <div><dt>Color</dt><dd>{product.color}</dd></div>}
        </dl>
        {product.tags.length > 0 && <ul aria-label="Etiquetas del producto" className="product-detail-tags">{product.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
        <ProductInquiry product={product} productUrl={process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/producto/${product.slug}` : `/producto/${product.slug}`} />
        <p className="detail-footnote">Sin checkout. Atención directa desde Colombia.</p>
      </section>
    </div>
    {product.description && <section className="product-description"><p className="eyebrow">DETALLES / 01</p><p>{product.description}</p><Link className="text-link" href="https://www.instagram.com/bedifferentofficial_/" rel="noreferrer" target="_blank">Ver BeDifferent en Instagram <ArrowUpRight aria-hidden="true" size={14} /></Link></section>}
  </div><SiteFooter /></main>;
}
