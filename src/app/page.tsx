import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { CollectionEditorial } from "@/components/collection-editorial";
import { getFeaturedProducts } from "@/lib/data/products";

export default async function Home() {
  const featured = await getFeaturedProducts();

  return (
    <main>
      <SiteHeader />
      <section className="hero-section" id="main-content" tabIndex={-1}>
        <div className="hero-index"><span>BE DIFFERENT · COLOMBIA</span><span>PRIMERA COLECCIÓN</span></div>
        <div className="hero-copy">
          <p className="eyebrow">DISCIPLINE MAKES THE DIFFERENCE.</p>
          <h1 className="hero-wordmark"><span className="hero-wordmark-be">BE</span><span className="hero-wordmark-different">DIFFERENT.</span></h1>
          <div className="hero-bottom">
            <p>Fitness Lifestyle para acompañarte<br />dentro y fuera del entrenamiento.</p>
            <Link className="button button-light" href="/catalogo">Descubre la colección <ArrowUpRight aria-hidden="true" size={16} /></Link>
          </div>
        </div>
        <aside aria-label="La mentalidad BeDifferent" className="hero-side-note">
          <span>01 — MENTALIDAD EN MOVIMIENTO</span>
          <p>Más que ropa.<br /><em>Una forma de avanzar.</em></p>
        </aside>
        <a className="scroll-cue" href="#manifesto"><ArrowDown aria-hidden="true" size={15} /> SCROLL TO DIFFER</a>
      </section>

      <section className="manifesto-section" id="manifesto">
        <div className="section-kicker"><span>01 — FILOSOFÍA</span><span>BE DIFFERENT / COLOMBIA</span></div>
        <div className="manifesto-content">
          <p className="eyebrow">MENTALIDAD PARA AVANZAR</p>
          <h2>Construye la mejor<br /><strong>versión de ti.</strong></h2>
          <p className="manifesto-note">Cada día es una oportunidad para avanzar, superar tus límites y convertir la disciplina en parte de tu vida.</p>
        </div>
        <Link className="text-link" href="/nosotros">Conoce nuestra filosofía <ArrowUpRight aria-hidden="true" size={15} /></Link>
      </section>

      <CollectionEditorial />

      <section className="featured-section">
        <div className="section-kicker"><span>03 — CATÁLOGO</span><span>PIEZAS PARA EL DÍA A DÍA</span></div>
        <div className="section-heading catalog-heading">
          <div><h2>Encuentra tu forma<br />de ser <strong>diferente.</strong></h2><p>Descubre nuestras prendas y encuentra las piezas que conectan con tu estilo.</p></div>
          <Link className="text-link" href="/catalogo">Ver catálogo <ArrowUpRight aria-hidden="true" size={15} /></Link>
        </div>
        {featured.length ? <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div> : (
          <div className="collection-note"><span className="note-number">BE DIFFERENT</span><p>Aún no hay piezas<br />destacadas.</p><Link className="button button-outline" href="/catalogo">Explorar catálogo <ArrowUpRight aria-hidden="true" size={15} /></Link></div>
        )}
      </section>

      <section className="contact-band">
        <p className="eyebrow">DISCIPLINE MAKES THE DIFFERENCE.</p>
        <h2>No es solo lo que vistes.<br /><em>Es lo que representas.</em></h2>
        <p className="contact-band-mantra">MORE THAN CLOTHING.</p>
        <Link className="button button-light" href="/catalogo">Explorar productos <ArrowUpRight aria-hidden="true" size={15} /></Link>
      </section>
      <SiteFooter />
    </main>
  );
}
