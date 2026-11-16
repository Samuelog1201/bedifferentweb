import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  const legalLinks = [
    ["Términos y condiciones", "/terminos-y-condiciones"],
    ["Tratamiento de datos personales", "/politica-de-tratamiento-de-datos-personales"],
    ["Envíos y entregas", "/politica-de-envios-y-entregas"],
    ["Cambios, devoluciones y garantías", "/politica-de-cambios-devoluciones-y-garantias"],
    ["Cookies", "/politica-de-cookies"],
  ] as const;

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <p className="eyebrow">BE DIFFERENT</p>
          <p className="footer-manifesto">DISCIPLINE MAKES<br />THE DIFFERENCE.</p>
        </div>
        <div className="footer-links">
          <Link href="/#colecciones">Colección</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/nosotros">Filosofía</Link>
          <Link href="/contacto">Contacto</Link>
          <a href="https://www.instagram.com/bedifferentofficial_/" rel="noreferrer" target="_blank">
            Instagram <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        </div>
      </div>
      <nav aria-label="Políticas y términos" className="footer-legal-links">
        {legalLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="footer-bottom">
        <span>© 2026 BeDifferent · Colombia</span>
        <span>MORE THAN CLOTHING. / DISCIPLINE MAKES THE DIFFERENCE.</span>
      </div>
    </footer>
  );
}
