import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts } from "@/lib/data/products";

export default async function Home() {
  const featured = await getFeaturedProducts();

  return (
    <main>
      <SiteHeader />
      <section className="hero-section" id="main-content" tabIndex={-1}>
        <div className="hero-index"><span>BE DIFFERENT · COLOMBIA</span><span>FITNESS LIFESTYLE</span></div>
        <div className="hero-copy">
          <p className="eyebrow">NO ES SOLO LO QUE VISTES.</p>
          <h1>MORE THAN<br /><em>CLOTHING.</em></h1>
          <div className="hero-bottom">
            <p>Disciplina en movimiento.<br />Una forma distinta de vestir lo que eres.</p>
            <Link className="button button-light" href="/catalogo">Descubre la colección <ArrowUpRight aria-hidden="true" size={16} /></Link>
          </div>
        </div>
        <div aria-hidden="true" className="hero-art">
          <span className="art-line art-line-one" />
          <span className="art-line art-line-two" />
          <span className="art-disc" />
          <span className="art-caption">FORM FOLLOWS<br />DISCIPLINE / 01</span>
          <span className="art-edge">BD — CO</span>
        </div>
        <a className="scroll-cue" href="#manifesto"><ArrowDown aria-hidden="true" size={15} /> SCROLL TO DIFFER</a>
      </section>

      <section className="manifesto-section" id="manifesto">
        <div className="section-kicker"><span>01 — FILOSOFÍA</span><span>BE DIFFERENT / COLOMBIA</span></div>
        <div className="manifesto-content">
          <p className="eyebrow">DISCIPLINE MAKES THE DIFFERENCE.</p>
          <h2>El progreso no<br />necesita permiso.</h2>
          <p className="manifesto-note">Diseñado para acompañar el movimiento, dentro y fuera del entrenamiento.</p>
        </div>
        <Link className="text-link" href="/nosotros">Conoce nuestra filosofía <ArrowUpRight aria-hidden="true" size={15} /></Link>
      </section>

      <section className="featured-section">
        <div className="section-kicker"><span>02 — SELECCIÓN</span><span>PIEZAS PARA EL DÍA A DÍA</span></div>
        <div className="section-heading"><h2>La colección.</h2><Link className="text-link" href="/catalogo">Ver todo <ArrowUpRight aria-hidden="true" size={15} /></Link></div>
        {featured.length ? <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div> : (
          <div className="collection-note"><span className="note-number">BE DIFFERENT</span><p>Aún no hay piezas<br />destacadas.</p><Link className="button button-outline" href="/catalogo">Explorar catálogo <ArrowUpRight aria-hidden="true" size={15} /></Link></div>
        )}
      </section>

      <section className="contact-band">
        <p className="eyebrow">MORE THAN CLOTHING.</p>
        <h2>Hazlo a tu manera.</h2>
        <Link className="button button-light" href="/catalogo">Explorar productos <ArrowUpRight aria-hidden="true" size={15} /></Link>
      </section>
      <SiteFooter />
    </main>
  );
}
