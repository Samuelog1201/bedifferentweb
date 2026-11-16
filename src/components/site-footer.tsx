import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <p className="eyebrow">BE DIFFERENT</p>
          <p className="footer-manifesto">DISCIPLINE MAKES<br />THE DIFFERENCE.</p>
        </div>
        <div className="footer-links">
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/nosotros">Nosotros</Link>
          <a href="https://www.instagram.com/bedifferentofficial_/" rel="noreferrer" target="_blank">
            Instagram <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 BeDifferent · Colombia</span>
        <span>MORE THAN CLOTHING.</span>
      </div>
    </footer>
  );
}
