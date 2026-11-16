import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminProductForm } from "@/components/admin-product-form";
import { requireAdmin } from "@/lib/auth/admin";

export default async function NewProductPage() {
  await requireAdmin();
  return <main className="admin-shell"><header className="admin-topbar"><Link className="wordmark" href="/">BE<span>DIFFERENT</span></Link><Link className="text-link" href="/admin/productos"><ArrowLeft aria-hidden="true" size={14} /> Productos</Link></header><section className="admin-content narrow-admin" id="main-content" tabIndex={-1}><p className="eyebrow">ADMINISTRACIÓN / NUEVA PIEZA</p><h1>Crear publicación.</h1><AdminProductForm /></section></main>;
}
