import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Nuestra filosofía | BeDifferent", description: "DISCIPLINE MAKES THE DIFFERENCE. Conoce la filosofía de BeDifferent." };

export default function AboutPage() {
  return <main><SiteHeader /><section className="about-page" id="main-content" tabIndex={-1}>
    <div className="section-kicker"><span>BE DIFFERENT / 01</span><span>MORE THAN CLOTHING</span></div>
    <p className="eyebrow">UNA FORMA DE AVANZAR.</p><h1>La diferencia<br />se construye<br /><em>cada día.</em></h1>
    <div className="about-bottom"><p>BeDifferent une Fitness Lifestyle y streetwear en piezas pensadas para acompañarte en movimiento. La disciplina no es un destino: es lo que eliges hacer, una y otra vez.</p><span>DISCIPLINE MAKES<br />THE DIFFERENCE.</span></div>
    <Link className="button button-dark" href="/catalogo">Explorar la colección <ArrowUpRight aria-hidden="true" size={15} /></Link>
  </section><SiteFooter /></main>;
}
