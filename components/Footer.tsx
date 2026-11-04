import Link from "next/link";
import { AtSign } from "lucide-react";
import Logo from "./Logo";

const REDES = [
  { href: "https://www.instagram.com/lezcanodani", label: "@lezcanodani", detalle: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="border-t border-crema-200 bg-crema-50/70">
      <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.1fr_.8fr_.8fr_1fr_1.1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-tinta/55">
            Información económica con fines educativos. Los contenidos no constituyen recomendación de inversión.
          </p>
        </div>

        <div>
          <b className="text-xs uppercase tracking-wider">Explorar</b>
          <div className="mt-3 space-y-2 text-sm text-tinta/60">
            <Link className="block hover:text-oliva" href="/">Mercado</Link>
            <Link className="block hover:text-oliva" href="/series">Series</Link>
            <Link className="block hover:text-oliva" href="/#macro">Macro</Link>
            <Link className="block hover:text-oliva" href="/#herramientas">Herramientas</Link>
            <Link className="block hover:text-oliva" href="/sobre-mi">Sobre mí</Link>
          </div>
        </div>

        <div>
          <b className="text-xs uppercase tracking-wider">Aprender</b>
          <div className="mt-3 space-y-2 text-sm text-tinta/60">
            <a className="block hover:text-oliva" href="https://econoclases-academy.vercel.app/" target="_blank" rel="noopener noreferrer">EconoClases Academy</a>
            <a className="block hover:text-oliva" href="https://econoclases.vercel.app" target="_blank" rel="noopener noreferrer">EconoClases</a>
            <a className="block hover:text-oliva" href="mailto:daniel.lezcano.032@gmail.com?subject=Consulta%20por%20clases">Clases particulares</a>
          </div>
        </div>

        <div>
          <b className="text-xs uppercase tracking-wider">Fuentes de datos</b>
          <p className="mt-3 text-xs leading-relaxed text-tinta/55">
            dolarapi.com, argentinadatos.com, BCRA API Estadísticas v4.0, data912.com y Yahoo Finance. Las metodologías específicas se detallan en cada indicador o herramienta.
          </p>
        </div>

        <div>
          <b className="text-xs uppercase tracking-wider">Seguime</b>
          <div className="mt-3 space-y-3 text-sm text-tinta/60">
            {REDES.map((r) => (
              <a key={r.href} href={r.href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 hover:text-oliva">
                <AtSign className="mt-0.5 h-4 w-4 shrink-0 text-oliva/70 group-hover:text-oliva" aria-hidden="true" />
                <span>
                  <span className="block font-semibold">{r.label}</span>
                  <span className="block text-xs text-tinta/45">{r.detalle}</span>
                </span>
              </a>
            ))}
            <a className="block text-xs font-semibold hover:text-oliva" href="https://lezcano-analytics-portfolio.vercel.app" target="_blank" rel="noopener noreferrer">
              Portfolio profesional →
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-crema-200 py-5 text-center text-[11px] text-tinta/45">
        DL Mercado · Datos, herramientas y educación económica.
      </div>
    </footer>
  );
}
