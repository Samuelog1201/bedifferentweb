import type { Metadata } from "next";
import { ArrowUpRight, AtSign, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Contacto | BeDifferent", description: "Conecta con BeDifferent por WhatsApp o Instagram." };

export default function ContactPage() {
  return <main><SiteHeader /><section className="contact-page" id="main-content" tabIndex={-1}>
    <div className="section-kicker"><span>HABLEMOS</span><span>COLOMBIA</span></div>
    <p className="eyebrow">CONEXIÓN DIRECTA.</p><h1>¿Tienes algo<br /><em>en mente?</em></h1>
    <div className="contact-options">
      <a href="https://wa.me/573053744560" rel="noreferrer" target="_blank"><MessageCircle aria-hidden="true" /><span><small>WHATSAPP</small><strong>Conversemos</strong></span><ArrowUpRight aria-hidden="true" /></a>
      <a href="https://www.instagram.com/bedifferentofficial_/" rel="noreferrer" target="_blank"><AtSign aria-hidden="true" /><span><small>INSTAGRAM</small><strong>@bedifferentofficial_</strong></span><ArrowUpRight aria-hidden="true" /></a>
    </div>
  </section><SiteFooter /></main>;
}
