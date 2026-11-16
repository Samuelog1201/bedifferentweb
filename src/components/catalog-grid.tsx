import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/data/products";
import type { CatalogCategory, CatalogSort, CatalogStatus } from "@/lib/data/products";

const categories: { value: CatalogCategory; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "oversized", label: "Oversized" },
  { value: "regular-fit", label: "Regular fit" },
];

const statuses: { value: CatalogStatus; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "preorder", label: "Preventa" },
  { value: "available", label: "Disponible" },
  { value: "sold_out", label: "Agotado" },
  { value: "coming_soon", label: "Próximamente" },
];

const sortOptions: { value: CatalogSort; label: string }[] = [
  { value: "featured", label: "Destacados" },
  { value: "newest", label: "Más recientes" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
];

export function CatalogGrid({
  products,
  category,
  query,
  sort,
  status,
  page,
  pageCount,
  totalCount,
}: {
  products: Product[];
  category: CatalogCategory;
  query: string;
  sort: CatalogSort;
  status: CatalogStatus;
  page: number;
  pageCount: number;
  totalCount: number;
}) {
  function buildHref(next: { category?: CatalogCategory; page?: number }) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const nextCategory = next.category ?? category;
    if (nextCategory !== "all") params.set("category", nextCategory);
    if (sort !== "featured") params.set("sort", sort);
    if (status !== "all") params.set("status", status);
    const nextPage = next.page ?? 1;
    if (nextPage > 1) params.set("page", String(nextPage));
    const serialized = params.toString();
    return serialized ? `/catalogo?${serialized}` : "/catalogo";
  }

  const firstResult = totalCount ? (page - 1) * 12 + 1 : 0;
  const lastResult = Math.min(page * 12, totalCount);

  return <>
    <form action="/catalogo" className="catalog-toolbar" method="get">
      <nav aria-label="Filtrar por categoría" className="category-filters">
        {categories.map((item) => <Link
          aria-current={category === item.value ? "page" : undefined}
          className={`filter-chip${category === item.value ? " is-active" : ""}`}
          href={buildHref({ category: item.value })}
          key={item.value}
        >{item.label}</Link>)}
      </nav>
      <input name="category" type="hidden" value={category} />
      <label className="catalog-search">
        <Search aria-hidden="true" size={16} />
        <span className="sr-only">Buscar por nombre</span>
        <input autoComplete="off" defaultValue={query} maxLength={80} name="q" placeholder="Buscar por nombre…" type="search" />
      </label>
      <label className="catalog-select-label">
        <span className="sr-only">Estado comercial</span>
        <select defaultValue={status} name="status">
          {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="catalog-select-label">
        <span className="sr-only">Ordenar productos</span>
        <select defaultValue={sort} name="sort">
          {sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <button aria-label="Aplicar búsqueda y filtros" className="catalog-submit" type="submit">Aplicar</button>
    </form>

    <p aria-live="polite" className="catalog-result-count">
      {totalCount ? `MOSTRANDO ${firstResult}–${lastResult} DE ${totalCount} PIEZAS` : "COLECCIÓN / BE DIFFERENT"}
    </p>

    {products.length ? <div className="product-grid">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div> : <div className="empty-state">
      <span className="empty-index">01 / 01</span>
      <h2>{totalCount === 0 && !query && category === "all" && status === "all" ? "No hay productos publicados." : "Sin resultados."}</h2>
      <p>{totalCount === 0 && !query && category === "all" && status === "all" ? "En este momento no hay productos para mostrar." : "Prueba otra búsqueda o cambia los filtros."}</p>
    </div>}

    {pageCount > 1 && <nav aria-label="Paginación del catálogo" className="catalog-pagination">
      {page > 1 ? <Link href={buildHref({ page: page - 1 })}><ArrowLeft aria-hidden="true" size={15} /> Anterior</Link> : <span aria-disabled="true"><ArrowLeft aria-hidden="true" size={15} /> Anterior</span>}
      <span aria-current="page">{page} <span aria-hidden="true">/</span> {pageCount}</span>
      {page < pageCount ? <Link href={buildHref({ page: page + 1 })}>Siguiente <ArrowRight aria-hidden="true" size={15} /></Link> : <span aria-disabled="true">Siguiente <ArrowRight aria-hidden="true" size={15} /></span>}
    </nav>}
  </>;
}
