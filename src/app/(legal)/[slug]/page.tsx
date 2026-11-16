import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const legalPages = {
  "terminos-y-condiciones": {
    eyebrow: "INFORMACIÓN LEGAL / 01",
    title: "Términos y condiciones",
    introduction: "Conoce las condiciones generales que regulan el uso de nuestra página web, la consulta de nuestros productos y el proceso de compra a través de nuestros canales oficiales",
  },
  "politica-de-tratamiento-de-datos-personales": {
    eyebrow: "INFORMACIÓN LEGAL / 02",
    title: "Política de tratamiento de datos personales",
    introduction: "Conoce cómo BeDifferent recopila, utiliza y protege la información personal compartida por nuestros usuarios a través de nuestros canales de atención",
  },
  "politica-de-envios-y-entregas": {
    eyebrow: "INFORMACIÓN LEGAL / 03",
    title: "Política de envíos y entregas",
    introduction: "Conoce nuestras modalidades de entrega, las opciones de recogida y las condiciones de envío de los pedidos de BeDifferent",
  },
  "politica-de-cambios-devoluciones-y-garantias": {
    eyebrow: "INFORMACIÓN LEGAL / 04",
    title: "Política de cambios, devoluciones y garantías",
    introduction: "Consulta las condiciones para solicitar cambios de talla, reportar novedades con tu pedido y ejercer tus derechos como consumidor",
  },
  "politica-de-cookies": {
    eyebrow: "INFORMACIÓN LEGAL / 05",
    title: "Política de cookies",
    introduction: "Conoce cómo utilizamos las cookies y otras tecnologías para mejorar la navegación y experiencia dentro de nuestra página web",
  },
} as const;

type LegalSlug = keyof typeof legalPages;

export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages[slug as LegalSlug];
  return page ? { title: `${page.title} | BeDifferent`, description: page.introduction } : {};
}

export default async function LegalPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = legalPages[slug as LegalSlug];
  if (!page) notFound();

  return (
    <main>
      <SiteHeader />
      <article className="legal-page" id="main-content" tabIndex={-1}>
        <div className="section-kicker"><span>{page.eyebrow}</span><span>BEDIFFERENT / COLOMBIA</span></div>
        <div className="legal-page-intro">
          <p className="eyebrow">DOCUMENTOS Y POLÍTICAS</p>
          <h1>{page.title}</h1>
          <p className="legal-introduction">{page.introduction}.</p>
        </div>
        <section aria-labelledby="legal-content-title" className="legal-content-placeholder">
          <span>CONTENIDO EN PREPARACIÓN</span>
          <h2 id="legal-content-title">Información definitiva próximamente.</h2>
          <p>Este espacio está reservado para publicar el documento completo. La introducción anterior es informativa y no reemplaza el contenido legal definitivo.</p>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
