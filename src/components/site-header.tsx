import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const links = [
  { href: "/catalogo", label: "Colección" },
  { href: "/nosotros", label: "La filosofía" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link aria-label="BeDifferent, inicio" className="wordmark" href="/">
        BE<span>DIFFERENT</span>
      </Link>
      <nav aria-label="Navegación principal" className="desktop-nav">
        {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
      </nav>
      <details className="mobile-nav">
        <summary><span aria-hidden="true" className="menu-mark" /> Menú</summary>
        <div className="mobile-nav-panel"><nav aria-label="Navegación móvil">
          {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          <Link href="/contacto">Contacto</Link>
        </nav></div>
      </details>
      <Link className="header-cta" href="/catalogo">
        Explorar <ArrowUpRight aria-hidden="true" size={15} />
      </Link>
    </header>
  );
}
