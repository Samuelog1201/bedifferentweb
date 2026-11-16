import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const collections: {
  name: string;
  number: string;
  image: string;
  alt: string;
  backImage?: string;
  note: string;
  className: string;
}[] = [
  {
    name: "ORIGINAL",
    number: "01",
    image: "/images/collections/original-front.jpg",
    alt: "Camiseta negra Original BeDifferent, vista frontal",
    backImage: "/images/collections/original-back.jpg",
    note: "BE DIFFERENT AL FRENTE. DISCIPLINE MAKES THE DIFFERENCE. EN VERTICAL.",
    className: "collection-editorial-card collection-original",
  },
  {
    name: "BE DIFFERENT × ANIME",
    number: "02",
    image: "/images/collections/anime-campaign.jpg",
    alt: "Composición de referencia para la colección BeDifferent por Anime",
    note: "UNA NUEVA LÍNEA DE EXPRESIÓN, CON SU PROPIO LENGUAJE VISUAL.",
    className: "collection-editorial-card collection-anime",
  },
];

export function CollectionEditorial() {
  return (
    <section aria-labelledby="collections-title" className="collections-section" id="colecciones">
      <div className="section-kicker"><span>02 — COLECCIONES</span><span>FITNESS LIFESTYLE / COLOMBIA</span></div>
      <div className="section-heading collections-heading">
        <h2 id="collections-title">Una mentalidad.<br /><strong>Diferentes expresiones.</strong></h2>
        <p>Diseños que representan quién eres y la mentalidad que llevas contigo.</p>
      </div>
      <div className="collection-editorial-grid">
        {collections.map((collection) => (
          <article className={collection.className} key={collection.name}>
            <Link aria-label={`Explorar el catálogo: ${collection.name}`} className="collection-editorial-image" href="/catalogo">
              {collection.backImage ? (
                <span className="collection-image-duo">
                  <span className="collection-image-side"><Image alt={collection.alt} className="collection-editorial-photo" height={1000} sizes="(max-width: 700px) 50vw, 25vw" src={collection.image} width={700} /><span>FRENTE</span></span>
                  <span className="collection-image-side"><Image alt="Camiseta negra Original BeDifferent, vista posterior con la frase vertical" className="collection-editorial-photo" height={1000} sizes="(max-width: 700px) 50vw, 25vw" src={collection.backImage} width={700} /><span>ESPALDA</span></span>
                </span>
              ) : <Image alt={collection.alt} className="collection-editorial-photo" height={1100} sizes="(max-width: 700px) 100vw, 50vw" src={collection.image} width={1400} />}
              <span className="collection-image-number">BD / {collection.number}</span>
            </Link>
            <div className="collection-editorial-meta">
              <div><span className="eyebrow">COLECCIÓN / {collection.number}</span><h3>{collection.name}</h3></div>
              <p>{collection.note}</p>
              <Link aria-label={`Ver catálogo para ${collection.name}`} className="collection-arrow" href="/catalogo"><ArrowUpRight aria-hidden="true" size={20} /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
