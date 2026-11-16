import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = { title: "Acceso administrador | BeDifferent", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <main className="admin-login-shell">
    <header className="admin-topbar admin-login-topbar">
      <Link aria-label="BeDifferent, inicio" className="wordmark" href="/">BE<span>DIFFERENT</span></Link>
      <Link className="text-link" href="/"><ArrowLeft aria-hidden="true" size={14} /> Volver al sitio</Link>
    </header>
    <section className="admin-login-page" id="main-content" tabIndex={-1}>
      <p className="eyebrow">BE DIFFERENT / ADMIN</p><h1>Acceso<br /><em>privado.</em></h1>
      <p className="admin-login-copy">Panel exclusivo para gestionar las publicaciones de la marca.</p>
      <AdminLoginForm />
    </section>
  </main>;
}
