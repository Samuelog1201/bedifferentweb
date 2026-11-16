import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
import { ArchiveProductForm } from "@/components/archive-product-form";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("id,name,slug,publication_status,commercial_status,price_cop,updated_at").order("updated_at", { ascending: false });
  return <main className="admin-shell"><header className="admin-topbar"><Link className="wordmark" href="/">BE<span>DIFFERENT</span></Link><Link className="text-link" href="/admin"><ArrowLeft aria-hidden="true" size={14} /> Panel</Link></header>
    <section className="admin-content" id="main-content" tabIndex={-1}><div className="admin-heading"><div><p className="eyebrow">ADMINISTRACIÓN / PUBLICACIONES</p><h1>Productos.</h1></div><Link className="button button-dark" href="/admin/productos/nuevo"><Plus aria-hidden="true" size={16} /> Nuevo</Link></div>
      <div className="admin-product-list">{products?.length ? products.map((product) => <article className="admin-product-row" key={product.id}><div><small>{product.publication_status} · {product.commercial_status}</small><strong>{product.name}</strong><span>{product.price_cop.toLocaleString("es-CO")} COP</span></div><div className="admin-row-actions"><Link aria-label={`Editar ${product.name}`} href={`/admin/productos/${product.id}/editar`}><ArrowUpRight aria-hidden="true" size={18} /></Link>{product.publication_status !== "archived" && <ArchiveProductForm id={product.id} name={product.name} />}</div></article>) : <p className="empty-admin">Aún no hay publicaciones. Crea la primera pieza.</p>}</div>
    </section></main>;
}
