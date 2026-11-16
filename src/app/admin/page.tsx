import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LogOut, Plus } from "lucide-react";
import { signOutAdmin } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administración | BeDifferent", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const { email } = await requireAdmin();
  const supabase = await createClient();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
  const { count: publishedCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("publication_status", "published");

  return <main className="admin-shell">
    <header className="admin-topbar"><Link className="wordmark" href="/">BE<span>DIFFERENT</span></Link><span className="admin-account">{email}</span><form action={signOutAdmin}><button className="admin-logout" type="submit"><LogOut aria-hidden="true" size={15} /> Salir</button></form></header>
    <section className="admin-content" id="main-content" tabIndex={-1}>
      <div className="admin-heading"><div><p className="eyebrow">ADMINISTRACIÓN / OVERVIEW</p><h1>El espacio<br />de gestión.</h1></div><Link className="button button-dark" href="/admin/productos/nuevo"><Plus aria-hidden="true" size={16} /> Nueva publicación</Link></div>
      <div className="admin-stats"><article><span>PUBLICACIONES</span><strong>{count ?? 0}</strong></article><article><span>PUBLICADAS</span><strong>{publishedCount ?? 0}</strong></article><article><span>ESTADO</span><strong>PREVENTA</strong></article></div>
      <Link className="admin-row-link" href="/admin/productos"><span><small>CATÁLOGO</small><strong>Gestionar productos</strong></span><ArrowRight aria-hidden="true" size={18} /></Link>
    </section>
  </main>;
}
