"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const links = [
  { href: "/#colecciones", label: "Colección", route: "/" },
  { href: "/catalogo", label: "Catálogo", route: "/catalogo" },
  { href: "/nosotros", label: "Filosofía", route: "/nosotros" },
  { href: "/contacto", label: "Contacto", route: "/contacto" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <header className="site-header">
      <Link aria-label="BeDifferent, inicio" className="wordmark" href="/">
        BE<span>DIFFERENT</span>
      </Link>
      <nav aria-label="Navegación principal" className="desktop-nav">
        {links.map((link) => <Link aria-current={pathname === link.route ? "page" : undefined} href={link.href} key={link.href}>{link.label}</Link>)}
      </nav>
      <details className="mobile-nav" ref={menuRef}>
        <summary><span aria-hidden="true" className="menu-mark" /> Menú</summary>
        <div className="mobile-nav-panel"><nav aria-label="Navegación móvil">
          {links.map((link) => <Link aria-current={pathname === link.route ? "page" : undefined} href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>)}
        </nav></div>
      </details>
      <Link className="header-cta" href="/catalogo">
        Explorar colección <ArrowUpRight aria-hidden="true" size={15} />
      </Link>
    </header>
  );
}
