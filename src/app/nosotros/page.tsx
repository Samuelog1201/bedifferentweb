import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Nuestra filosofía | BeDifferent",
  description: "La mentalidad, los principios y la visión que dan forma a BeDifferent.",
};

const disciplines = [
  {
    image: "/images/editorial/strength.jpg",
    alt: "Una persona entrenando fuerza en un gimnasio",
    label: "FUERZA",
    className: "philosophy-photo philosophy-photo-strength",
  },
  {
    image: "/images/editorial/running.jpg",
    alt: "Corredores avanzan juntos al aire libre",
    label: "MOVIMIENTO",
    className: "philosophy-photo philosophy-photo-running",
  },
  {
    image: "/images/editorial/training.jpg",
    alt: "Atleta realiza una dominada como parte de su entrenamiento",
    label: "CONSTANCIA",
    className: "philosophy-photo philosophy-photo-training",
  },
];

const pillars = [
  ["01", "DISCIPLINA", "Compromiso con aquello que queremos alcanzar."],
  ["02", "CONSTANCIA", "Entender que los resultados se construyen día a día."],
  ["03", "CRECIMIENTO", "Buscar siempre una mejor versión de nosotros mismos."],
  ["04", "SUPERACIÓN", "Aprender a enfrentar nuestros propios límites."],
];

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />
      <div className="philosophy-page" id="main-content" tabIndex={-1}>
        <section aria-labelledby="philosophy-intro-title" className="philosophy-intro">
          <div className="section-kicker"><span>01 / 06 — INTRODUCCIÓN</span><span>BE DIFFERENT / COLOMBIA</span></div>
          <div className="philosophy-intro-copy">
            <p className="eyebrow">UNA MENTALIDAD, TODOS LOS DÍAS.</p>
            <h1 id="philosophy-intro-title">La diferencia<br />se construye<br /><em>cada día.</em></h1>
            <div className="philosophy-intro-bottom">
              <p>Ser diferente no significa ser distinto a los demás. Significa encontrar tu propio camino, construir tu identidad y trabajar cada día por convertirte en quien quieres ser.</p>
              <span>DISCIPLINE MAKES<br />THE DIFFERENCE.</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="philosophy-origin-title" className="philosophy-origin">
          <div className="section-kicker"><span>02 / 06 — CÓMO NACE BEDIFFERENT</span><span>IDENTIDAD EN MOVIMIENTO</span></div>
          <div className="philosophy-origin-grid">
            <div className="philosophy-origin-heading">
              <p className="eyebrow">ROPA CON UNA RAZÓN DE SER.</p>
              <h2 id="philosophy-origin-title">Nacemos de una idea.<br /><em>Crecemos con una mentalidad.</em></h2>
            </div>
            <div className="philosophy-origin-copy">
              <p>BeDifferent nace de una necesidad que identificamos dentro del universo del entrenamiento: encontrar prendas que no solo cumplan una función deportiva, sino que también representen nuestra personalidad, nuestros gustos y la mentalidad que llevamos dentro y fuera del gimnasio.</p>
              <p>Queremos construir una marca que conecte la ropa con una forma de vivir, donde el diseño, la identidad y el movimiento tengan la misma importancia.</p>
            </div>
          </div>
          <figure className="philosophy-origin-image">
            <Image
              alt="Camiseta BeDifferent Original, vista posterior"
              height={900}
              sizes="(max-width: 700px) 100vw, 88vw"
              src="/images/collections/original-back.jpg"
              width={1400}
            />
            <figcaption><span>BE DIFFERENT / ORIGINAL</span><span>IDENTIDAD QUE TE ACOMPAÑA.</span></figcaption>
          </figure>
        </section>

        <section aria-labelledby="philosophy-movement-title" className="philosophy-movement">
          <div className="section-kicker"><span>03 / 06 — MÁS ALLÁ DE UN SOLO DEPORTE</span><span>ENCUENTRA TU PROPIO CAMINO</span></div>
          <div className="philosophy-movement-heading">
            <h2 id="philosophy-movement-title">Diferentes disciplinas.<br /><em>Una misma mentalidad.</em></h2>
            <p>No importa cómo entrenes, qué deporte practiques o cuál sea tu camino. Creemos en las personas que buscan superarse, construir su identidad y avanzar a su manera.</p>
          </div>
          <div className="philosophy-photo-grid">
            {disciplines.map((discipline) => (
              <figure className={discipline.className} key={discipline.label}>
                <Image alt={discipline.alt} height={1000} sizes="(max-width: 700px) 100vw, 33vw" src={discipline.image} width={780} />
                <figcaption>{discipline.label}</figcaption>
              </figure>
            ))}
          </div>
          <p className="philosophy-movement-note">Fuerza, fitness, running, calistenia, otros deportes o streetwear: distintas formas de moverse, expresarse y pertenecer.</p>
        </section>

        <section aria-labelledby="philosophy-pillars-title" className="philosophy-pillars">
          <div className="section-kicker"><span>04 / 06 — LO QUE NOS REPRESENTA</span><span>PRINCIPIOS EN COMÚN</span></div>
          <div className="philosophy-pillars-heading">
            <p className="eyebrow">CUATRO FORMAS DE AVANZAR.</p>
            <h2 id="philosophy-pillars-title">Lo que nos<br /><em>mueve.</em></h2>
          </div>
          <div className="philosophy-pillar-grid">
            {pillars.map(([number, title, description]) => (
              <article className="philosophy-pillar" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="philosophy-vision-title" className="philosophy-vision">
          <div className="section-kicker"><span>05 / 06 — NUESTRA VISIÓN</span><span>MORE THAN CLOTHING</span></div>
          <div className="philosophy-vision-content">
            <p className="eyebrow">UNA COMUNIDAD, MUCHOS CAMINOS.</p>
            <h2 id="philosophy-vision-title">No se trata solo de lo que vistes.<br /><em>Se trata de lo que representas.</em></h2>
            <p>Queremos que BeDifferent sea más que una marca de ropa. Buscamos construir una comunidad de personas que compartan una mentalidad de disciplina, crecimiento y superación, sin importar sus diferencias.</p>
          </div>
        </section>

        <section aria-labelledby="philosophy-close-title" className="philosophy-close">
          <div className="section-kicker"><span>06 / 06 — SIGUE TU CAMINO</span><span>BE DIFFERENT</span></div>
          <div>
            <p className="eyebrow">MORE THAN CLOTHING.</p>
            <h2 id="philosophy-close-title">DISCIPLINE MAKES<br /><em>THE DIFFERENCE.</em></h2>
          </div>
          <Link className="button button-light" href="/catalogo">Explorar colección <ArrowUpRight aria-hidden="true" size={16} /></Link>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
