import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { AdminProductForm } from "@/components/admin-product-form";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/data/products";

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/productos/[id]/editar">) {
  await requireAdmin();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*, product_images(*), product_sizes(*), product_variants(*, product_variant_images(*), product_variant_sizes(*))").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link className="wordmark" href="/">BE<span>DIFFERENT</span></Link>
        <Link className="text-link" href="/admin/productos"><ArrowLeft aria-hidden="true" size={14} /> Productos</Link>
      </header>
      <section className="admin-content narrow-admin" id="main-content" tabIndex={-1}>
        <div className="admin-edit-heading">
          <div><p className="eyebrow">ADMINISTRACIÓN / EDITAR PIEZA</p><h1>{data.name}.</h1></div>
          <Link className="button button-outline" href={`/admin/productos/${data.id}/vista-previa`}><Eye aria-hidden="true" size={16} /> Vista previa</Link>
        </div>
        {query.created === "1" && <p aria-live="polite" className="form-success" role="status">Borrador creado. Añade fotografías y revisa la vista previa antes de publicar.</p>}
        {query.saved === "1" && <p aria-live="polite" className="form-success" role="status">Cambios guardados. Las galerías y variantes están actualizadas.</p>}
        <AdminProductForm product={data as Product} />
      </section>
    </main>
  );
}
