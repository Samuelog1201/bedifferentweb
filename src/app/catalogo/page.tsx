import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogGrid } from "@/components/catalog-grid";
import { getCatalogProducts, type CatalogCategory, type CatalogSort, type CatalogStatus } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Colección | BeDifferent",
  description: "Explora la colección Fitness Lifestyle de BeDifferent. Consulta preventa, tallas y disponibilidad.",
};
export default async function CatalogPage({ searchParams }: PageProps<"/catalogo">) {
  const params = await searchParams;
  const categoryValue = params.category;
  const sortValue = params.sort;
  const statusValue = params.status;
  const category: CatalogCategory = categoryValue === "oversized" || categoryValue === "regular-fit" ? categoryValue : "all";
  const sort: CatalogSort = sortValue === "newest" || sortValue === "price-asc" || sortValue === "price-desc" ? sortValue : "featured";
  const status: CatalogStatus = statusValue === "preorder" || statusValue === "available" || statusValue === "sold_out" || statusValue === "coming_soon" ? statusValue : "all";
  const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100_000) : 1;
  const catalog = await getCatalogProducts({ category, query, sort, status, page });

  if (catalog.totalCount > 0 && page > catalog.pageCount) {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (category !== "all") nextParams.set("category", category);
    if (sort !== "featured") nextParams.set("sort", sort);
    if (status !== "all") nextParams.set("status", status);
    nextParams.set("page", String(catalog.pageCount));
    redirect(`/catalogo?${nextParams.toString()}`);
  }

  return <main><SiteHeader /><section className="page-intro catalog-intro" id="main-content" tabIndex={-1}>
    <div className="section-kicker"><span>COLECCIÓN / 01</span><span>FITNESS LIFESTYLE · COLOMBIA</span></div>
    <p className="eyebrow">DISEÑADO PARA EL MOVIMIENTO.</p><h1>Vístete<br /><em>diferente.</em></h1>
    <p className="intro-description">Piezas esenciales para entrenar, avanzar y vivir a tu ritmo.</p>
  </section><section className="catalog-section"><CatalogGrid
    category={category}
    page={page}
    pageCount={catalog.pageCount}
    products={catalog.products}
    query={query}
    sort={sort}
    status={status}
    totalCount={catalog.totalCount}
  /></section><SiteFooter /></main>;
}
